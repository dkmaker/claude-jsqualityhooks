/**
 * FixVerifier tests
 *
 * Tests for the fix verification system that ensures fixes were applied
 * successfully and no new issues were introduced.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FixVerifier } from '../../src/fixers/FixVerifier.js';
import type { Config } from '../../src/types/config.js';
import type { ValidationResponse } from '../../src/validators/ValidatorManager.js';
import { ValidatorManager } from '../../src/validators/ValidatorManager.js';

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  stat: vi.fn(),
}));

// Mock ValidatorManager
vi.mock('../../src/validators/ValidatorManager.js', () => ({
  ValidatorManager: vi.fn().mockImplementation(() => ({
    validateFile: vi.fn(),
  })),
}));

describe('FixVerifier', () => {
  let fixVerifier: FixVerifier;
  let mockConfig: Config;
  let mockValidatorManager: any;

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      validators: {
        biome: { enabled: true, version: 'auto' },
        typescript: { enabled: true },
      },
      autoFix: { enabled: true },
      timeout: 5000,
    };

    // Create mock ValidatorManager instance
    mockValidatorManager = {
      validateFile: vi.fn(),
    };

    // Mock the ValidatorManager constructor
    (ValidatorManager as any).mockImplementation(() => mockValidatorManager);

    fixVerifier = new FixVerifier(mockConfig);
  });

  describe('verifyFixes', () => {
    it('should successfully verify when fixes resolve issues', async () => {
      // Setup - original validation with issues
      const originalValidation: ValidationResponse = {
        success: false,
        results: [
          {
            validator: 'biome',
            status: 'error',
            issues: [
              {
                file: 'test.ts',
                line: 1,
                column: 1,
                severity: 'error',
                message: 'Missing semicolon',
                fixed: false,
                fixable: true,
              },
              {
                file: 'test.ts',
                line: 2,
                column: 1,
                severity: 'warning',
                message: 'Unused import',
                fixed: false,
                fixable: true,
              },
            ],
            duration: 100,
          },
        ],
        summary: {
          totalValidators: 1,
          successfulValidators: 0,
          failedValidators: 1,
          totalIssues: 2,
          errorCount: 1,
          warningCount: 1,
          infoCount: 0,
        },
        performance: { totalDuration: 100, parallelEfficiency: 1.0 },
        cached: false,
      };

      // Setup - new validation with resolved issues
      const newValidation: ValidationResponse = {
        success: true,
        results: [
          {
            validator: 'biome',
            status: 'success',
            issues: [], // All issues resolved
            duration: 80,
          },
        ],
        summary: {
          totalValidators: 1,
          successfulValidators: 1,
          failedValidators: 0,
          totalIssues: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
        },
        performance: { totalDuration: 80, parallelEfficiency: 1.0 },
        cached: false,
      };

      // Mock file stat
      const { stat } = await import('node:fs/promises');
      (stat as any).mockResolvedValue({ size: 100 });

      // Mock validator
      mockValidatorManager.validateFile.mockResolvedValue(newValidation);

      const originalContent = 'const test = "hello"\nimport { unused } from "lib"';
      const fixedContent = 'const test = "hello";\n// Fixed content without unused import';

      const result = await fixVerifier.verifyFixes(
        '/test/file.ts',
        originalContent,
        fixedContent,
        originalValidation
      );

      expect(result.success).toBe(true);
      expect(result.fileModified).toBe(true);
      expect(result.effectiveness).toBe('excellent');
      expect(result.issues.originalCount).toBe(2);
      expect(result.issues.remainingCount).toBe(0);
      expect(result.issues.resolved.length).toBe(2);
      expect(result.issues.newCount).toBe(0);
      expect(result.issues.successRate).toBe(1.0);
    });

    it('should detect when fixes introduce new issues', async () => {
      const originalValidation: ValidationResponse = {
        success: false,
        results: [
          {
            validator: 'biome',
            status: 'error',
            issues: [
              {
                file: 'test.ts',
                line: 1,
                column: 1,
                severity: 'error',
                message: 'Missing semicolon',
                fixed: false,
                fixable: true,
              },
            ],
            duration: 100,
          },
        ],
        summary: {
          totalValidators: 1,
          successfulValidators: 0,
          failedValidators: 1,
          totalIssues: 1,
          errorCount: 1,
          warningCount: 0,
          infoCount: 0,
        },
        performance: { totalDuration: 100, parallelEfficiency: 1.0 },
        cached: false,
      };

      const newValidation: ValidationResponse = {
        success: false,
        results: [
          {
            validator: 'biome',
            status: 'error',
            issues: [
              {
                file: 'test.ts',
                line: 2,
                column: 1,
                severity: 'error',
                message: 'Syntax error introduced by fix',
                fixed: false,
                fixable: false,
              },
            ],
            duration: 80,
          },
        ],
        summary: {
          totalValidators: 1,
          successfulValidators: 0,
          failedValidators: 1,
          totalIssues: 1,
          errorCount: 1,
          warningCount: 0,
          infoCount: 0,
        },
        performance: { totalDuration: 80, parallelEfficiency: 1.0 },
        cached: false,
      };

      const { stat } = await import('node:fs/promises');
      (stat as any).mockResolvedValue({ size: 100 });
      mockValidatorManager.validateFile.mockResolvedValue(newValidation);

      const result = await fixVerifier.verifyFixes(
        '/test/file.ts',
        'const test = "hello"',
        'const test = "hello";', // Fixed but introduced new issue
        originalValidation
      );

      expect(result.success).toBe(false);
      expect(result.effectiveness).toBe('partial'); // High success rate but with new issues = partial
      expect(result.issues.newCount).toBe(1);
      expect(result.warnings.some((w) => w.includes('new issues introduced'))).toBe(true);
    });

    it('should handle file integrity issues', async () => {
      const originalValidation: ValidationResponse = {
        success: true,
        results: [],
        summary: {
          totalValidators: 0,
          successfulValidators: 0,
          failedValidators: 0,
          totalIssues: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
        },
        performance: { totalDuration: 0, parallelEfficiency: 1.0 },
        cached: false,
      };

      // Mock file stat to throw error (file doesn't exist)
      const { stat } = await import('node:fs/promises');
      (stat as any).mockRejectedValue(new Error('File not found'));

      const result = await fixVerifier.verifyFixes(
        '/test/missing.ts',
        'original content',
        '', // Empty fixed content
        originalValidation
      );

      expect(result.success).toBe(false);
      expect(result.effectiveness).toBe('failed');
      expect(result.integrity.exists).toBe(false);
      expect(result.integrity.isEmpty).toBe(true);
      expect(result.warnings.some((w) => w.includes('empty after fixes'))).toBe(true);
    });

    it('should handle verification errors gracefully', async () => {
      const originalValidation: ValidationResponse = {
        success: true,
        results: [],
        summary: {
          totalValidators: 0,
          successfulValidators: 0,
          failedValidators: 0,
          totalIssues: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
        },
        performance: { totalDuration: 100, parallelEfficiency: 1.0 },
        cached: false,
      };

      // Mock ValidatorManager to throw error
      mockValidatorManager.validateFile.mockRejectedValue(new Error('Validation failed'));

      const result = await fixVerifier.verifyFixes(
        '/test/file.ts',
        'original',
        'fixed',
        originalValidation
      );

      expect(result.success).toBe(false);
      expect(result.effectiveness).toBe('failed');
      expect(result.warnings.some((w) => w.includes('Verification failed'))).toBe(true);
    });

    it('should generate comprehensive verification reports', async () => {
      const originalValidation: ValidationResponse = {
        success: false,
        results: [
          {
            validator: 'biome',
            status: 'error',
            issues: [
              {
                file: 'test.ts',
                line: 1,
                column: 1,
                severity: 'error',
                message: 'Error 1',
                fixed: false,
                fixable: true,
              },
              {
                file: 'test.ts',
                line: 2,
                column: 1,
                severity: 'warning',
                message: 'Warning 1',
                fixed: false,
                fixable: true,
              },
            ],
            duration: 100,
          },
        ],
        summary: {
          totalValidators: 1,
          successfulValidators: 0,
          failedValidators: 1,
          totalIssues: 2,
          errorCount: 1,
          warningCount: 1,
          infoCount: 0,
        },
        performance: { totalDuration: 100, parallelEfficiency: 1.0 },
        cached: false,
      };

      const newValidation: ValidationResponse = {
        success: false,
        results: [
          {
            validator: 'biome',
            status: 'warning',
            issues: [
              {
                file: 'test.ts',
                line: 2,
                column: 1,
                severity: 'warning',
                message: 'Warning 1',
                fixed: false,
                fixable: true,
              },
            ],
            duration: 80,
          },
        ],
        summary: {
          totalValidators: 1,
          successfulValidators: 0,
          failedValidators: 0,
          totalIssues: 1,
          errorCount: 0,
          warningCount: 1,
          infoCount: 0,
        },
        performance: { totalDuration: 80, parallelEfficiency: 1.0 },
        cached: false,
      };

      const { stat } = await import('node:fs/promises');
      (stat as any).mockResolvedValue({ size: 150 });
      mockValidatorManager.validateFile.mockResolvedValue(newValidation);

      const result = await fixVerifier.verifyFixes(
        '/test/file.ts',
        'original content',
        'fixed content with changes',
        originalValidation
      );

      expect(result.report).toContain('## Fix Verification Report');
      expect(result.report).toContain('### Summary');
      expect(result.report).toContain('### File Integrity');
      expect(result.report).toContain('### Performance');
      expect(result.report).toContain('Original issues: 2');
      expect(result.report).toContain('Issues resolved: 1');
      expect(result.report).toContain('Issues remaining: 1');
    });
  });
});
