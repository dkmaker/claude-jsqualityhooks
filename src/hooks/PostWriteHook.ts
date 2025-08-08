/**
 * Post-write hook for claude-jsqualityhooks
 *
 * This module implements the PostWriteHook that processes files after
 * Claude Code writes or modifies them. It handles validation, auto-fixing,
 * and AI-optimized output formatting.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import type { Config } from '../types/config.js';
import type { FileInfo, HookResult } from '../types/hooks.js';
import { BaseHook } from './BaseHook.js';
import { PatternMatcher } from './PatternMatcher.js';
import { ValidatorManager, type ValidationResponse } from '../validators/ValidatorManager.js';

/**
 * Post-write hook that processes files after Claude writes them
 *
 * Features:
 * - File pattern matching (include/exclude)
 * - File validation preparation
 * - Extensible for validators (Phase 2)
 * - AI-optimized output formatting
 * - Non-blocking error handling
 */
export class PostWriteHook extends BaseHook {
  readonly name = 'postWrite';

  private readonly patternMatcher: PatternMatcher;
  private readonly validatorManager: ValidatorManager;

  constructor(config: Config) {
    super(config);

    // Initialize pattern matcher with config patterns
    this.patternMatcher = new PatternMatcher(config.include, config.exclude);

    // Initialize validator manager
    this.validatorManager = new ValidatorManager(config);
  }

  /**
   * Execute post-write hook on file
   */
  protected async executeHook(file: FileInfo): Promise<Omit<HookResult, 'duration' | 'success'>> {
    this.info(`Processing file: ${file.path}`);

    // Check if file should be validated based on patterns
    if (!this.shouldValidateFile(file)) {
      this.info(`Skipping file (does not match patterns): ${file.path}`);
      return {
        modified: false,
        metadata: {
          reason: 'skipped_pattern_mismatch',
          patterns: this.patternMatcher.getPatterns(),
        },
      };
    }

    // Ensure file info is complete
    const completeFileInfo = await this.enrichFileInfo(file);

    // Execute validators using ValidatorManager
    const validationResult = await this.executeValidators(completeFileInfo);

    // TODO: Phase 3 - Add auto-fix logic here
    // This is where we'll apply automatic fixes if enabled
    const fixResult = await this.executeAutoFix(completeFileInfo, validationResult);

    // TODO: Phase 4 - Format output for AI
    // This is where we'll format results for Claude consumption
    const _formattedOutput = await this.formatForAI(validationResult, fixResult);

    return {
      modified: fixResult.modified,
      validation: validationResult.validation,
      metadata: {
        validated: true,
        patterns: this.patternMatcher.getPatterns(),
        validationStats: validationResult.stats,
        fixStats: fixResult.stats,
        formatted: true,
      },
    };
  }

  /**
   * Check if file should be validated based on include/exclude patterns
   */
  private shouldValidateFile(file: FileInfo): boolean {
    try {
      return this.patternMatcher.shouldValidate(file.path);
    } catch (error) {
      this.warn(
        `Pattern matching failed for ${file.path}`,
        error instanceof Error ? error : undefined
      );
      // On error, be conservative and validate the file
      return true;
    }
  }

  /**
   * Enrich file info with additional metadata
   */
  private async enrichFileInfo(file: FileInfo): Promise<FileInfo> {
    try {
      const enriched: FileInfo = { ...file };

      // Ensure we have file extension
      if (!enriched.extension) {
        enriched.extension = extname(file.path);
      }

      // Check if file exists and get stats
      if (existsSync(file.path)) {
        enriched.exists = true;

        const stats = statSync(file.path);
        enriched.size = stats.size;
        enriched.lastModified = stats.mtime.getTime();

        // If content is missing, try to read from disk
        if (!enriched.content) {
          try {
            enriched.content = readFileSync(file.path, 'utf-8');
          } catch (readError) {
            this.warn(
              `Failed to read file content: ${file.path}`,
              readError instanceof Error ? readError : undefined
            );
            enriched.content = '';
          }
        }
      } else {
        enriched.exists = false;
        enriched.size = file.content?.length ?? 0;
        enriched.content = file.content ?? '';
      }

      return enriched;
    } catch (error) {
      this.warn(
        `Failed to enrich file info for ${file.path}`,
        error instanceof Error ? error : undefined
      );
      return file;
    }
  }

  /**
   * Execute validators using ValidatorManager
   */
  private async executeValidators(file: FileInfo): Promise<{
    validation?: ValidationResponse;
    stats: { validatorsRun: number; issuesFound: number };
  }> {
    try {
      this.info(`Running validators for: ${file.path}`);

      const validationResponse = await this.validatorManager.validateFile(file);

      // Log validation results
      if (validationResponse.cached) {
        this.info(`Used cached validation results for: ${file.path}`);
      }

      if (validationResponse.summary.totalIssues > 0) {
        this.warn(
          `Found ${validationResponse.summary.totalIssues} issues in ${file.path} ` +
            `(${validationResponse.summary.errorCount} errors, ${validationResponse.summary.warningCount} warnings)`
        );
      }

      // Log performance if validation took longer than expected
      if (validationResponse.performance.totalDuration > 1000) {
        this.warn(
          `Validation took ${validationResponse.performance.totalDuration.toFixed(1)}ms for ${file.path} ` +
            `(efficiency: ${(validationResponse.performance.parallelEfficiency * 100).toFixed(1)}%)`
        );
      }

      return {
        validation: validationResponse,
        stats: {
          validatorsRun: validationResponse.summary.successfulValidators,
          issuesFound: validationResponse.summary.totalIssues,
        },
      };
    } catch (error) {
      this.warn(
        `Validator execution failed for ${file.path}`,
        error instanceof Error ? error : undefined
      );

      // Return safe fallback result
      return {
        stats: {
          validatorsRun: 0,
          issuesFound: 0,
        },
      };
    }
  }

  /**
   * Execute auto-fix (placeholder for Phase 3)
   */
  private async executeAutoFix(
    file: FileInfo,
    _validationResult: unknown
  ): Promise<{
    modified: boolean;
    stats: { fixesApplied: number; fixesFailed: number };
  }> {
    // TODO: Phase 3 - Implement auto-fix logic
    // For now, return placeholder result
    this.info(`Auto-fix would run for: ${file.path}`);

    return {
      modified: false,
      stats: {
        fixesApplied: 0,
        fixesFailed: 0,
      },
    };
  }

  /**
   * Format results for AI consumption (placeholder for Phase 4)
   */
  private async formatForAI(
    _validationResult: unknown,
    _fixResult: unknown
  ): Promise<{ formatted: boolean }> {
    // TODO: Phase 4 - Implement AI-optimized formatting
    // For now, return placeholder result
    return { formatted: true };
  }

  /**
   * Get current pattern matcher (for testing)
   */
  getPatternMatcher(): PatternMatcher {
    return this.patternMatcher;
  }

  /**
   * Get validator manager (for testing)
   */
  getValidatorManager(): ValidatorManager {
    return this.validatorManager;
  }
}
