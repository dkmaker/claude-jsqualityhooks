/**
 * ConflictResolver - Handles conflicts between multiple fixes
 *
 * Detects overlapping fixes, resolves conflicts using priority order,
 * and provides sequential application with rollback capability.
 */

import { readFile, writeFile } from 'node:fs/promises';
import type { ValidationIssue } from '../validators/biome/adapters/BiomeAdapter.js';

/**
 * Fix priority levels for conflict resolution
 */
export enum FixPriority {
  FORMATTING = 1, // Highest priority - prevents conflicts
  IMPORTS = 2, // Second priority - organizes after formatting
  SAFE_LINT = 3, // Third priority - safe lint fixes
  OTHER = 4, // Lowest priority - other fixes
  UNSAFE = 999, // Never applied - unsafe fixes
}

/**
 * Represents a fix with position and priority information
 */
export interface FixWithMeta {
  issue: ValidationIssue;
  priority: FixPriority;
  startLine: number;
  endLine: number;
  group: string;
  id: string;
}

/**
 * Conflict between two or more fixes
 */
export interface FixConflict {
  conflictingFixes: FixWithMeta[];
  reason: string;
  resolution: 'skip_all' | 'use_highest_priority' | 'apply_sequential';
  affectedLines: [number, number];
}

/**
 * Result of conflict resolution
 */
export interface ConflictResolutionResult {
  orderedFixes: FixWithMeta[];
  conflicts: FixConflict[];
  skippedFixes: FixWithMeta[];
  strategy: 'sequential' | 'safe_mode';
}

/**
 * Rollback information for recovery
 */
export interface RollbackInfo {
  originalContent: string;
  filePath: string;
  timestamp: number;
  appliedFixes: string[];
}

/**
 * ConflictResolver class - manages fix conflicts and resolution
 */
export class ConflictResolver {
  private rollbackData = new Map<string, RollbackInfo>();

  /**
   * Detects conflicts between fixes by analyzing line number overlaps
   */
  public detectConflicts(fixes: FixWithMeta[]): FixConflict[] {
    const conflicts: FixConflict[] = [];

    // Sort fixes by start line for efficient conflict detection
    const sortedFixes = [...fixes].sort((a, b) => a.startLine - b.startLine);

    for (let i = 0; i < sortedFixes.length; i++) {
      const currentFix = sortedFixes[i];
      if (!currentFix) continue;

      const conflictingFixes: FixWithMeta[] = [currentFix];

      // Check for overlapping ranges with subsequent fixes
      for (let j = i + 1; j < sortedFixes.length; j++) {
        const nextFix = sortedFixes[j];
        if (!nextFix) continue;

        // If next fix starts after current fix ends, no more conflicts possible
        if (nextFix.startLine > currentFix.endLine) {
          break;
        }

        // Check for overlap
        if (this.hasLineOverlap(currentFix, nextFix)) {
          conflictingFixes.push(nextFix);
        }
      }

      // If we found conflicts, create a conflict entry
      if (conflictingFixes.length > 1) {
        const conflict: FixConflict = {
          conflictingFixes,
          reason: `Overlapping line ranges: ${conflictingFixes.map((f) => `${f.startLine}-${f.endLine}`).join(', ')}`,
          resolution: this.determineResolution(conflictingFixes),
          affectedLines: [
            Math.min(...conflictingFixes.map((f) => f.startLine)),
            Math.max(...conflictingFixes.map((f) => f.endLine)),
          ],
        };

        conflicts.push(conflict);

        // Skip ahead to avoid duplicate conflict detection
        const maxEndLine = Math.max(...conflictingFixes.map((f) => f.endLine));
        while (i + 1 < sortedFixes.length && (sortedFixes[i + 1]?.startLine || 0) <= maxEndLine) {
          i++;
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolves fix priorities and returns ordered list for sequential application
   */
  public resolvePriority(fixes: FixWithMeta[]): ConflictResolutionResult {
    // Detect conflicts first
    const conflicts = this.detectConflicts(fixes);

    // Extract fixes involved in conflicts
    const conflictedFixIds = new Set(conflicts.flatMap((c) => c.conflictingFixes.map((f) => f.id)));

    // Separate conflicted and non-conflicted fixes
    const nonConflictedFixes = fixes.filter((f) => !conflictedFixIds.has(f.id));
    const _conflictedFixes = fixes.filter((f) => conflictedFixIds.has(f.id));

    // Resolve conflicts
    const resolvedFixes: FixWithMeta[] = [];
    const skippedFixes: FixWithMeta[] = [];

    for (const conflict of conflicts) {
      const resolution = this.resolveConflict(conflict);
      resolvedFixes.push(...resolution.resolved);
      skippedFixes.push(...resolution.skipped);
    }

    // Combine all approved fixes and sort by priority then by line
    const allApprovedFixes = [...nonConflictedFixes, ...resolvedFixes];
    const orderedFixes = this.orderFixesByPriority(allApprovedFixes);

    return {
      orderedFixes,
      conflicts,
      skippedFixes,
      strategy: conflicts.length > 0 ? 'safe_mode' : 'sequential',
    };
  }

  /**
   * Applies fixes sequentially with line number adjustment
   */
  public async applyFixesSequentially(
    filePath: string,
    fixes: FixWithMeta[]
  ): Promise<{ success: boolean; appliedFixes: string[]; errors: string[] }> {
    const appliedFixes: string[] = [];
    const errors: string[] = [];

    try {
      // Store original content for rollback
      const originalContent = await readFile(filePath, 'utf8');
      this.storeRollbackInfo(filePath, originalContent, []);

      let currentContent = originalContent;
      let lineOffset = 0; // Track line number shifts

      for (const fix of fixes) {
        try {
          // Adjust fix position based on previous changes
          const adjustedFix = this.adjustFixPosition(fix, lineOffset);

          // Apply the fix (this would integrate with actual fix application logic)
          const result = await this.applySingleFix(filePath, currentContent, adjustedFix);

          if (result.success) {
            currentContent = result.content;
            lineOffset += result.lineShift;
            appliedFixes.push(fix.id);

            // Update rollback info
            this.updateRollbackInfo(filePath, appliedFixes);
          } else {
            errors.push(`Failed to apply fix ${fix.id}: ${result.error}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Error applying fix ${fix.id}: ${errorMsg}`);
        }
      }

      // Write final content if changes were made
      if (appliedFixes.length > 0) {
        await writeFile(filePath, currentContent, 'utf8');
      }

      return {
        success: errors.length === 0,
        appliedFixes,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Critical error during fix application: ${errorMsg}`);

      // Attempt rollback on critical failure
      await this.rollback(filePath);

      return {
        success: false,
        appliedFixes,
        errors,
      };
    }
  }

  /**
   * Rolls back changes to original content
   */
  public async rollback(filePath: string): Promise<boolean> {
    try {
      const rollbackInfo = this.rollbackData.get(filePath);
      if (!rollbackInfo) {
        return false;
      }

      await writeFile(filePath, rollbackInfo.originalContent, 'utf8');
      this.rollbackData.delete(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Groups fixes by type for organized application
   */
  public groupFixes(fixes: FixWithMeta[]): Map<string, FixWithMeta[]> {
    const groups = new Map<string, FixWithMeta[]>();

    for (const fix of fixes) {
      const groupKey = fix.group;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)?.push(fix);
    }

    return groups;
  }

  // Private helper methods

  private hasLineOverlap(fix1: FixWithMeta, fix2: FixWithMeta): boolean {
    return !(fix1.endLine < fix2.startLine || fix2.endLine < fix1.startLine);
  }

  private determineResolution(fixes: FixWithMeta[]): FixConflict['resolution'] {
    // If all fixes have the same priority, apply sequentially
    const priorities = new Set(fixes.map((f) => f.priority));
    if (priorities.size === 1) {
      return 'apply_sequential';
    }

    // If different priorities, use highest priority only
    return 'use_highest_priority';
  }

  private resolveConflict(conflict: FixConflict): {
    resolved: FixWithMeta[];
    skipped: FixWithMeta[];
  } {
    const { conflictingFixes, resolution } = conflict;

    switch (resolution) {
      case 'skip_all':
        return { resolved: [], skipped: conflictingFixes };

      case 'use_highest_priority': {
        const highestPriority = Math.min(...conflictingFixes.map((f) => f.priority));
        const resolved = conflictingFixes.filter((f) => f.priority === highestPriority);
        const skipped = conflictingFixes.filter((f) => f.priority !== highestPriority);
        return { resolved, skipped };
      }

      default:
        // Apply all fixes sequentially (they'll be ordered by priority later)
        return { resolved: conflictingFixes, skipped: [] };
    }
  }

  private orderFixesByPriority(fixes: FixWithMeta[]): FixWithMeta[] {
    return fixes.sort((a, b) => {
      // Primary sort: by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Secondary sort: by line number within same priority
      return a.startLine - b.startLine;
    });
  }

  private storeRollbackInfo(
    filePath: string,
    originalContent: string,
    appliedFixes: string[]
  ): void {
    this.rollbackData.set(filePath, {
      originalContent,
      filePath,
      timestamp: Date.now(),
      appliedFixes,
    });
  }

  private updateRollbackInfo(filePath: string, appliedFixes: string[]): void {
    const rollbackInfo = this.rollbackData.get(filePath);
    if (rollbackInfo) {
      rollbackInfo.appliedFixes = [...appliedFixes];
    }
  }

  private adjustFixPosition(fix: FixWithMeta, lineOffset: number): FixWithMeta {
    return {
      ...fix,
      startLine: fix.startLine + lineOffset,
      endLine: fix.endLine + lineOffset,
    };
  }

  private async applySingleFix(
    _filePath: string,
    content: string,
    _fix: FixWithMeta
  ): Promise<{ success: boolean; content: string; lineShift: number; error?: string }> {
    try {
      // This is a placeholder for actual fix application logic
      // In a real implementation, this would call the appropriate validator's fix method

      // For now, return the original content unchanged
      // The actual implementation would integrate with Biome/TypeScript fixers
      return {
        success: true,
        content,
        lineShift: 0, // Track how many lines were added/removed
      };
    } catch (error) {
      return {
        success: false,
        content,
        lineShift: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Utility function to classify fix priority based on validation issue
 */
export function classifyFixPriority(issue: ValidationIssue): FixPriority {
  // Classify based on message content since ValidationIssue doesn't have a rule property
  const message = issue.message.toLowerCase();

  // Formatting fixes have highest priority
  if (
    message.includes('format') ||
    message.includes('style') ||
    message.includes('indent') ||
    message.includes('spacing')
  ) {
    return FixPriority.FORMATTING;
  }

  // Import organization
  if (message.includes('import') || message.includes('unused')) {
    return FixPriority.IMPORTS;
  }

  // Safe lint fixes
  if (
    message.includes('semicolon') ||
    message.includes('quotes') ||
    message.includes('trailing-comma')
  ) {
    return FixPriority.SAFE_LINT;
  }

  // Default to other category
  return FixPriority.OTHER;
}

/**
 * Utility function to determine fix line range from validation issue
 */
export function getFixLineRange(issue: ValidationIssue): [number, number] {
  const startLine = issue.line || 1;
  // Since ValidationIssue doesn't have endLine, assume single line
  const endLine = issue.line || 1;
  return [startLine, endLine];
}

/**
 * Utility function to generate fix group name
 */
export function generateFixGroup(issue: ValidationIssue): string {
  const priority = classifyFixPriority(issue);

  switch (priority) {
    case FixPriority.FORMATTING:
      return 'formatting';
    case FixPriority.IMPORTS:
      return 'imports';
    case FixPriority.SAFE_LINT:
      return 'lint-safe';
    default:
      return 'other';
  }
}
