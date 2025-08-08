/**
 * Tests for BaseHook
 *
 * These tests verify the abstract base class functionality including
 * timeout handling, error recovery, and configuration management.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseHook } from '../../src/hooks/BaseHook.js';
import type { Config } from '../../src/types/config.js';
import type { FileInfo, HookResult } from '../../src/types/hooks.js';

// Mock console methods to prevent noisy test output
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

// Test implementation of BaseHook for testing
class TestHook extends BaseHook {
  readonly name = 'test-hook';
  private mockExecuteHook: vi.MockedFunction<any>;

  constructor(config: Config, mockExecuteHook?: vi.MockedFunction<any>) {
    super(config);
    this.mockExecuteHook = mockExecuteHook || vi.fn();
  }

  protected async executeHook(file: FileInfo): Promise<Omit<HookResult, 'duration' | 'success'>> {
    return this.mockExecuteHook(file);
  }

  // Expose protected methods for testing
  public async testWithTimeout<T>(promise: Promise<T>): Promise<T> {
    return this.withTimeout(promise);
  }

  public testGetTimeout(): number {
    return this.getTimeout();
  }

  public testWarn(message: string, error?: Error): void {
    return this.warn(message, error);
  }

  public testInfo(message: string): void {
    return this.info(message);
  }
}

describe('BaseHook', () => {
  let config: Config;
  let fileInfo: FileInfo;

  beforeEach(() => {
    config = {
      enabled: true,
      timeout: 3000,
      include: ['**/*.ts'],
      exclude: ['node_modules/**'],
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

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      const hook = new TestHook(config);
      expect(hook.name).toBe('test-hook');
      expect(hook.testGetTimeout()).toBe(3000);
    });

    it('should use default timeout if not configured', () => {
      const configWithoutTimeout = { ...config };
      delete configWithoutTimeout.timeout;
      const hook = new TestHook(configWithoutTimeout);
      expect(hook.testGetTimeout()).toBe(5000); // Default timeout
    });
  });

  describe('execute()', () => {
    it('should execute hook successfully and return result with timing', async () => {
      const mockResult = { modified: true, metadata: { test: 'data' } };
      const mockExecuteHook = vi.fn().mockResolvedValue(mockResult);
      const hook = new TestHook(config, mockExecuteHook);

      const result = await hook.execute(fileInfo);

      expect(mockExecuteHook).toHaveBeenCalledWith(fileInfo);
      expect(result.success).toBe(true);
      expect(result.modified).toBe(true);
      expect(result.metadata).toEqual({ test: 'data' });
      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(100); // Should be very fast for mocked execution
    });

    it('should handle execution errors gracefully', async () => {
      const mockError = new Error('Test execution error');
      const mockExecuteHook = vi.fn().mockRejectedValue(mockError);
      const hook = new TestHook(config, mockExecuteHook);

      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(false);
      expect(result.modified).toBe(false);
      expect(result.error).toBe('Test execution error');
      expect(result.duration).toBeGreaterThan(0);
      expect(result.metadata).toEqual({
        hookName: 'test-hook',
        failureStrategy: 'warn',
      });
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[test-hook] Hook execution failed: Test execution error'
      );
    });

    it('should handle non-Error exceptions', async () => {
      const mockExecuteHook = vi.fn().mockRejectedValue('String error');
      const hook = new TestHook(config, mockExecuteHook);

      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
      expect(mockConsoleWarn).toHaveBeenCalledWith('[test-hook] Hook execution failed: String error');
    });

    it('should handle timeout errors', async () => {
      const slowConfig = { ...config, timeout: 100 };
      const mockExecuteHook = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200)) // Longer than timeout
      );
      const hook = new TestHook(slowConfig, mockExecuteHook);

      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Hook 'test-hook' timed out after 100ms");
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[test-hook] Hook execution failed: Hook 'test-hook' timed out after 100ms"
      );
    });
  });

  describe('withTimeout()', () => {
    it('should resolve promise within timeout', async () => {
      const hook = new TestHook(config);
      const fastPromise = Promise.resolve('success');

      const result = await hook.testWithTimeout(fastPromise);
      expect(result).toBe('success');
    });

    it('should timeout long-running promises', async () => {
      const shortTimeoutConfig = { ...config, timeout: 50 };
      const hook = new TestHook(shortTimeoutConfig);
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 100));

      await expect(hook.testWithTimeout(slowPromise)).rejects.toThrow(
        "Hook 'test-hook' timed out after 50ms"
      );
    });

    it('should use config timeout value', async () => {
      const customTimeoutConfig = { ...config, timeout: 2000 };
      const hook = new TestHook(customTimeoutConfig);
      expect(hook.testGetTimeout()).toBe(2000);
    });

    it('should use default timeout when config timeout is undefined', async () => {
      const configWithoutTimeout = { ...config };
      delete configWithoutTimeout.timeout;
      const hook = new TestHook(configWithoutTimeout);
      expect(hook.testGetTimeout()).toBe(5000);
    });
  });

  describe('getTimeout()', () => {
    it('should return config timeout when available', () => {
      const hook = new TestHook(config);
      expect(hook.testGetTimeout()).toBe(3000);
    });

    it('should return default timeout when config timeout is not set', () => {
      const configWithoutTimeout = { ...config };
      delete configWithoutTimeout.timeout;
      const hook = new TestHook(configWithoutTimeout);
      expect(hook.testGetTimeout()).toBe(5000);
    });
  });

  describe('warn()', () => {
    it('should log warning messages with hook name', () => {
      const hook = new TestHook(config);
      hook.testWarn('Test warning');

      expect(mockConsoleWarn).toHaveBeenCalledWith('[test-hook] Test warning');
    });

    it('should include error message when error is provided', () => {
      const hook = new TestHook(config);
      const error = new Error('Test error');
      hook.testWarn('Test warning', error);

      expect(mockConsoleWarn).toHaveBeenCalledWith('[test-hook] Test warning - Test error');
    });

    it('should handle undefined error gracefully', () => {
      const hook = new TestHook(config);
      hook.testWarn('Test warning', undefined);

      expect(mockConsoleWarn).toHaveBeenCalledWith('[test-hook] Test warning');
    });
  });

  describe('info()', () => {
    it('should log info messages with hook name', () => {
      const hook = new TestHook(config);
      hook.testInfo('Test info');

      expect(mockConsoleInfo).toHaveBeenCalledWith('[test-hook] Test info');
    });
  });

  describe('error recovery', () => {
    it('should never throw exceptions from execute method', async () => {
      const mockExecuteHook = vi.fn().mockImplementation(() => {
        throw new Error('Critical error');
      });
      const hook = new TestHook(config, mockExecuteHook);

      // Should not throw, should return error result
      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Critical error');
    });

    it('should maintain consistent result structure on failure', async () => {
      const mockExecuteHook = vi.fn().mockRejectedValue(new Error('Test error'));
      const hook = new TestHook(config, mockExecuteHook);

      const result = await hook.execute(fileInfo);

      expect(result).toEqual({
        success: false,
        modified: false,
        duration: expect.any(Number),
        error: 'Test error',
        metadata: {
          hookName: 'test-hook',
          failureStrategy: 'warn',
        },
      });
    });

    it('should warn about failures but continue execution', async () => {
      const mockExecuteHook = vi.fn().mockRejectedValue(new Error('Test error'));
      const hook = new TestHook(config, mockExecuteHook);

      await hook.execute(fileInfo);

      expect(mockConsoleWarn).toHaveBeenCalledWith('[test-hook] Hook execution failed: Test error');
    });
  });

  describe('performance timing', () => {
    it('should track execution duration', async () => {
      const mockExecuteHook = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ modified: false }), 10))
      );
      const hook = new TestHook(config, mockExecuteHook);

      const result = await hook.execute(fileInfo);

      expect(result.duration).toBeGreaterThan(5); // Should have some measurable duration
      expect(result.duration).toBeLessThan(100); // But not too long for a test
    });

    it('should include duration even on timeout', async () => {
      const shortTimeoutConfig = { ...config, timeout: 10 };
      const mockExecuteHook = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );
      const hook = new TestHook(shortTimeoutConfig, mockExecuteHook);

      const result = await hook.execute(fileInfo);

      expect(result.success).toBe(false);
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});