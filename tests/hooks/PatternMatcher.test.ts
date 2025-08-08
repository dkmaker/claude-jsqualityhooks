/**
 * Tests for PatternMatcher
 *
 * These tests verify file pattern matching logic with include/exclude patterns,
 * default patterns, and error handling scenarios.
 */

import fg from 'fast-glob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  PatternMatcher,
} from '../../src/hooks/PatternMatcher.js';

// Mock fast-glob
vi.mock('fast-glob', () => ({
  default: vi.fn(),
}));

const mockFg = vi.mocked(fg);

// Mock console methods to prevent noisy test output
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('PatternMatcher', () => {
  let matcher: PatternMatcher;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use provided include and exclude patterns', () => {
      const includePatterns = ['**/*.ts', '**/*.tsx'];
      const excludePatterns = ['node_modules/**', 'dist/**'];

      matcher = new PatternMatcher(includePatterns, excludePatterns);
      const patterns = matcher.getPatterns();

      expect(patterns.include).toEqual(includePatterns);
      expect(patterns.exclude).toEqual(excludePatterns);
    });

    it('should use default patterns when none provided', () => {
      matcher = new PatternMatcher();
      const patterns = matcher.getPatterns();

      expect(patterns.include).toEqual(DEFAULT_INCLUDE_PATTERNS);
      expect(patterns.exclude).toEqual(DEFAULT_EXCLUDE_PATTERNS);
    });

    it('should use default patterns when empty arrays provided', () => {
      matcher = new PatternMatcher([], []);
      const patterns = matcher.getPatterns();

      expect(patterns.include).toEqual(DEFAULT_INCLUDE_PATTERNS);
      expect(patterns.exclude).toEqual(DEFAULT_EXCLUDE_PATTERNS);
    });

    it('should use custom include with default exclude', () => {
      const customInclude = ['**/*.js'];
      matcher = new PatternMatcher(customInclude);
      const patterns = matcher.getPatterns();

      expect(patterns.include).toEqual(customInclude);
      expect(patterns.exclude).toEqual(DEFAULT_EXCLUDE_PATTERNS);
    });

    it('should use default include with custom exclude', () => {
      const customExclude = ['**/*.test.ts'];
      matcher = new PatternMatcher(undefined, customExclude);
      const patterns = matcher.getPatterns();

      expect(patterns.include).toEqual(DEFAULT_INCLUDE_PATTERNS);
      expect(patterns.exclude).toEqual(customExclude);
    });
  });

  describe('shouldValidate()', () => {
    beforeEach(() => {
      matcher = new PatternMatcher(['**/*.{ts,tsx,js,jsx}'], ['node_modules/**', 'dist/**']);
    });

    it('should return true for files matching include patterns', () => {
      expect(matcher.shouldValidate('src/component.ts')).toBe(true);
      expect(matcher.shouldValidate('pages/index.tsx')).toBe(true);
      expect(matcher.shouldValidate('utils/helper.js')).toBe(true);
      expect(matcher.shouldValidate('hooks/useData.jsx')).toBe(true);
    });

    it('should return false for files not matching include patterns', () => {
      expect(matcher.shouldValidate('README.md')).toBe(false);
      expect(matcher.shouldValidate('config.json')).toBe(false);
      expect(matcher.shouldValidate('styles.css')).toBe(false);
      expect(matcher.shouldValidate('image.png')).toBe(false);
    });

    it('should return false for files matching exclude patterns', () => {
      expect(matcher.shouldValidate('node_modules/package/index.js')).toBe(false);
      expect(matcher.shouldValidate('dist/bundle.js')).toBe(false);
      expect(matcher.shouldValidate('node_modules/react/index.ts')).toBe(false);
    });

    it('should handle Windows-style paths by normalizing them', () => {
      expect(matcher.shouldValidate('src\\component.ts')).toBe(true);
      expect(matcher.shouldValidate('node_modules\\package\\index.js')).toBe(false);
    });

    it('should prioritize exclude over include patterns', () => {
      const conflictMatcher = new PatternMatcher(['**/*.js'], ['node_modules/**/*.js']);

      // File matches include but also exclude - should be excluded
      expect(conflictMatcher.shouldValidate('node_modules/package/index.js')).toBe(false);
    });

    it('should handle complex glob patterns', () => {
      const complexMatcher = new PatternMatcher(
        ['src/**/*.{ts,tsx}', 'lib/*.ts'],
        ['**/*.test.ts', '**/node_modules/**']
      );

      expect(complexMatcher.shouldValidate('src/components/Button.tsx')).toBe(true);
      expect(complexMatcher.shouldValidate('lib/utils.ts')).toBe(true);
      expect(complexMatcher.shouldValidate('src/utils/helper.test.ts')).toBe(false);
      expect(complexMatcher.shouldValidate('src/node_modules/package/index.ts')).toBe(false);
    });

    it('should return true on pattern matching errors (conservative approach)', () => {
      const errorMatcher = new PatternMatcher(['invalid[pattern']);

      expect(errorMatcher.shouldValidate('any-file.ts')).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[PatternMatcher] Pattern matching failed for any-file.ts:',
        expect.any(Error)
      );
    });

    it('should handle edge cases gracefully', () => {
      expect(matcher.shouldValidate('')).toBe(false);
      expect(matcher.shouldValidate('.')).toBe(false);
      expect(matcher.shouldValidate('..')).toBe(false);
      expect(matcher.shouldValidate('/')).toBe(false);
    });
  });

  describe('getMatchingFiles()', () => {
    beforeEach(() => {
      matcher = new PatternMatcher(['**/*.ts'], ['node_modules/**']);
    });

    it('should return files matching patterns using fast-glob', async () => {
      const mockFiles = [
        '/project/src/component.ts',
        '/project/lib/utils.ts',
        '/project/pages/index.ts',
      ];
      mockFg.mockResolvedValue(mockFiles);

      const result = await matcher.getMatchingFiles('/project');

      expect(mockFg).toHaveBeenCalledWith(['**/*.ts'], {
        cwd: '/project',
        ignore: ['node_modules/**'],
        absolute: true,
        onlyFiles: true,
      });
      expect(result).toEqual(mockFiles);
    });

    it('should return empty array when no files match', async () => {
      mockFg.mockResolvedValue([]);

      const result = await matcher.getMatchingFiles('/empty-project');

      expect(result).toEqual([]);
    });

    it('should handle fast-glob errors gracefully', async () => {
      mockFg.mockRejectedValue(new Error('Fast-glob error'));

      const result = await matcher.getMatchingFiles('/project');

      expect(result).toEqual([]);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[PatternMatcher] Failed to get matching files from /project:',
        expect.any(Error)
      );
    });

    it('should pass correct options to fast-glob', async () => {
      mockFg.mockResolvedValue([]);
      const customMatcher = new PatternMatcher(
        ['src/**/*.{ts,tsx}', 'lib/*.js'],
        ['**/*.test.*', 'dist/**']
      );

      await customMatcher.getMatchingFiles('/custom-project');

      expect(mockFg).toHaveBeenCalledWith(['src/**/*.{ts,tsx}', 'lib/*.js'], {
        cwd: '/custom-project',
        ignore: ['**/*.test.*', 'dist/**'],
        absolute: true,
        onlyFiles: true,
      });
    });
  });

  describe('patternToRegex()', () => {
    beforeEach(() => {
      matcher = new PatternMatcher();
    });

    it('should convert basic glob patterns to regex', () => {
      // Test through shouldValidate to verify regex conversion
      const simplePattern = new PatternMatcher(['*.ts']);
      expect(simplePattern.shouldValidate('file.ts')).toBe(true);
      expect(simplePattern.shouldValidate('dir/file.ts')).toBe(false);
    });

    it('should handle ** patterns for deep directory matching', () => {
      const deepPattern = new PatternMatcher(['**/*.ts']);
      expect(deepPattern.shouldValidate('file.ts')).toBe(true);
      expect(deepPattern.shouldValidate('dir/file.ts')).toBe(true);
      expect(deepPattern.shouldValidate('deep/nested/dir/file.ts')).toBe(true);
    });

    it('should handle single * patterns for filename matching', () => {
      const filePattern = new PatternMatcher(['src/*.ts']);
      expect(filePattern.shouldValidate('src/file.ts')).toBe(true);
      expect(filePattern.shouldValidate('src/nested/file.ts')).toBe(false);
    });

    it('should handle ? patterns for single character matching', () => {
      const charPattern = new PatternMatcher(['file?.ts']);
      expect(charPattern.shouldValidate('file1.ts')).toBe(true);
      expect(charPattern.shouldValidate('fileA.ts')).toBe(true);
      expect(charPattern.shouldValidate('file.ts')).toBe(false);
      expect(charPattern.shouldValidate('file12.ts')).toBe(false);
    });

    it('should handle brace expansion patterns', () => {
      const bracePattern = new PatternMatcher(['**/*.{ts,tsx,js,jsx}']);
      expect(bracePattern.shouldValidate('component.ts')).toBe(true);
      expect(bracePattern.shouldValidate('component.tsx')).toBe(true);
      expect(bracePattern.shouldValidate('component.js')).toBe(true);
      expect(bracePattern.shouldValidate('component.jsx')).toBe(true);
      expect(bracePattern.shouldValidate('component.css')).toBe(false);
    });

    it('should escape regex special characters', () => {
      const specialPattern = new PatternMatcher(['test.file[].ts']);
      expect(specialPattern.shouldValidate('test.file[].ts')).toBe(true);
      expect(specialPattern.shouldValidate('testXfileXXXts')).toBe(false);
    });

    it('should be case insensitive for Windows compatibility', () => {
      const casePattern = new PatternMatcher(['**/*.TS']);
      expect(casePattern.shouldValidate('file.ts')).toBe(true);
      expect(casePattern.shouldValidate('file.TS')).toBe(true);
    });

    it('should handle regex conversion errors gracefully', () => {
      // This will be tested indirectly through pattern matching errors
      const invalidPattern = new PatternMatcher(['[invalid']);

      // Should not throw, should return true (conservative)
      expect(invalidPattern.shouldValidate('test.ts')).toBe(true);
    });
  });

  describe('default patterns', () => {
    it('should define reasonable default include patterns', () => {
      expect(DEFAULT_INCLUDE_PATTERNS).toEqual(['**/*.{ts,tsx,js,jsx}', '*.{ts,tsx,js,jsx}']);
    });

    it('should define comprehensive default exclude patterns', () => {
      expect(DEFAULT_EXCLUDE_PATTERNS).toContain('node_modules/**');
      expect(DEFAULT_EXCLUDE_PATTERNS).toContain('dist/**');
      expect(DEFAULT_EXCLUDE_PATTERNS).toContain('build/**');
      expect(DEFAULT_EXCLUDE_PATTERNS).toContain('.next/**');
      expect(DEFAULT_EXCLUDE_PATTERNS).toContain('coverage/**');
      expect(DEFAULT_EXCLUDE_PATTERNS).toContain('.git/**');
      expect(DEFAULT_EXCLUDE_PATTERNS).toContain('**/*.d.ts');
    });

    it('should work correctly with default patterns', () => {
      const defaultMatcher = new PatternMatcher();

      // Should include common source files
      expect(defaultMatcher.shouldValidate('src/component.ts')).toBe(true);
      expect(defaultMatcher.shouldValidate('pages/index.tsx')).toBe(true);
      expect(defaultMatcher.shouldValidate('utils/helper.js')).toBe(true);
      expect(defaultMatcher.shouldValidate('hooks/useData.jsx')).toBe(true);

      // Should exclude common build/dependency directories
      expect(defaultMatcher.shouldValidate('node_modules/react/index.js')).toBe(false);
      expect(defaultMatcher.shouldValidate('dist/bundle.js')).toBe(false);
      expect(defaultMatcher.shouldValidate('build/static/js/main.js')).toBe(false);
      expect(defaultMatcher.shouldValidate('.next/static/chunks/main.js')).toBe(false);
      expect(defaultMatcher.shouldValidate('coverage/lcov-report/index.html')).toBe(false);
      expect(defaultMatcher.shouldValidate('.git/objects/abc123')).toBe(false);

      // Should exclude type declaration files
      expect(defaultMatcher.shouldValidate('types/global.d.ts')).toBe(false);
      expect(defaultMatcher.shouldValidate('src/components/Button.d.ts')).toBe(false);

      // Should exclude minified files
      expect(defaultMatcher.shouldValidate('libs/jquery.min.js')).toBe(false);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty pattern arrays gracefully', () => {
      const emptyMatcher = new PatternMatcher([], []);
      expect(emptyMatcher.shouldValidate('test.ts')).toBe(true);
    });

    it('should handle undefined patterns gracefully', () => {
      const undefinedMatcher = new PatternMatcher(undefined, undefined);
      expect(undefinedMatcher.shouldValidate('test.ts')).toBe(true);
    });

    it('should handle null patterns gracefully', () => {
      const nullMatcher = new PatternMatcher(null as any, null as any);
      expect(nullMatcher.shouldValidate('test.ts')).toBe(true);
    });

    it('should handle very long file paths', () => {
      const longPath = `${'very/'.repeat(100)}long/path/file.ts`;
      expect(matcher.shouldValidate(longPath)).toBe(true);
    });

    it('should handle special characters in file paths', () => {
      expect(matcher.shouldValidate('file with spaces.ts')).toBe(false); // Depends on pattern
      expect(matcher.shouldValidate('file-with-dashes.ts')).toBe(true);
      expect(matcher.shouldValidate('file_with_underscores.ts')).toBe(true);
      expect(matcher.shouldValidate('file.with.dots.ts')).toBe(true);
    });

    it('should maintain immutable pattern state', () => {
      const patterns = matcher.getPatterns();
      const originalInclude = [...patterns.include];
      const originalExclude = [...patterns.exclude];

      // Modify returned patterns
      patterns.include.push('**/*.modified');
      patterns.exclude.push('**/*.modified');

      // Should not affect internal state
      const newPatterns = matcher.getPatterns();
      expect(newPatterns.include).toEqual(originalInclude);
      expect(newPatterns.exclude).toEqual(originalExclude);
    });

    it('should handle pattern matching with unusual file extensions', () => {
      const extMatcher = new PatternMatcher(['**/*.{ts,tsx}']);

      expect(extMatcher.shouldValidate('file.ts')).toBe(true);
      expect(extMatcher.shouldValidate('file.tsx')).toBe(true);
      expect(extMatcher.shouldValidate('file.mts')).toBe(false);
      expect(extMatcher.shouldValidate('file.cts')).toBe(false);
    });
  });

  describe('performance considerations', () => {
    it('should not perform expensive operations in constructor', () => {
      const start = performance.now();
      new PatternMatcher(['**/*.ts'], ['node_modules/**']);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Constructor should be very fast
    });

    it('should cache regex patterns for performance', () => {
      const testMatcher = new PatternMatcher(['**/*.ts']);

      // Multiple calls should not cause performance issues
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        testMatcher.shouldValidate(`file${i}.ts`);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be reasonably fast
    });
  });
});
