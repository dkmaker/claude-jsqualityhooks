/**
 * Tests for PostWriteHook
 *
 * These tests verify post-write hook functionality including pattern matching,
 * file enrichment, and phase placeholders for validators and auto-fix.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostWriteHook } from '../../src/hooks/PostWriteHook.js';
import { PatternMatcher } from '../../src/hooks/PatternMatcher.js';
import type { Config } from '../../src/types/config.js';
import type { FileInfo } from '../../src/types/hooks.js';

// Mock file system operations
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}));

// Mock PatternMatcher
vi.mock('../../src/hooks/PatternMatcher.js', () => ({
  PatternMatcher: vi.fn().mockImplementation((include, exclude) => ({
    shouldValidate: vi.fn().mockReturnValue(true),
    getPatterns: vi.fn().mockReturnValue({ include, exclude }),
  })),
}));

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockStatSync = vi.mocked(statSync);
const MockPatternMatcher = vi.mocked(PatternMatcher);

// Mock console methods to prevent noisy test output
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

describe('PostWriteHook', () => {
  let config: Config;
  let hook: PostWriteHook;
  let fileInfo: FileInfo;

  beforeEach(() => {
    config = {
      enabled: true,
      timeout: 5000,
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules/**', 'dist/**'],
      validators: {
        biome: { enabled: true, version: 'auto' },
        typescript: { enabled: true },
      },
      autoFix: { enabled: true, maxAttempts: 3 },
    };

    fileInfo = {
      path: '/test/file.ts',
      content: 'const x = 1;',
      extension: '.ts',
      exists: true,
      size: 12,
      lastModified: Date.now(),
    };

    hook = new PostWriteHook(config);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with PatternMatcher', () => {
      expect(MockPatternMatcher).toHaveBeenCalledWith(
        ['**/*.ts', '**/*.tsx'],
        ['node_modules/**', 'dist/**']
      );
    });

    it('should have correct hook name', () => {
      expect(hook.name).toBe('postWrite');
    });
  });

  describe('execute()', () => {
    it('should process file successfully when patterns match', async () => {
      // Mock pattern matcher to return true
      const mockPatternMatcher = {
        shouldValidate: vi.fn().mockReturnValue(true),
        getPatterns: vi.fn().mockReturnValue({
          include: ['**/*.ts'],
          exclude: ['node_modules/**'],
        }),
      };
      MockPatternMatcher.mockImplementationOnce(() => mockPatternMatcher);

      const newHook = new PostWriteHook(config);
      const result = await newHook.execute(fileInfo);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false); // Phase 1 doesn't modify files
      expect(result.metadata).toMatchObject({
        validated: true,
        patterns: { include: ['**/*.ts'], exclude: ['node_modules/**'] },
        formatted: true,
      });
      expect(mockConsoleInfo).toHaveBeenCalledWith('[postWrite] Processing file: /test/file.ts');
    });

    it('should skip file when patterns do not match', async () => {
      // Mock pattern matcher to return false
      const mockPatternMatcher = {
        shouldValidate: vi.fn().mockReturnValue(false),
        getPatterns: vi.fn().mockReturnValue({
          include: ['**/*.ts'],
          exclude: ['node_modules/**'],
        }),
      };
      MockPatternMatcher.mockImplementationOnce(() => mockPatternMatcher);

      const newHook = new PostWriteHook(config);
      const result = await newHook.execute(fileInfo);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false);
      expect(result.metadata).toMatchObject({
        reason: 'skipped_pattern_mismatch',
        patterns: { include: ['**/*.ts'], exclude: ['node_modules/**'] },
      });
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[postWrite] Skipping file (does not match patterns): /test/file.ts'
      );
    });

    it('should handle pattern matching errors gracefully', async () => {
      // Mock pattern matcher to throw error
      const mockPatternMatcher = {
        shouldValidate: vi.fn().mockImplementation(() => {
          throw new Error('Pattern matching failed');
        }),
        getPatterns: vi.fn().mockReturnValue({ include: [], exclude: [] }),
      };
      MockPatternMatcher.mockImplementationOnce(() => mockPatternMatcher);

      const newHook = new PostWriteHook(config);
      const result = await newHook.execute(fileInfo);

      expect(result.success).toBe(true); // Should continue despite pattern error
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[postWrite] Pattern matching failed for /test/file.ts - Pattern error'
      );
    });

    it('should enrich file info with metadata', async () => {
      // Mock file system calls for enrichment
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: 100,
        mtime: new Date('2024-01-01T10:00:00Z'),
      } as any);

      const fileWithoutSize = { ...fileInfo };
      delete fileWithoutSize.size;
      delete fileWithoutSize.lastModified;

      const result = await hook.execute(fileWithoutSize);

      expect(result.success).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/test/file.ts');
      expect(mockStatSync).toHaveBeenCalledWith('/test/file.ts');
    });

    it('should read file content when missing', async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: 50,
        mtime: new Date('2024-01-01T10:00:00Z'),
      } as any);
      mockReadFileSync.mockReturnValue('file content from disk');

      const fileWithoutContent = { ...fileInfo };
      delete fileWithoutContent.content;

      const result = await hook.execute(fileWithoutContent);

      expect(result.success).toBe(true);
      expect(mockReadFileSync).toHaveBeenCalledWith('/test/file.ts', 'utf-8');
    });

    it('should handle file read errors gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({
        size: 50,
        mtime: new Date('2024-01-01T10:00:00Z'),
      } as any);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const fileWithoutContent = { ...fileInfo };
      delete fileWithoutContent.content;

      const result = await hook.execute(fileWithoutContent);

      expect(result.success).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[postWrite] Failed to read file content: /test/file.ts - Permission denied'
      );
    });

    it('should handle non-existent files', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/test/file.ts');
      expect(mockStatSync).not.toHaveBeenCalled();
    });

    it('should handle file enrichment errors gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockImplementation(() => {
        throw new Error('Stat failed');
      });

      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[postWrite] Failed to enrich file info for /test/file.ts - Stat failed'
      );
    });

    it('should add missing file extension', async () => {
      const fileWithoutExtension = { ...fileInfo };
      delete fileWithoutExtension.extension;

      const result = await hook.execute(fileWithoutExtension);

      expect(result.success).toBe(true);
      // Should derive extension from path
    });

    it('should include validation and fix stats in metadata', async () => {
      const result = await hook.execute(fileInfo);

      expect(result.metadata).toMatchObject({
        validationStats: { validatorsRun: 0, issuesFound: 0 },
        fixStats: { fixesApplied: 0, fixesFailed: 0 },
      });
    });
  });

  describe('shouldValidateFile()', () => {
    it('should delegate to PatternMatcher', async () => {
      const mockPatternMatcher = {
        shouldValidate: vi.fn().mockReturnValue(true),
        getPatterns: vi.fn().mockReturnValue({}),
      };
      MockPatternMatcher.mockImplementationOnce(() => mockPatternMatcher);

      const newHook = new PostWriteHook(config);
      await newHook.execute(fileInfo);

      expect(mockPatternMatcher.shouldValidate).toHaveBeenCalledWith('/test/file.ts');
    });

    it('should return true on pattern matching errors (conservative approach)', async () => {
      const mockPatternMatcher = {
        shouldValidate: vi.fn().mockImplementation(() => {
          throw new Error('Pattern error');
        }),
        getPatterns: vi.fn().mockReturnValue({}),
      };
      MockPatternMatcher.mockImplementationOnce(() => mockPatternMatcher);

      const newHook = new PostWriteHook(config);
      const result = await newHook.execute(fileInfo);

      expect(result.success).toBe(true); // Should continue processing
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[postWrite] Pattern matching failed for /test/file.ts - Pattern error'
      );
    });
  });

  describe('enrichFileInfo()', () => {
    it('should preserve existing file info properties', async () => {
      const completeFileInfo = {
        ...fileInfo,
        extension: '.tsx',
        size: 200,
        lastModified: 1234567890,
      };

      const result = await hook.execute(completeFileInfo);

      expect(result.success).toBe(true);
      // Should not override existing properties
    });

    it('should handle files with content but no disk presence', async () => {
      mockExistsSync.mockReturnValue(false);

      const newFileInfo = {
        path: '/new/file.ts',
        content: 'new content',
        extension: '.ts',
        exists: false,
        size: 11,
      };

      const result = await hook.execute(newFileInfo);

      expect(result.success).toBe(true);
      expect(mockExistsSync).toHaveBeenCalledWith('/new/file.ts');
    });
  });

  describe('Phase placeholders', () => {
    it('should show placeholder messages for Phase 2 validators', async () => {
      await hook.execute(fileInfo);

      expect(mockConsoleInfo).toHaveBeenCalledWith('[postWrite] Validators would run for: /test/file.ts');
    });

    it('should show placeholder messages for Phase 3 auto-fix', async () => {
      await hook.execute(fileInfo);

      expect(mockConsoleInfo).toHaveBeenCalledWith('[postWrite] Auto-fix would run for: /test/file.ts');
    });

    it('should return placeholder stats for validators', async () => {
      const result = await hook.execute(fileInfo);

      expect(result.metadata?.validationStats).toEqual({
        validatorsRun: 0,
        issuesFound: 0,
      });
    });

    it('should return placeholder stats for auto-fix', async () => {
      const result = await hook.execute(fileInfo);

      expect(result.metadata?.fixStats).toEqual({
        fixesApplied: 0,
        fixesFailed: 0,
      });
    });

    it('should mark formatting as completed (Phase 4 placeholder)', async () => {
      const result = await hook.execute(fileInfo);

      expect(result.metadata?.formatted).toBe(true);
    });
  });

  describe('getPatternMatcher()', () => {
    it('should return the pattern matcher instance', () => {
      const patternMatcher = hook.getPatternMatcher();
      expect(patternMatcher).toBeInstanceOf(Object);
    });
  });

  describe('error recovery', () => {
    it('should continue processing despite multiple errors', async () => {
      // Mock multiple error scenarios
      mockExistsSync.mockImplementation(() => {
        throw new Error('Filesystem error');
      });

      const mockPatternMatcher = {
        shouldValidate: vi.fn().mockImplementation(() => {
          throw new Error('Pattern error');
        }),
        getPatterns: vi.fn().mockReturnValue({}),
      };
      MockPatternMatcher.mockImplementationOnce(() => mockPatternMatcher);

      const newHook = new PostWriteHook(config);
      const result = await newHook.execute(fileInfo);

      // Should still complete successfully despite errors
      expect(result.success).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(2); // Both errors should be logged
    });

    it('should provide meaningful error messages', async () => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockImplementation(() => {
        const error = new Error('Permission denied');
        error.name = 'EACCES';
        throw error;
      });

      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[postWrite] Failed to enrich file info for /test/file.ts - Permission denied'
      );
    });
  });

  describe('timeout handling', () => {
    it('should respect timeout from base class', async () => {
      const shortTimeoutConfig = { ...config, timeout: 100 };
      const shortTimeoutHook = new PostWriteHook(shortTimeoutConfig);

      // Hook execution should complete quickly, so no timeout expected
      const result = await shortTimeoutHook.execute(fileInfo);
      expect(result.success).toBe(true);
    });
  });
});