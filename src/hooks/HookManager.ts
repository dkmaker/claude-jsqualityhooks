/**
 * Hook manager for claude-jsqualityhooks
 *
 * This module manages hook registration, initialization, and execution
 * orchestration with error recovery and timeout handling.
 */

import type { Config } from '../types/config.js';
import type { FileInfo, Hook, HookExecutionOptions, HookResult } from '../types/hooks.js';
import { PostWriteHook } from './PostWriteHook.js';

/**
 * Manages hook registration and execution
 *
 * Features:
 * - Hook registration and lifecycle management
 * - Execution orchestration with error recovery
 * - Configuration-based hook initialization
 * - Non-blocking failure handling
 */
export class HookManager {
  private readonly hooks = new Map<string, Hook>();
  private initialized = false;

  constructor(private readonly config: Config) {}

  /**
   * Initialize hooks based on configuration
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.info('Initializing hook system');

      // Initialize PostWrite hook if enabled globally
      if (this.config.enabled) {
        await this.initializePostWriteHook();
      }

      this.initialized = true;
      this.info(`Hook system initialized with ${this.hooks.size} hooks`);
    } catch (error) {
      this.warn('Failed to initialize hook system', error);
      // Don't throw - we want to continue even if hook initialization fails
      this.initialized = true;
    }
  }

  /**
   * Register a hook manually
   */
  registerHook(hook: Hook): void {
    if (this.hooks.has(hook.name)) {
      this.warn(`Hook '${hook.name}' already registered, replacing`);
    }

    this.hooks.set(hook.name, hook);
    this.info(`Registered hook: ${hook.name}`);
  }

  /**
   * Unregister a hook
   */
  unregisterHook(name: string): boolean {
    const existed = this.hooks.has(name);
    this.hooks.delete(name);

    if (existed) {
      this.info(`Unregistered hook: ${name}`);
    }

    return existed;
  }

  /**
   * Execute post-write hook if available
   */
  async executePostWrite(file: FileInfo): Promise<HookResult> {
    await this.ensureInitialized();

    const hook = this.hooks.get('postWrite');
    if (!hook) {
      return {
        success: true,
        modified: false,
        duration: 0,
        metadata: { reason: 'no_postwrite_hook' },
      };
    }

    try {
      const result = await hook.execute(file);
      this.info(
        `PostWrite hook completed for ${file.path}: success=${result.success}, modified=${result.modified}, duration=${result.duration}ms`
      );
      return result;
    } catch (error) {
      this.warn(`PostWrite hook failed for ${file.path}`, error);

      // Return safe failure result - never block
      return {
        success: false,
        modified: false,
        duration: 0,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          hookName: 'postWrite',
          failureReason: 'execution_error',
        },
      };
    }
  }

  /**
   * Execute all registered hooks (future extensibility)
   */
  async executeAll(file: FileInfo, options?: Partial<HookExecutionOptions>): Promise<HookResult[]> {
    await this.ensureInitialized();

    const results: HookResult[] = [];
    const hooks = Array.from(this.hooks.values());

    if (hooks.length === 0) {
      return [];
    }

    // Execute hooks sequentially for now (can be parallelized later)
    for (const hook of hooks) {
      try {
        const result = await hook.execute(file);
        results.push(result);

        // Continue on failure if specified (default behavior)
        if (!result.success && options?.continueOnFailure === false) {
          break;
        }
      } catch (error) {
        this.warn(`Hook '${hook.name}' execution failed`, error);

        results.push({
          success: false,
          modified: false,
          duration: 0,
          error: error instanceof Error ? error.message : String(error),
          metadata: { hookName: hook.name, failureReason: 'execution_error' },
        });

        // Continue with next hook unless explicitly told not to
        if (options?.continueOnFailure === false) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Get registered hook names
   */
  getRegisteredHooks(): string[] {
    return Array.from(this.hooks.keys());
  }

  /**
   * Get hook by name
   */
  getHook(name: string): Hook | undefined {
    return this.hooks.get(name);
  }

  /**
   * Check if hook manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get hook execution statistics
   */
  getStats(): { totalHooks: number; registeredHooks: string[] } {
    return {
      totalHooks: this.hooks.size,
      registeredHooks: this.getRegisteredHooks(),
    };
  }

  /**
   * Initialize PostWrite hook if conditions are met
   */
  private async initializePostWriteHook(): Promise<void> {
    try {
      // PostWrite hook is always initialized when system is enabled
      const postWriteHook = new PostWriteHook(this.config);
      this.hooks.set('postWrite', postWriteHook);
      this.info('PostWrite hook initialized');
    } catch (error) {
      this.warn('Failed to initialize PostWrite hook', error);
      // Don't throw - continue initialization
    }
  }

  /**
   * Ensure hook manager is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Log warning message
   */
  private warn(message: string, error?: unknown): void {
    const errorInfo =
      error instanceof Error ? ` - ${error.message}` : error ? ` - ${String(error)}` : '';
    console.warn(`[HookManager] ${message}${errorInfo}`);
  }

  /**
   * Log info message
   */
  private info(message: string): void {
    console.info(`[HookManager] ${message}`);
  }
}
