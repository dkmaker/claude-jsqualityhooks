/**
 * FixVerifier
 *
 * Verifies that fixes were applied successfully and no new issues were introduced.
 * Re-runs validators on fixed content and compares results with original state.
 */

import { stat } from 'node:fs/promises';
import type { Config } from '../types/config.js';
import type { FileInfo } from '../types/hooks.js';
import type { ValidationIssue } from '../validators/biome/adapters/BiomeAdapter.js';
import { type ValidationResponse, ValidatorManager } from '../validators/ValidatorManager.js';

/**
 * Issue comparison result
 */
export interface IssueComparison {
  /** Issues resolved by fixes */
  resolved: ValidationIssue[];
  /** Issues that remain after fixes */
  remaining: ValidationIssue[];
  /** New issues introduced by fixes */
  newIssues: ValidationIssue[];
  /** Total original issues count */
  originalCount: number;
  /** Total remaining issues count */
  remainingCount: number;
  /** Total new issues count */
  newCount: number;
  /** Fix success rate (0-1) */
  successRate: number;
}

/**
 * File integrity check result
 */
export interface FileIntegrityResult {
  /** Whether file exists and is readable */
  exists: boolean;
  /** Whether file has valid syntax */
  validSyntax: boolean;
  /** Whether file size is reasonable */
  reasonableSize: boolean;
  /** Whether file is empty */
  isEmpty: boolean;
  /** Whether encoding is preserved */
  encodingPreserved: boolean;
  /** File size in bytes */
  size: number;
  /** Any corruption indicators */
  corruptionIndicators: string[];
}

/**
 * Verification metrics
 */
export interface VerificationMetrics {
  /** Total verification time */
  totalDuration: number;
  /** Validation re-run time */
  validationDuration: number;
  /** File integrity check time */
  integrityCheckDuration: number;
  /** Issue comparison time */
  comparisonDuration: number;
  /** Performance efficiency vs original validation */
  efficiency: number;
}

/**
 * Complete verification result
 */
export interface VerificationResult {
  /** Overall verification success */
  success: boolean;
  /** Whether file was actually modified */
  fileModified: boolean;
  /** Fix effectiveness assessment */
  effectiveness: 'excellent' | 'good' | 'partial' | 'poor' | 'failed';
  /** Issue comparison results */
  issues: IssueComparison;
  /** File integrity status */
  integrity: FileIntegrityResult;
  /** Re-validation results */
  validation: ValidationResponse;
  /** Performance metrics */
  metrics: VerificationMetrics;
  /** Verification warnings or notes */
  warnings: string[];
  /** Detailed verification report */
  report: string;
}

/**
 * FixVerifier class for validating fix application results
 */
export class FixVerifier {
  private validatorManager: ValidatorManager;

  constructor(config: Config) {
    this.validatorManager = new ValidatorManager(config);
  }

  /**
   * Verify fixes applied to a file
   */
  async verifyFixes(
    filePath: string,
    originalContent: string,
    fixedContent: string,
    originalValidation: ValidationResponse
  ): Promise<VerificationResult> {
    const startTime = performance.now();
    const warnings: string[] = [];

    try {
      // Step 1: Check file integrity
      const integrityStartTime = performance.now();
      const integrity = await this.checkFileIntegrity(filePath, originalContent, fixedContent);
      const integrityCheckDuration = performance.now() - integrityStartTime;

      // Add integrity warnings
      if (!integrity.validSyntax) {
        warnings.push('File syntax may be invalid after fixes');
      }
      if (integrity.isEmpty) {
        warnings.push('File is empty after fixes - potential data loss');
      }
      if (integrity.corruptionIndicators.length > 0) {
        warnings.push(`File corruption detected: ${integrity.corruptionIndicators.join(', ')}`);
      }

      // Step 2: Re-run validation on fixed content
      const validationStartTime = performance.now();
      const fileInfo: FileInfo = {
        path: filePath,
        content: fixedContent,
        extension: this.getFileExtension(filePath),
        exists: integrity.exists,
        size: integrity.size,
        lastModified: Date.now(),
      };

      const newValidation = await this.validatorManager.validateFile(fileInfo);
      const validationDuration = performance.now() - validationStartTime;

      // Step 3: Compare issue counts and identify changes
      const comparisonStartTime = performance.now();
      const issueComparison = this.compareIssues(originalValidation, newValidation);
      const comparisonDuration = performance.now() - comparisonStartTime;

      // Step 4: Calculate metrics
      const totalDuration = performance.now() - startTime;
      const metrics: VerificationMetrics = {
        totalDuration,
        validationDuration,
        integrityCheckDuration,
        comparisonDuration,
        efficiency: this.calculateEfficiency(
          originalValidation.performance.totalDuration,
          totalDuration
        ),
      };

      // Step 5: Assess overall effectiveness
      const effectiveness = this.assessEffectiveness(issueComparison, integrity);

      // Step 6: Determine overall success
      const success = this.determineSuccess(issueComparison, integrity, newValidation);

      // Step 7: Generate report
      const report = this.generateVerificationReport(
        originalValidation,
        newValidation,
        issueComparison,
        integrity,
        metrics
      );

      // Add specific warnings for new issues
      if (issueComparison.newCount > 0) {
        warnings.push(`${issueComparison.newCount} new issues introduced by fixes`);
      }

      return {
        success,
        fileModified: originalContent !== fixedContent,
        effectiveness,
        issues: issueComparison,
        integrity,
        validation: newValidation,
        metrics,
        warnings,
        report,
      };
    } catch (error) {
      const totalDuration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      warnings.push(`Verification failed: ${errorMessage}`);

      // Return failure result with minimal data
      return {
        success: false,
        fileModified: originalContent !== fixedContent,
        effectiveness: 'failed',
        issues: {
          resolved: [],
          remaining: [],
          newIssues: [],
          originalCount: originalValidation.summary.totalIssues,
          remainingCount: originalValidation.summary.totalIssues,
          newCount: 0,
          successRate: 0,
        },
        integrity: {
          exists: false,
          validSyntax: false,
          reasonableSize: false,
          isEmpty: true,
          encodingPreserved: false,
          size: 0,
          corruptionIndicators: ['verification-failed'],
        },
        validation: originalValidation,
        metrics: {
          totalDuration,
          validationDuration: 0,
          integrityCheckDuration: 0,
          comparisonDuration: 0,
          efficiency: 0,
        },
        warnings,
        report: `Verification failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Check file integrity after fixes
   */
  private async checkFileIntegrity(
    filePath: string,
    originalContent: string,
    fixedContent: string
  ): Promise<FileIntegrityResult> {
    const corruptionIndicators: string[] = [];

    try {
      // Check if file exists
      const stats = await stat(filePath);
      const exists = true;
      const size = stats.size;

      // Check if file is empty
      const isEmpty = fixedContent.trim().length === 0;
      if (isEmpty && originalContent.trim().length > 0) {
        corruptionIndicators.push('content-disappeared');
      }

      // Check if file size is reasonable (not too small or too large)
      const originalSize = Buffer.byteLength(originalContent, 'utf8');
      const fixedSize = Buffer.byteLength(fixedContent, 'utf8');
      const sizeRatio = originalSize > 0 ? fixedSize / originalSize : 1;
      const reasonableSize = sizeRatio > 0.1 && sizeRatio < 10; // Allow 10x size changes

      if (!reasonableSize) {
        corruptionIndicators.push(`suspicious-size-change-${sizeRatio.toFixed(2)}x`);
      }

      // Basic syntax validation for common file types
      const validSyntax = this.validateBasicSyntax(filePath, fixedContent);
      if (!validSyntax) {
        corruptionIndicators.push('syntax-errors');
      }

      // Check encoding preservation (basic UTF-8 check)
      const encodingPreserved = this.checkEncodingPreservation(originalContent, fixedContent);
      if (!encodingPreserved) {
        corruptionIndicators.push('encoding-issues');
      }

      return {
        exists,
        validSyntax,
        reasonableSize,
        isEmpty,
        encodingPreserved,
        size,
        corruptionIndicators,
      };
    } catch (error) {
      return {
        exists: false,
        validSyntax: false,
        reasonableSize: false,
        isEmpty: true,
        encodingPreserved: false,
        size: 0,
        corruptionIndicators: [
          'file-access-error',
          error instanceof Error ? error.message : String(error),
        ],
      };
    }
  }

  /**
   * Compare issues between original and new validation results
   */
  private compareIssues(
    original: ValidationResponse,
    updated: ValidationResponse
  ): IssueComparison {
    // Flatten all issues from all validators
    const originalIssues = original.results.flatMap((result) => result.issues);
    const updatedIssues = updated.results.flatMap((result) => result.issues);

    // Create issue signatures for comparison
    const createSignature = (issue: ValidationIssue): string =>
      `${issue.file}:${issue.line}:${issue.column}:${issue.message}`;

    const originalSignatures = new Set(originalIssues.map(createSignature));
    const updatedSignatures = new Set(updatedIssues.map(createSignature));

    // Find resolved issues (in original but not in updated)
    const resolved = originalIssues.filter(
      (issue) => !updatedSignatures.has(createSignature(issue))
    );

    // Find remaining issues (in both original and updated)
    const remaining = updatedIssues.filter((issue) =>
      originalSignatures.has(createSignature(issue))
    );

    // Find new issues (in updated but not in original)
    const newIssues = updatedIssues.filter(
      (issue) => !originalSignatures.has(createSignature(issue))
    );

    const originalCount = originalIssues.length;
    const remainingCount = remaining.length;
    const newCount = newIssues.length;
    const successRate = originalCount > 0 ? resolved.length / originalCount : 1.0;

    return {
      resolved,
      remaining,
      newIssues,
      originalCount,
      remainingCount,
      newCount,
      successRate,
    };
  }

  /**
   * Assess fix effectiveness based on issue comparison and file integrity
   */
  private assessEffectiveness(
    issues: IssueComparison,
    integrity: FileIntegrityResult
  ): VerificationResult['effectiveness'] {
    // If file is corrupted, effectiveness is failed
    if (!integrity.exists || integrity.isEmpty || integrity.corruptionIndicators.length > 0) {
      return 'failed';
    }

    // If new issues were introduced, effectiveness is reduced
    if (issues.newCount > 0) {
      if (issues.newCount > issues.resolved.length) {
        return 'poor';
      }
      if (issues.successRate >= 0.7) {
        return 'partial';
      }
      return 'poor';
    }

    // Based on success rate
    if (issues.successRate >= 0.9) {
      return 'excellent';
    } else if (issues.successRate >= 0.7) {
      return 'good';
    } else if (issues.successRate >= 0.3) {
      return 'partial';
    } else if (issues.successRate > 0) {
      return 'poor';
    } else {
      return 'failed';
    }
  }

  /**
   * Determine overall verification success
   */
  private determineSuccess(
    issues: IssueComparison,
    integrity: FileIntegrityResult,
    validation: ValidationResponse
  ): boolean {
    // Fail if file integrity is compromised
    if (!integrity.exists || integrity.isEmpty || !integrity.encodingPreserved) {
      return false;
    }

    // Fail if validation itself failed
    if (!validation.success && validation.summary.errorCount > 0) {
      return false;
    }

    // Fail if more new issues than resolved issues
    if (issues.newCount > issues.resolved.length) {
      return false;
    }

    // Success if some progress was made or no issues to begin with
    return issues.resolved.length > 0 || issues.originalCount === 0;
  }

  /**
   * Generate comprehensive verification report
   */
  private generateVerificationReport(
    _original: ValidationResponse,
    updated: ValidationResponse,
    issues: IssueComparison,
    integrity: FileIntegrityResult,
    metrics: VerificationMetrics
  ): string {
    const lines: string[] = [];

    lines.push('## Fix Verification Report');
    lines.push('');

    // Summary
    lines.push('### Summary');
    lines.push(`- Original issues: ${issues.originalCount}`);
    lines.push(`- Issues resolved: ${issues.resolved.length}`);
    lines.push(`- Issues remaining: ${issues.remainingCount}`);
    lines.push(`- New issues: ${issues.newCount}`);
    lines.push(`- Success rate: ${(issues.successRate * 100).toFixed(1)}%`);
    lines.push('');

    // File integrity
    lines.push('### File Integrity');
    lines.push(`- File exists: ${integrity.exists ? '✓' : '✗'}`);
    lines.push(`- Valid syntax: ${integrity.validSyntax ? '✓' : '✗'}`);
    lines.push(`- Reasonable size: ${integrity.reasonableSize ? '✓' : '✗'}`);
    lines.push(`- File size: ${integrity.size} bytes`);
    lines.push(`- Encoding preserved: ${integrity.encodingPreserved ? '✓' : '✗'}`);

    if (integrity.corruptionIndicators.length > 0) {
      lines.push(`- Corruption indicators: ${integrity.corruptionIndicators.join(', ')}`);
    }
    lines.push('');

    // Performance
    lines.push('### Performance');
    lines.push(`- Total verification time: ${metrics.totalDuration.toFixed(2)}ms`);
    lines.push(`- Validation time: ${metrics.validationDuration.toFixed(2)}ms`);
    lines.push(`- Integrity check time: ${metrics.integrityCheckDuration.toFixed(2)}ms`);
    lines.push(`- Comparison time: ${metrics.comparisonDuration.toFixed(2)}ms`);
    lines.push(`- Efficiency: ${(metrics.efficiency * 100).toFixed(1)}%`);
    lines.push('');

    // Validator results
    if (updated.results.length > 0) {
      lines.push('### Validator Results');
      for (const result of updated.results) {
        const status = result.status === 'success' ? '✓' : result.status === 'warning' ? '⚠' : '✗';
        lines.push(
          `- ${result.validator}: ${status} (${result.issues.length} issues, ${result.duration.toFixed(2)}ms)`
        );
      }
      lines.push('');
    }

    // Issues breakdown
    if (issues.newCount > 0) {
      lines.push('### New Issues Introduced');
      for (const issue of issues.newIssues.slice(0, 10)) {
        // Limit to first 10
        lines.push(`- Line ${issue.line}: ${issue.message}`);
      }
      if (issues.newIssues.length > 10) {
        lines.push(`- ... and ${issues.newIssues.length - 10} more`);
      }
      lines.push('');
    }

    if (issues.resolved.length > 0) {
      lines.push('### Issues Resolved');
      for (const issue of issues.resolved.slice(0, 10)) {
        // Limit to first 10
        lines.push(`- Line ${issue.line}: ${issue.message}`);
      }
      if (issues.resolved.length > 10) {
        lines.push(`- ... and ${issues.resolved.length - 10} more`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Basic syntax validation for common file types
   */
  private validateBasicSyntax(filePath: string, content: string): boolean {
    const extension = this.getFileExtension(filePath);

    try {
      switch (extension) {
        case '.json':
          JSON.parse(content);
          return true;
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
          // Basic check for balanced braces/brackets/parens
          return this.checkBalancedDelimiters(content);
        default:
          // For other file types, just check it's not binary junk
          return this.isTextContent(content);
      }
    } catch {
      return false;
    }
  }

  /**
   * Check if content has balanced delimiters
   */
  private checkBalancedDelimiters(content: string): boolean {
    const pairs = [
      ['(', ')'],
      ['[', ']'],
      ['{', '}'],
    ];

    for (const [open, close] of pairs) {
      let count = 0;
      for (const char of content) {
        if (char === open) count++;
        if (char === close) count--;
        if (count < 0) return false; // Closing without opening
      }
      if (count !== 0) return false; // Unmatched delimiters
    }

    return true;
  }

  /**
   * Check if content appears to be text
   */
  private isTextContent(content: string): boolean {
    // Check for excessive null bytes or control characters
    const nullBytes = (content.match(/\0/g) || []).length;
    // biome-ignore lint/suspicious/noControlCharactersInRegex: Need to detect control characters
    const controlChars = (content.match(/[\x00-\x08\x0E-\x1F\x7F]/g) || []).length;

    return nullBytes < content.length * 0.01 && controlChars < content.length * 0.05;
  }

  /**
   * Check encoding preservation
   */
  private checkEncodingPreservation(original: string, fixed: string): boolean {
    // Basic check - both strings should be valid UTF-8 and have similar character distributions
    try {
      // Test that both can be properly encoded/decoded
      const originalEncoded = Buffer.from(original, 'utf8').toString('utf8');
      const fixedEncoded = Buffer.from(fixed, 'utf8').toString('utf8');

      // Should be able to roundtrip without loss
      return originalEncoded === original && fixedEncoded === fixed;
    } catch {
      return false;
    }
  }

  /**
   * Calculate efficiency compared to original validation
   */
  private calculateEfficiency(originalDuration: number, verificationDuration: number): number {
    if (verificationDuration === 0) return 1.0;
    if (originalDuration === 0) return 0.5; // Unknown baseline

    // Efficiency is inverse of time ratio, capped at 1.0
    return Math.min(1.0, originalDuration / verificationDuration);
  }

  /**
   * Get file extension from path
   */
  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot === -1 ? '' : filePath.substring(lastDot);
  }
}
