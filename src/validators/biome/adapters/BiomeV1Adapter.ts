/**
 * BiomeV1Adapter
 *
 * Adapter for Biome 1.x versions which use --apply flag for fixes
 * and different command structure.
 */

import type { BiomeAdapter, BiomeCommandOptions, ValidationIssue } from './BiomeAdapter.js';

export class BiomeV1Adapter implements BiomeAdapter {
  readonly version = '1.x' as const;

  /**
   * Build command arguments for Biome 1.x
   * Uses 'check' command with --apply for fixes
   */
  buildCommand(file: string, options: BiomeCommandOptions = {}): string[] {
    const { autoFix = false, configPath, unsafeFixes = false } = options;

    const command = ['check', file];

    // Add fix flag if requested
    if (autoFix) {
      if (unsafeFixes) {
        command.push('--apply-unsafe');
      } else {
        command.push('--apply');
      }
    }

    // Add JSON reporter
    command.push('--reporter=json');

    // Add config path if specified
    if (configPath) {
      command.push('--config-path', configPath);
    }

    return command;
  }

  /**
   * Get the fix flag for Biome 1.x
   */
  getFixFlag(unsafe = false): string {
    return unsafe ? '--apply-unsafe' : '--apply';
  }

  /**
   * Parse Biome 1.x JSON output into ValidationIssue format
   */
  parseOutput(output: string, filePath: string): ValidationIssue[] {
    try {
      if (!output.trim()) {
        return [];
      }

      const parsed = JSON.parse(output);
      const issues: ValidationIssue[] = [];

      // Biome JSON structure: { diagnostics: [...] }
      if (parsed.diagnostics && Array.isArray(parsed.diagnostics)) {
        for (const diagnostic of parsed.diagnostics) {
          try {
            const issue = this.parseDiagnostic(diagnostic, filePath);
            if (issue) {
              issues.push(issue);
            }
          } catch {
            // Skip invalid diagnostics but continue processing
          }
        }
      }

      return issues;
    } catch {
      // If JSON parsing fails, return empty array (non-blocking)
      return [];
    }
  }

  /**
   * Parse individual diagnostic from Biome 1.x output
   */
  private parseDiagnostic(diagnostic: unknown, filePath: string): ValidationIssue | null {
    if (!diagnostic || typeof diagnostic !== 'object') {
      return null;
    }

    const diagnosticObj = diagnostic as Record<string, unknown>;

    // Extract location information
    const location = (diagnosticObj.location as Record<string, unknown>) || {};
    const span = (location.span as Record<string, unknown>) || {};
    const start = (span.start as Record<string, unknown>) || { line: 1, column: 1 };

    // Map Biome severity to our format
    const severity = this.mapSeverity(String(diagnosticObj.severity || ''));

    // Extract message
    const message = String(diagnosticObj.description || diagnosticObj.message || 'Unknown issue');

    // Determine if issue was fixed or is fixable
    const tags = Array.isArray(diagnosticObj.tags) ? diagnosticObj.tags as string[] : [];
    const fixed = tags.includes('fixable') && diagnosticObj.fixed === true;
    const fixable = tags.includes('fixable');

    return {
      file: filePath,
      line: typeof start.line === 'number' ? start.line : 1,
      column: typeof start.column === 'number' ? start.column : 1,
      severity,
      message: typeof message === 'string' ? message : String(message),
      fixed,
      fixable,
    };
  }

  /**
   * Map Biome severity levels to our standard format
   */
  private mapSeverity(biomeSeverity: string): 'error' | 'warning' | 'info' {
    switch (biomeSeverity?.toLowerCase()) {
      case 'error':
        return 'error';
      case 'warning':
      case 'warn':
        return 'warning';
      case 'info':
      case 'information':
        return 'info';
      default:
        return 'error'; // Default to error for unknown severities
    }
  }
}
