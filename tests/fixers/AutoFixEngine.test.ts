/**
 * Tests for AutoFixEngine
 *
 * Tests the core auto-fix functionality including:
 * - Configuration checking
 * - Issue filtering
 * - Biome version adapter integration
 * - Sequential fix application
 * - Statistics tracking
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AutoFixEngine, type FileInfo, type FixResult } from '../../src/fixers/index.js';
import type { Config } from '../../src/types/config.js';
import type { ValidationIssue } from '../../src/validators/index.js';

// Mock dependencies
vi.mock('node:fs/promises');
vi.mock('execa');
vi.mock('../../src/utils/versionDetector.js');
vi.mock('../../src/validators/biome/adapters/BiomeAdapterFactory.js');

// Import mocked modules
const { readFile, writeFile } = await import('node:fs/promises');
const { execa } = await import('execa');
const { detectBiomeVersion } = await import('../../src/utils/versionDetector.js');
const { createAdapterFromDetection } = await import(
  '../../src/validators/biome/adapters/BiomeAdapterFactory.js'
);

// Create mock functions
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockExeca = vi.mocked(execa);
const mockDetectBiomeVersion = vi.mocked(detectBiomeVersion);
const mockCreateAdapterFromDetection = vi.mocked(createAdapterFromDetection);

// Mock adapter
const mockAdapter = {
  version: '2.x' as const,
  getFixFlag: vi.fn().mockReturnValue('--write'),
  buildCommand: vi.fn(),
  parseOutput: vi.fn(),
};

describe('AutoFixEngine', () => {
  let config: Config;
  let autoFixEngine: AutoFixEngine;
  let mockFile: FileInfo;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock config with auto-fix enabled
    config = {
      enabled: true,
      include: ['**/*.ts', '**/*.js'],
      exclude: ['**/node_modules/**'],
      validators: {
        biome: {
          enabled: true,
          version: 'auto',
        },
        typescript: {
          enabled: true,
        },
      },
      autoFix: {
        enabled: true,
        maxAttempts: 3,
      },
      timeout: 5000,
    };

    autoFixEngine = new AutoFixEngine(config);

    // Create mock file
    mockFile = {
      path: '/test/file.ts',
      content: 'const x=1;let y="hello";',
      issues: [
        {
          file: '/test/file.ts',
          line: 1,
          column: 8,
          severity: 'error',
          message: 'Missing spacing around operator',
          fixed: false,
          fixable: true,
        },
        {
          file: '/test/file.ts',
          line: 1,
          column: 14,
          severity: 'warning',
          message: 'Prefer single quotes format',
          fixed: false,
          fixable: true,
        },
      ],
    };

    // Setup mocks
    mockDetectBiomeVersion.mockResolvedValue({
      version: '2.1.0',
      major: 2,
      minor: 1,
      patch: 0,
      source: 'package.json',
    });

    mockCreateAdapterFromDetection.mockReturnValue(mockAdapter);
    mockReadFile.mockResolvedValue("const x = 1;\nconst y = 'hello';");
    mockExeca.mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configuration handling', () => {
    it('should skip fixes when auto-fix is disabled', async () => {
      const disabledConfig = { ...config, autoFix: { enabled: false } };
      const engine = new AutoFixEngine(disabledConfig);

      const result = await engine.applyFixes(mockFile);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false);
      expect(result.fixesApplied).toEqual([]);
      expect(result.statistics.fixAttempts).toBe(0);
      expect(mockDetectBiomeVersion).not.toHaveBeenCalled();
      expect(mockExeca).not.toHaveBeenCalled();
    });

    it('should skip when no fixable issues exist', async () => {
      const nonFixableFile: FileInfo = {
        ...mockFile,
        issues: [
          {
            file: '/test/file.ts',
            line: 1,
            column: 8,
            severity: 'error',
            message: 'Non-fixable error',
            fixed: false,
            fixable: false, // Not fixable
          },
        ],
      };

      const result = await autoFixEngine.applyFixes(nonFixableFile);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(false);
      expect(result.fixesApplied).toEqual([]);
      expect(result.statistics.fixAttempts).toBe(0);
    });
  });

  describe('fix application', () => {
    it('should apply fixes successfully', async () => {
      const result = await autoFixEngine.applyFixes(mockFile);

      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);
      expect(result.content).toBe("const x = 1;\nconst y = 'hello';");
      expect(result.fixesApplied.length).toBeGreaterThan(0);
      expect(result.statistics.fixAttempts).toBeGreaterThan(0);

      // Should have created backup
      expect(mockWriteFile).toHaveBeenCalledWith('/test/file.ts.backup', mockFile.content, 'utf-8');

      // Should have detected Biome version
      expect(mockDetectBiomeVersion).toHaveBeenCalled();
      expect(mockCreateAdapterFromDetection).toHaveBeenCalled();
    });

    it('should handle Biome execution correctly', async () => {
      await autoFixEngine.applyFixes(mockFile);

      // Should execute Biome with correct parameters
      expect(mockExeca).toHaveBeenCalledWith(
        'biome',
        expect.arrayContaining([
          'check',
          '/test/file.ts',
          '--write',
          '--reporter=json',
          '--no-colors',
        ]),
        expect.objectContaining({
          timeout: 5000,
          cwd: process.cwd(),
        })
      );
    });
  });

  describe('issue categorization', () => {
    it('should categorize issues by type', async () => {
      const mixedIssues: ValidationIssue[] = [
        {
          file: '/test/file.ts',
          line: 1,
          column: 1,
          severity: 'warning',
          message: 'Incorrect spacing detected',
          fixed: false,
          fixable: true,
        },
        {
          file: '/test/file.ts',
          line: 2,
          column: 1,
          severity: 'warning',
          message: 'Unused import should be removed',
          fixed: false,
          fixable: true,
        },
        {
          file: '/test/file.ts',
          line: 3,
          column: 1,
          severity: 'error',
          message: 'Console statements not allowed',
          fixed: false,
          fixable: true,
        },
      ];

      const fileWithMixedIssues: FileInfo = {
        ...mockFile,
        issues: mixedIssues,
      };

      const result = await autoFixEngine.applyFixes(fileWithMixedIssues);

      expect(result.success).toBe(true);
      expect(result.fixesApplied.length).toBeGreaterThan(0);
      // Should have applied fixes in order: format, import, lint
      expect(mockExeca).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should handle Biome execution failures gracefully', async () => {
      mockExeca.mockRejectedValue(new Error('Biome command failed'));

      const result = await autoFixEngine.applyFixes(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Biome command failed');
      expect(result.content).toBe(mockFile.content); // Should return original content
    });

    it('should handle file read failures', async () => {
      mockReadFile.mockRejectedValue(new Error('File read failed'));

      const result = await autoFixEngine.applyFixes(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors.some((err) => err.includes('File read failed'))).toBe(true);
    });

    it('should handle backup creation failures gracefully', async () => {
      mockWriteFile.mockRejectedValue(new Error('Backup failed'));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await autoFixEngine.applyFixes(mockFile);

      // Should continue despite backup failure
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create backup'),
        expect.any(Error)
      );

      // Should still attempt fixes
      expect(mockExeca).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('statistics tracking', () => {
    it('should track fix statistics correctly', async () => {
      const result = await autoFixEngine.applyFixes(mockFile);

      expect(result.statistics).toMatchObject({
        totalIssues: 2, // mockFile has 2 issues
        fixedIssues: expect.any(Number),
        remainingIssues: expect.any(Number),
        fixDuration: expect.any(Number),
        fixAttempts: expect.any(Number),
      });

      expect(result.statistics.fixDuration).toBeGreaterThanOrEqual(0);
      expect(result.statistics.totalIssues).toBe(2);
    });

    it('should track zero statistics when auto-fix disabled', async () => {
      const disabledConfig = { ...config, autoFix: { enabled: false } };
      const engine = new AutoFixEngine(disabledConfig);

      const result = await engine.applyFixes(mockFile);

      expect(result.statistics).toMatchObject({
        totalIssues: 2,
        fixedIssues: 0,
        remainingIssues: 2,
        fixDuration: 0,
        fixAttempts: 0,
      });
    });
  });

  describe('content modification', () => {
    it('should detect content modifications correctly', async () => {
      // Mock scenario where content actually changes
      mockReadFile.mockResolvedValue('const x = 1;\nconst y = "hello";'); // Different from original

      const result = await autoFixEngine.applyFixes(mockFile);

      expect(result.modified).toBe(true);
      expect(result.content).not.toBe(mockFile.content);
    });

    it('should detect no modifications when content unchanged', async () => {
      // Mock scenario where content doesn't change
      mockReadFile.mockResolvedValue(mockFile.content); // Same as original

      const result = await autoFixEngine.applyFixes(mockFile);

      expect(result.modified).toBe(false);
      expect(result.content).toBe(mockFile.content);
    });
  });
});
