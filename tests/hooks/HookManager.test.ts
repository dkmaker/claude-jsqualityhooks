/**
 * Tests for HookManager
 *
 * These tests verify hook registration, initialization, and execution
 * orchestration with error recovery and timeout handling.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HookManager } from '../../src/hooks/HookManager.js';
import { PostWriteHook } from '../../src/hooks/PostWriteHook.js';
import type { Config } from '../../src/types/config.js';
import type { FileInfo, Hook, HookResult } from '../../src/types/hooks.js';

// Mock PostWriteHook
vi.mock('../../src/hooks/PostWriteHook.js', () => ({
  PostWriteHook: vi.fn().mockImplementation(() => ({
    name: 'postWrite',
    execute: vi.fn().mockResolvedValue({
      success: true,
      modified: false,
      duration: 100,
      metadata: { test: 'data' },
    }),
  })),
}));

// Mock console methods to prevent noisy test output
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

// Test hook implementation for testing
class TestHook implements Hook {
  readonly name: string;
  private mockExecute: vi.MockedFunction<any>;

  constructor(name: string, mockExecute?: vi.MockedFunction<any>) {
    this.name = name;
    this.mockExecute = mockExecute || vi.fn().mockResolvedValue({
      success: true,
      modified: false,
      duration: 50,
    });
  }

  async execute(file: FileInfo): Promise<HookResult> {
    return this.mockExecute(file);
  }
}

describe('HookManager', () => {
  let config: Config;
  let manager: HookManager;
  let fileInfo: FileInfo;

  beforeEach(() => {
    config = {
      enabled: true,
      timeout: 5000,
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

    manager = new HookManager(config);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty hook registry', () => {
      expect(manager.isInitialized()).toBe(false);
      expect(manager.getRegisteredHooks()).toEqual([]);
      expect(manager.getStats().totalHooks).toBe(0);
    });
  });

  describe('initialize()', () => {
    it('should initialize successfully when enabled', async () => {
      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
      expect(mockConsoleInfo).toHaveBeenCalledWith('[HookManager] Initializing hook system');
      expect(mockConsoleInfo).toHaveBeenCalledWith('[HookManager] PostWrite hook initialized');
      expect(mockConsoleInfo).toHaveBeenCalledWith('[HookManager] Hook system initialized with 1 hooks');
      expect(manager.getRegisteredHooks()).toEqual(['postWrite']);
    });

    it('should not initialize PostWrite hook when disabled', async () => {
      const disabledConfig = { ...config, enabled: false };
      const disabledManager = new HookManager(disabledConfig);

      await disabledManager.initialize();

      expect(disabledManager.isInitialized()).toBe(true);
      expect(disabledManager.getRegisteredHooks()).toEqual([]);
      expect(mockConsoleInfo).toHaveBeenCalledWith('[HookManager] Hook system initialized with 0 hooks');
    });

    it('should not initialize twice', async () => {
      await manager.initialize();
      const firstCallCount = mockConsoleInfo.mock.calls.length;

      await manager.initialize();
      const secondCallCount = mockConsoleInfo.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount); // No additional calls
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock PostWriteHook constructor to throw
      const MockPostWriteHook = vi.mocked(PostWriteHook);
      MockPostWriteHook.mockImplementationOnce(() => {
        throw new Error('PostWriteHook initialization failed');
      });

      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[HookManager] Failed to initialize PostWrite hook - PostWriteHook initialization failed'
      );
    });

    it('should continue initialization on PostWriteHook failure', async () => {
      // Mock PostWriteHook constructor to throw
      const MockPostWriteHook = vi.mocked(PostWriteHook);
      MockPostWriteHook.mockImplementationOnce(() => {
        throw new Error('PostWriteHook failed');
      });

      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
      expect(mockConsoleInfo).toHaveBeenCalledWith('[HookManager] Hook system initialized with 0 hooks');
    });
  });

  describe('registerHook()', () => {
    it('should register a hook successfully', () => {
      const testHook = new TestHook('test-hook');

      manager.registerHook(testHook);

      expect(manager.getRegisteredHooks()).toContain('test-hook');
      expect(manager.getHook('test-hook')).toBe(testHook);
      expect(mockConsoleInfo).toHaveBeenCalledWith('[HookManager] Registered hook: test-hook');
    });

    it('should warn when replacing existing hook', () => {
      const firstHook = new TestHook('duplicate-hook');
      const secondHook = new TestHook('duplicate-hook');

      manager.registerHook(firstHook);
      manager.registerHook(secondHook);

      expect(manager.getHook('duplicate-hook')).toBe(secondHook);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[HookManager] Hook 'duplicate-hook' already registered, replacing"
      );
    });
  });

  describe('unregisterHook()', () => {
    it('should unregister existing hook', () => {
      const testHook = new TestHook('test-hook');
      manager.registerHook(testHook);

      const result = manager.unregisterHook('test-hook');

      expect(result).toBe(true);
      expect(manager.getHook('test-hook')).toBeUndefined();
      expect(mockConsoleInfo).toHaveBeenCalledWith('[HookManager] Unregistered hook: test-hook');
    });

    it('should return false for non-existent hook', () => {
      const result = manager.unregisterHook('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('executePostWrite()', () => {
    it('should execute PostWrite hook successfully', async () => {
      await manager.initialize();

      const result = await manager.executePostWrite(fileInfo);

      expect(result.success).toBe(true);
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        '[HookManager] PostWrite hook completed for /test/file.ts: success=true, modified=false, duration=100ms'
      );
    });

    it('should return safe result when no PostWrite hook is registered', async () => {
      // Create a manager that won't initialize hooks
      const disabledManager = new HookManager({ ...config, enabled: false });

      const result = await disabledManager.executePostWrite(fileInfo);

      expect(result).toEqual({
        success: true,
        modified: false,
        duration: 0,
        metadata: { reason: 'no_postwrite_hook' },
      });
    });

    it('should handle PostWrite hook execution failure', async () => {
      const mockExecute = vi.fn().mockRejectedValue(new Error('Hook execution failed'));
      const MockPostWriteHook = vi.mocked(PostWriteHook);
      MockPostWriteHook.mockImplementationOnce(() => ({
        name: 'postWrite',
        execute: mockExecute,
      }));

      await manager.initialize();

      const result = await manager.executePostWrite(fileInfo);

      expect(result.success).toBe(false);
      expect(result.modified).toBe(false);
      expect(result.error).toBe('Hook execution failed');
      expect(result.metadata).toEqual({
        hookName: 'postWrite',
        failureReason: 'execution_error',
      });
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[HookManager] PostWrite hook failed for /test/file.ts - Hook execution failed'
      );
    });

    it('should handle non-Error exceptions', async () => {
      const mockExecute = vi.fn().mockRejectedValue('String error');
      const MockPostWriteHook = vi.mocked(PostWriteHook);
      MockPostWriteHook.mockImplementationOnce(() => ({
        name: 'postWrite',
        execute: mockExecute,
      }));

      await manager.initialize();

      const result = await manager.executePostWrite(fileInfo);

      expect(result.error).toBe('String error');
    });

    it('should initialize automatically if not initialized', async () => {
      expect(manager.isInitialized()).toBe(false);

      await manager.executePostWrite(fileInfo);

      expect(manager.isInitialized()).toBe(true);
    });
  });

  describe('executeAll()', () => {
    it('should execute all registered hooks sequentially', async () => {
      // Use disabled manager to avoid auto-initialization of postWrite hook
      const testManager = new HookManager({ ...config, enabled: false });
      
      const hook1 = new TestHook('hook1', vi.fn().mockResolvedValue({
        success: true,
        modified: true,
        duration: 50,
        metadata: { hook: 'first' },
      }));
      const hook2 = new TestHook('hook2', vi.fn().mockResolvedValue({
        success: true,
        modified: false,
        duration: 75,
        metadata: { hook: 'second' },
      }));

      testManager.registerHook(hook1);
      testManager.registerHook(hook2);

      const results = await testManager.executeAll(fileInfo);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        success: true,
        modified: true,
        duration: 50,
        metadata: { hook: 'first' },
      });
      expect(results[1]).toEqual({
        success: true,
        modified: false,
        duration: 75,
        metadata: { hook: 'second' },
      });
    });

    it('should return empty array when no hooks registered', async () => {
      // Use disabled manager to ensure no hooks are auto-registered
      const emptyManager = new HookManager({ ...config, enabled: false });
      const results = await emptyManager.executeAll(fileInfo);
      expect(results).toEqual([]);
    });

    it('should continue on hook failure by default', async () => {
      // Use disabled manager to avoid auto-initialization
      const testManager = new HookManager({ ...config, enabled: false });
      
      const failingHook = new TestHook('failing', vi.fn().mockRejectedValue(new Error('Hook failed')));
      const successHook = new TestHook('success', vi.fn().mockResolvedValue({
        success: true,
        modified: false,
        duration: 25,
      }));

      testManager.registerHook(failingHook);
      testManager.registerHook(successHook);

      const results = await testManager.executeAll(fileInfo);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Hook failed');
      expect(results[1].success).toBe(true);
    });

    it('should stop on failure when continueOnFailure is false', async () => {
      const failingHook = new TestHook('failing', vi.fn().mockRejectedValue(new Error('Hook failed')));
      const successHook = new TestHook('success', vi.fn().mockResolvedValue({
        success: true,
        modified: false,
        duration: 25,
      }));

      manager.registerHook(failingHook);
      manager.registerHook(successHook);

      const results = await manager.executeAll(fileInfo, { continueOnFailure: false });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Hook failed');
    });

    it('should handle hook execution exceptions', async () => {
      // Use disabled manager to avoid auto-initialization
      const testManager = new HookManager({ ...config, enabled: false });
      
      const hook = new TestHook('throwing', vi.fn().mockImplementation(() => {
        throw new Error('Synchronous error');
      }));

      testManager.registerHook(hook);

      const results = await testManager.executeAll(fileInfo);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Synchronous error');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "[HookManager] Hook 'throwing' execution failed - Synchronous error"
      );
    });

    it('should initialize automatically if not initialized', async () => {
      expect(manager.isInitialized()).toBe(false);

      await manager.executeAll(fileInfo);

      expect(manager.isInitialized()).toBe(true);
    });
  });

  describe('getStats()', () => {
    it('should return correct statistics', () => {
      const hook1 = new TestHook('hook1');
      const hook2 = new TestHook('hook2');

      manager.registerHook(hook1);
      manager.registerHook(hook2);

      const stats = manager.getStats();

      expect(stats).toEqual({
        totalHooks: 2,
        registeredHooks: ['hook1', 'hook2'],
      });
    });

    it('should return empty stats for no hooks', () => {
      const stats = manager.getStats();

      expect(stats).toEqual({
        totalHooks: 0,
        registeredHooks: [],
      });
    });
  });

  describe('error handling', () => {
    it('should never throw from public methods', async () => {
      const throwingHook = new TestHook('throwing', vi.fn().mockImplementation(() => {
        throw new Error('Critical error');
      }));

      manager.registerHook(throwingHook);

      // None of these should throw
      await expect(manager.executeAll(fileInfo)).resolves.toBeDefined();
      await expect(manager.executePostWrite(fileInfo)).resolves.toBeDefined();
      await expect(manager.initialize()).resolves.toBeUndefined();

      expect(() => manager.registerHook(new TestHook('test'))).not.toThrow();
      expect(() => manager.unregisterHook('test')).not.toThrow();
      expect(() => manager.getStats()).not.toThrow();
    });

    it('should maintain system stability during cascading failures', async () => {
      // Use disabled manager to avoid auto-initialization
      const testManager = new HookManager({ ...config, enabled: false });
      
      const error1 = new TestHook('error1', vi.fn().mockRejectedValue(new Error('Error 1')));
      const error2 = new TestHook('error2', vi.fn().mockRejectedValue(new Error('Error 2')));
      const success = new TestHook('success', vi.fn().mockResolvedValue({
        success: true,
        modified: false,
        duration: 10,
      }));

      testManager.registerHook(error1);
      testManager.registerHook(error2);
      testManager.registerHook(success);

      const results = await testManager.executeAll(fileInfo);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });
});