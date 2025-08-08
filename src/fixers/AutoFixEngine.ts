/**
 * AutoFixEngine - Core auto-fix engine for Phase 3
 *
 * Applies Biome fixes to files using version-specific adapters.
 * Implements sequential fix order and tracks statistics.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { execa } from 'execa';
import type { Config } from '../types/config.js';
import { detectBiomeVersion } from '../utils/versionDetector.js';
import type { BiomeAdapter, ValidationIssue } from '../validators/biome/adapters/BiomeAdapter.js';
import { createAdapterFromDetection } from '../validators/biome/adapters/BiomeAdapterFactory.js';

/**
 * Fix statistics tracking
 */
export interface FixStatistics {
  totalIssues: number;
  fixedIssues: number;
  remainingIssues: number;
  fixDuration: number;
  fixAttempts: number;
}

/**
 * Fix result interface
 */
export interface FixResult {
  success: boolean;
  modified: boolean;
  content?: string;
  statistics: FixStatistics;
  errors: string[];
  fixesApplied: string[];
}

/**
 * File information for fixing
 */
export interface FileInfo {
  path: string;
  content: string;
  issues: ValidationIssue[];
}

/**
 * AutoFixEngine class - applies fixes sequentially and safely
 */
export class AutoFixEngine {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Apply fixes to a file with issues
   * @param fileInfo - File information with issues to fix
   * @returns Fix result with statistics and updated content
   */
  async applyFixes(fileInfo: FileInfo): Promise<FixResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const fixesApplied: string[] = [];
    const originalIssueCount = fileInfo.issues.length;

    // Check if auto-fix is enabled
    if (!this.config.autoFix.enabled) {
      return {
        success: true,
        modified: false,
        content: fileInfo.content,
        statistics: {
          totalIssues: originalIssueCount,
          fixedIssues: 0,
          remainingIssues: originalIssueCount,
          fixDuration: 0,
          fixAttempts: 0,
        },
        errors: [],
        fixesApplied: [],
      };
    }

    // Filter fixable issues
    const fixableIssues = this.filterFixableIssues(fileInfo.issues);
    if (fixableIssues.length === 0) {
      return {
        success: true,
        modified: false,
        content: fileInfo.content,
        statistics: {
          totalIssues: originalIssueCount,
          fixedIssues: 0,
          remainingIssues: originalIssueCount,
          fixDuration: Date.now() - startTime,
          fixAttempts: 0,
        },
        errors: [],
        fixesApplied: [],
      };
    }

    let currentContent = fileInfo.content;
    let fixAttempts = 0;
    const _maxAttempts = this.config.autoFix.maxAttempts || 3;

    try {
      // Create backup of original content
      await this.createBackup(fileInfo.path, fileInfo.content);

      // Apply Biome fixes if we have Biome issues
      const biomeIssues = fixableIssues.filter((issue) => this.isBiomeIssue(issue));
      if (biomeIssues.length > 0) {
        const biomeResult = await this.applyBiomeFixes(fileInfo.path, biomeIssues);
        if (biomeResult.success) {
          currentContent = biomeResult.content || currentContent;
          fixesApplied.push(...biomeResult.fixesApplied);
          fixAttempts += biomeResult.attempts;
        } else {
          errors.push(...biomeResult.errors);
        }
      }

      // Only read final content if we have successful fixes
      const hasSuccessfulFixes = fixesApplied.length > 0 && errors.length === 0;
      let finalContent = currentContent;
      let isModified = false;

      if (hasSuccessfulFixes) {
        try {
          finalContent = await this.readFixedContent(fileInfo.path);
          isModified = finalContent !== fileInfo.content;
          if (isModified) {
            currentContent = finalContent;
          }
        } catch (readError) {
          // If we can't read the fixed content, treat as error but preserve current content
          const errorMessage = readError instanceof Error ? readError.message : String(readError);
          errors.push(`Failed to read fixed content: ${errorMessage}`);
        }
      }

      const fixDuration = Date.now() - startTime;
      const fixedCount = fixesApplied.length;

      return {
        success: errors.length === 0,
        modified: isModified,
        content: errors.length === 0 ? currentContent : fileInfo.content, // Preserve original on error
        statistics: {
          totalIssues: originalIssueCount,
          fixedIssues: fixedCount,
          remainingIssues: Math.max(0, originalIssueCount - fixedCount),
          fixDuration,
          fixAttempts,
        },
        errors,
        fixesApplied,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        modified: false,
        content: fileInfo.content,
        statistics: {
          totalIssues: originalIssueCount,
          fixedIssues: 0,
          remainingIssues: originalIssueCount,
          fixDuration: Date.now() - startTime,
          fixAttempts,
        },
        errors: [errorMessage],
        fixesApplied: [],
      };
    }
  }

  /**
   * Filter issues to find fixable ones
   */
  private filterFixableIssues(issues: ValidationIssue[]): ValidationIssue[] {
    return issues.filter((issue) => issue.fixable && !issue.fixed);
  }

  /**
   * Check if issue is from Biome validator
   */
  private isBiomeIssue(issue: ValidationIssue): boolean {
    // This is a simple check - in reality we might need more sophisticated logic
    // For now, assume all fixable issues can be handled by Biome
    return issue.fixable;
  }

  /**
   * Apply Biome fixes to file
   */
  private async applyBiomeFixes(
    filePath: string,
    issues: ValidationIssue[]
  ): Promise<{
    success: boolean;
    content?: string;
    fixesApplied: string[];
    errors: string[];
    attempts: number;
  }> {
    const fixesApplied: string[] = [];
    const errors: string[] = [];

    try {
      // Detect Biome version and create adapter
      const versionInfo = await detectBiomeVersion();
      const adapter = createAdapterFromDetection(versionInfo);

      // Group issues by fix type for sequential application
      const formatIssues = issues.filter((issue) => this.isFormatIssue(issue));
      const importIssues = issues.filter((issue) => this.isImportIssue(issue));
      const lintIssues = issues.filter((issue) => this.isLintIssue(issue));

      // Apply fixes in sequential order: format → imports → lint
      let attempts = 0;

      // 1. Apply formatting fixes
      if (formatIssues.length > 0) {
        const formatResult = await this.executeBiomeFix(filePath, adapter, 'format');
        attempts++;
        if (formatResult.success) {
          fixesApplied.push(`Fixed ${formatIssues.length} formatting issue(s)`);
        } else {
          errors.push(formatResult.error || 'Format fix failed');
        }
      }

      // 2. Apply import organization fixes
      if (importIssues.length > 0) {
        const importResult = await this.executeBiomeFix(filePath, adapter, 'imports');
        attempts++;
        if (importResult.success) {
          fixesApplied.push(`Fixed ${importIssues.length} import issue(s)`);
        } else {
          errors.push(importResult.error || 'Import fix failed');
        }
      }

      // 3. Apply lint fixes
      if (lintIssues.length > 0) {
        const lintResult = await this.executeBiomeFix(filePath, adapter, 'lint');
        attempts++;
        if (lintResult.success) {
          fixesApplied.push(`Fixed ${lintIssues.length} lint issue(s)`);
        } else {
          errors.push(lintResult.error || 'Lint fix failed');
        }
      }

      // Read updated content
      const updatedContent = await this.readFixedContent(filePath);

      return {
        success: errors.length === 0,
        content: updatedContent,
        fixesApplied,
        errors,
        attempts,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        fixesApplied: [],
        errors: [errorMessage],
        attempts: 1,
      };
    }
  }

  /**
   * Execute Biome fix command
   */
  private async executeBiomeFix(
    filePath: string,
    adapter: BiomeAdapter,
    _fixType: 'format' | 'imports' | 'lint'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fixFlag = adapter.getFixFlag(false); // Only safe fixes
      const command = ['biome', 'check', filePath];

      // Add fix flags (split by space if needed)
      const fixFlags = fixFlag.split(' ').filter((flag: string) => flag.length > 0);
      command.push(...fixFlags);

      command.push('--reporter=json');

      // Add no-colors flag for Biome 2.x
      if (adapter.version === '2.x') {
        command.push('--no-colors');
      }

      if (command.length === 0) {
        return { success: false, error: 'Empty command array' };
      }

      const firstCommand = command[0];
      if (!firstCommand) {
        return { success: false, error: 'First command is empty' };
      }

      const result = await execa(firstCommand, command.slice(1), {
        timeout: this.config.timeout || 5000,
        cwd: process.cwd(),
      });

      return { success: result.exitCode === 0 || result.exitCode === 1 }; // 1 is OK for fixes applied
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if issue is formatting related
   */
  private isFormatIssue(issue: ValidationIssue): boolean {
    const formatKeywords = ['format', 'indent', 'spacing', 'semicolon', 'quotes'];
    const message = issue.message.toLowerCase();
    return formatKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Check if issue is import related
   */
  private isImportIssue(issue: ValidationIssue): boolean {
    const importKeywords = ['import', 'unused', 'organize'];
    const message = issue.message.toLowerCase();
    return importKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * Check if issue is lint related
   */
  private isLintIssue(issue: ValidationIssue): boolean {
    return !this.isFormatIssue(issue) && !this.isImportIssue(issue);
  }

  /**
   * Create backup of original file content
   */
  private async createBackup(filePath: string, content: string): Promise<void> {
    const backupPath = `${filePath}.backup`;
    try {
      await writeFile(backupPath, content, 'utf-8');
    } catch (error) {
      // Backup failure is not critical, log but continue
      console.warn(`Failed to create backup for ${filePath}:`, error);
    }
  }

  /**
   * Read file content after fixes have been applied
   */
  private async readFixedContent(filePath: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read fixed content from ${filePath}: ${error}`);
    }
  }
}
