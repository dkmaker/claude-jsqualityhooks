/**
 * ConflictResolver tests
 *
 * Tests conflict detection, priority resolution, and sequential application
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConflictResolver,
  classifyFixPriority,
  FixPriority,
  type FixWithMeta,
  generateFixGroup,
  getFixLineRange,
} from '../../src/fixers/ConflictResolver.js';
import type { ValidationIssue } from '../../src/validators/biome/adapters/BiomeAdapter.js';

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
  });

  describe('detectConflicts', () => {
    it('should detect overlapping line ranges', () => {
      const fixes: FixWithMeta[] = [
        {
          id: 'fix1',
          issue: createMockIssue('rule1', 5, 7),
          priority: FixPriority.FORMATTING,
          startLine: 5,
          endLine: 7,
          group: 'formatting',
        },
        {
          id: 'fix2',
          issue: createMockIssue('rule2', 6, 8),
          priority: FixPriority.IMPORTS,
          startLine: 6,
          endLine: 8,
          group: 'imports',
        },
      ];

      const conflicts = resolver.detectConflicts(fixes);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictingFixes).toHaveLength(2);
      expect(conflicts[0].affectedLines).toEqual([5, 8]);
    });

    it('should not detect conflicts for non-overlapping ranges', () => {
      const fixes: FixWithMeta[] = [
        {
          id: 'fix1',
          issue: createMockIssue('rule1', 1, 3),
          priority: FixPriority.FORMATTING,
          startLine: 1,
          endLine: 3,
          group: 'formatting',
        },
        {
          id: 'fix2',
          issue: createMockIssue('rule2', 5, 7),
          priority: FixPriority.IMPORTS,
          startLine: 5,
          endLine: 7,
          group: 'imports',
        },
      ];

      const conflicts = resolver.detectConflicts(fixes);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle touching but not overlapping ranges', () => {
      const fixes: FixWithMeta[] = [
        {
          id: 'fix1',
          issue: createMockIssue('rule1', 1, 5),
          priority: FixPriority.FORMATTING,
          startLine: 1,
          endLine: 5,
          group: 'formatting',
        },
        {
          id: 'fix2',
          issue: createMockIssue('rule2', 6, 8),
          priority: FixPriority.IMPORTS,
          startLine: 6,
          endLine: 8,
          group: 'imports',
        },
      ];

      const conflicts = resolver.detectConflicts(fixes);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('resolvePriority', () => {
    it('should order fixes by priority', () => {
      const fixes: FixWithMeta[] = [
        createFixWithPriority('fix1', FixPriority.SAFE_LINT, 10, 12),
        createFixWithPriority('fix2', FixPriority.FORMATTING, 5, 7),
        createFixWithPriority('fix3', FixPriority.IMPORTS, 15, 17),
      ];

      const result = resolver.resolvePriority(fixes);

      expect(result.orderedFixes).toHaveLength(3);
      expect(result.orderedFixes[0].priority).toBe(FixPriority.FORMATTING);
      expect(result.orderedFixes[1].priority).toBe(FixPriority.IMPORTS);
      expect(result.orderedFixes[2].priority).toBe(FixPriority.SAFE_LINT);
    });

    it('should handle conflicts by priority', () => {
      const fixes: FixWithMeta[] = [
        createFixWithPriority('fix1', FixPriority.FORMATTING, 5, 7),
        createFixWithPriority('fix2', FixPriority.IMPORTS, 6, 8), // Overlapping
      ];

      const result = resolver.resolvePriority(fixes);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].resolution).toBe('use_highest_priority');
    });

    it('should use sequential resolution for same priority conflicts', () => {
      const fixes: FixWithMeta[] = [
        createFixWithPriority('fix1', FixPriority.FORMATTING, 5, 7),
        createFixWithPriority('fix2', FixPriority.FORMATTING, 6, 8), // Same priority, overlapping
      ];

      const result = resolver.resolvePriority(fixes);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].resolution).toBe('apply_sequential');
    });
  });

  describe('groupFixes', () => {
    it('should group fixes by their group property', () => {
      const fixes: FixWithMeta[] = [
        { ...createFixWithPriority('fix1', FixPriority.FORMATTING, 1, 2), group: 'formatting' },
        { ...createFixWithPriority('fix2', FixPriority.FORMATTING, 3, 4), group: 'formatting' },
        { ...createFixWithPriority('fix3', FixPriority.IMPORTS, 5, 6), group: 'imports' },
      ];

      const groups = resolver.groupFixes(fixes);

      expect(groups.size).toBe(2);
      expect(groups.get('formatting')).toHaveLength(2);
      expect(groups.get('imports')).toHaveLength(1);
    });
  });

  describe('rollback functionality', () => {
    it('should return false for non-existent rollback data', async () => {
      const result = await resolver.rollback('/non/existent/file.ts');
      expect(result).toBe(false);
    });
  });
});

describe('utility functions', () => {
  describe('classifyFixPriority', () => {
    it('should classify formatting fixes correctly', () => {
      const issue = createMockIssue('test-rule', 1, 1, 'Expected spacing issue');
      const priority = classifyFixPriority(issue);
      expect(priority).toBe(FixPriority.FORMATTING);
    });

    it('should classify import fixes correctly', () => {
      const issue = createMockIssue('test-rule', 1, 1, 'Unused import statement');
      const priority = classifyFixPriority(issue);
      expect(priority).toBe(FixPriority.IMPORTS);
    });

    it('should classify safe lint fixes correctly', () => {
      const issue = createMockIssue('test-rule', 1, 1, 'Missing semicolon');
      const priority = classifyFixPriority(issue);
      expect(priority).toBe(FixPriority.SAFE_LINT);
    });

    it('should default to OTHER for unknown rules', () => {
      const issue = createMockIssue('test-rule', 1, 1, 'Some unknown issue');
      const priority = classifyFixPriority(issue);
      expect(priority).toBe(FixPriority.OTHER);
    });
  });

  describe('getFixLineRange', () => {
    it('should extract line range from validation issue', () => {
      const issue = createMockIssue('test-rule', 5, 8);
      const [startLine, endLine] = getFixLineRange(issue);
      expect(startLine).toBe(5);
      expect(endLine).toBe(5); // Single line since ValidationIssue doesn't have endLine
    });

    it('should default to line 1 when no line specified', () => {
      const issue: ValidationIssue = {
        file: 'test.ts',
        line: 0, // Will default to 1
        column: 1,
        severity: 'error',
        message: 'Test message',
        fixed: false,
        fixable: true,
      };
      const [startLine, endLine] = getFixLineRange(issue);
      expect(startLine).toBe(1);
      expect(endLine).toBe(1);
    });
  });

  describe('generateFixGroup', () => {
    it('should generate appropriate group names', () => {
      const formattingIssue = createMockIssue('test-rule', 1, 1, 'Formatting issue');
      expect(generateFixGroup(formattingIssue)).toBe('formatting');

      const importIssue = createMockIssue('test-rule', 1, 1, 'Unused import statement');
      expect(generateFixGroup(importIssue)).toBe('imports');

      const lintIssue = createMockIssue('test-rule', 1, 1, 'Missing semicolon');
      expect(generateFixGroup(lintIssue)).toBe('lint-safe');

      const otherIssue = createMockIssue('test-rule', 1, 1, 'Some other issue');
      expect(generateFixGroup(otherIssue)).toBe('other');
    });
  });
});

// Helper functions for creating test data

function createMockIssue(
  rule: string,
  line: number,
  _endLine?: number,
  message?: string
): ValidationIssue {
  return {
    file: 'test.ts',
    line,
    column: 1,
    severity: 'error',
    message: message || `Test message for ${rule}`,
    fixed: false,
    fixable: true,
  };
}

function createFixWithPriority(
  id: string,
  priority: FixPriority,
  startLine: number,
  endLine: number
): FixWithMeta {
  return {
    id,
    issue: createMockIssue(`rule-${id}`, startLine, endLine),
    priority,
    startLine,
    endLine,
    group:
      priority === FixPriority.FORMATTING
        ? 'formatting'
        : priority === FixPriority.IMPORTS
          ? 'imports'
          : 'other',
  };
}
