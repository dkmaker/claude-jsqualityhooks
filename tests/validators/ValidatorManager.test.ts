/**
 * ValidatorManager tests
 *
 * Tests for parallel validation execution, result aggregation, and caching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidatorManager } from '../../src/validators/ValidatorManager.js';
import type { Config } from '../../src/types/config.js';
import type { FileInfo } from '../../src/types/hooks.js';

// Mock the validators
const mockBiomeValidate = vi.fn().mockResolvedValue({
  success: true,
  issues: [],
  fixed: 0,
});

const mockTypeScriptValidate = vi.fn().mockResolvedValue({
  validator: 'typescript',
  status: 'success',
  issues: [],
});

vi.mock('../../src/validators/biome/BiomeValidator.js', () => ({
  BiomeValidator: vi.fn().mockImplementation(() => ({
    validate: mockBiomeValidate,
  })),
}));

vi.mock('../../src/validators/typescript/index.js', () => ({
  TypeScriptValidator: vi.fn().mockImplementation(() => ({
    validate: mockTypeScriptValidate,
  })),
}));

// Mock the version detector to avoid actual Biome calls
vi.mock('../../src/utils/versionDetector.js', () => ({
  detectBiomeVersion: vi.fn().mockResolvedValue({
    version: '2.1.3',
    detected: 'package.json',
    majorVersion: 2,
  }),
}));

// Mock the adapter factory
vi.mock('../../src/validators/biome/adapters/BiomeAdapterFactory.js', () => ({
  createAdapterFromDetection: vi.fn().mockReturnValue({
    validate: vi.fn(),
    checkAvailability: vi.fn().mockResolvedValue(true),
  }),
}));

describe('ValidatorManager', () => {
  let validatorManager: ValidatorManager;
  let mockConfig: Config;
  let mockFile: FileInfo;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset mock implementations
    mockBiomeValidate.mockResolvedValue({
      success: true,
      issues: [],
      fixed: 0,
    });

    mockTypeScriptValidate.mockResolvedValue({
      validator: 'typescript',
      status: 'success',
      issues: [],
    });

    // Create mock config with both validators enabled
    mockConfig = {
      enabled: true,
      include: ['**/*.ts', '**/*.js'],
      exclude: ['**/node_modules/**'],
      validators: {
        biome: {
          enabled: true,
          version: 'auto' as const,
        },
        typescript: {
          enabled: true,
        },
      },
      autoFix: {
        enabled: false,
      },
      timeout: 5000,
    };

    // Create mock file
    mockFile = {
      path: '/test/file.ts',
      content: 'const x = 1;',
      extension: '.ts',
      exists: true,
      size: 12,
    };

    validatorManager = new ValidatorManager(mockConfig);
  });

  describe('validateFile', () => {
    it('should run both validators in parallel when both are enabled', async () => {
      const result = await validatorManager.validateFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results.map((r) => r.validator).sort()).toEqual(['biome', 'typescript']);
      expect(result.summary.totalValidators).toBe(2);
      expect(result.summary.successfulValidators).toBe(2);
      expect(result.cached).toBe(false);
    });

    it('should return empty result when no validators are enabled', async () => {
      const disabledConfig = {
        ...mockConfig,
        validators: {
          biome: { enabled: false },
          typescript: { enabled: false },
        },
      };

      const manager = new ValidatorManager(disabledConfig);
      const result = await manager.validateFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.summary.totalValidators).toBe(0);
    });

    it('should handle validator failures gracefully', async () => {
      // Mock one validator to fail
      mockBiomeValidate.mockRejectedValue(new Error('Biome failed'));

      const manager = new ValidatorManager(mockConfig);
      const result = await manager.validateFile(mockFile);

      expect(result.results).toHaveLength(2);
      expect(result.results.some((r) => r.status === 'error')).toBe(true);
      expect(result.success).toBe(false);
    });

    it('should use cached results when available', async () => {
      // First validation
      const result1 = await validatorManager.validateFile(mockFile);
      expect(result1.cached).toBe(false);

      // Second validation should use cache
      const result2 = await validatorManager.validateFile(mockFile);
      expect(result2.cached).toBe(true);
    });

    it('should aggregate statistics correctly', async () => {
      // Update mock implementations for this test
      mockBiomeValidate.mockResolvedValue({
        success: true,
        issues: [
          { severity: 'error', message: 'Error 1', line: 1 },
          { severity: 'warning', message: 'Warning 1', line: 2 },
        ],
        fixed: 0,
      });

      mockTypeScriptValidate.mockResolvedValue({
        validator: 'typescript',
        status: 'warning',
        issues: [{ severity: 'warning', message: 'Warning 2', line: 3 }],
      });

      const manager = new ValidatorManager(mockConfig);
      const result = await manager.validateFile(mockFile);

      expect(result.summary.totalIssues).toBe(3);
      expect(result.summary.errorCount).toBe(1);
      expect(result.summary.warningCount).toBe(2);
      expect(result.summary.infoCount).toBe(0);
    });

    it('should measure performance', async () => {
      const result = await validatorManager.validateFile(mockFile);

      expect(result.performance.totalDuration).toBeGreaterThan(0);
      expect(result.performance.parallelEfficiency).toBeGreaterThan(0);
      expect(result.performance.parallelEfficiency).toBeLessThanOrEqual(10); // Should be reasonable
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      validatorManager.clearCache();
      const stats = validatorManager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = validatorManager.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('ttl');
    });
  });

  describe('validator management', () => {
    it('should report enabled validators', async () => {
      // Initialize by running validation first
      await validatorManager.validateFile(mockFile);

      const enabled = validatorManager.getEnabledValidators();
      expect(enabled).toEqual([
        { name: 'biome', enabled: true },
        { name: 'typescript', enabled: true },
      ]);
    });

    it('should only initialize enabled validators', async () => {
      const partialConfig = {
        ...mockConfig,
        validators: {
          biome: { enabled: true },
          typescript: { enabled: false },
        },
      };

      const manager = new ValidatorManager(partialConfig);
      await manager.validateFile(mockFile);

      const enabled = manager.getEnabledValidators();
      expect(enabled).toHaveLength(1);
      expect(enabled[0]).toEqual({ name: 'biome', enabled: true });
    });
  });
});
