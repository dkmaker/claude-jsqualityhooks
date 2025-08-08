/**
 * Base hook class for claude-jsqualityhooks
 *
 * This module provides the abstract base class for all hooks with built-in
 * timeout handling, error recovery, and configuration management.
 */

import type { Config } from '../types/config.js';
import type { FileInfo, Hook, HookResult } from '../types/hooks.js';

/**
 * Abstract base class for all hooks
 *
 * Provides common functionality:
 * - Timeout handling with Promise.race
 * - Error recovery (warn but don't block)
 * - Configuration management
 * - Performance timing
 */
export abstract class BaseHook implements Hook {
  /** Hook identifier */
  abstract readonly name: string;

  /** Default timeout in milliseconds */
  protected readonly defaultTimeout = 5000;

  /** Failure strategy - always warn but don't block */
  protected readonly failureStrategy = 'warn';

  constructor(protected readonly config: Config) {}

  /**
   * Execute hook with timeout protection and error recovery
   */
  async execute(file: FileInfo): Promise<HookResult> {
    const startTime = performance.now();

    try {
      // Execute hook with timeout protection
      const result = await this.withTimeout(this.executeHook(file));
      const duration = performance.now() - startTime;

      return {
        ...result,
        duration,
        success: true,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Warn but don't block - this is critical for the system
      console.warn(`[${this.name}] Hook execution failed: ${errorMessage}`);

      // Return safe failure result
      return {
        success: false,
        modified: false,
        duration,
        error: errorMessage,
        metadata: {
          hookName: this.name,
          failureStrategy: this.failureStrategy,
        },
      };
    }
  }

  /**
   * Abstract hook implementation method
   * Subclasses must implement their specific logic here
   */
  protected abstract executeHook(file: FileInfo): Promise<Omit<HookResult, 'duration' | 'success'>>;

  /**
   * Wrap promise with timeout using Promise.race
   *
   * @param promise - Promise to wrap with timeout
   * @returns Promise that rejects after timeout
   */
  protected withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutMs = this.config.timeout ?? this.defaultTimeout;

    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Hook '${this.name}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Get the effective timeout value
   */
  protected getTimeout(): number {
    return this.config.timeout ?? this.defaultTimeout;
  }

  /**
   * Log warning message (non-blocking)
   */
  protected warn(message: string, error?: Error): void {
    const errorInfo = error ? ` - ${error.message}` : '';
    console.warn(`[${this.name}] ${message}${errorInfo}`);
  }

  /**
   * Log info message
   */
  protected info(message: string): void {
    console.info(`[${this.name}] ${message}`);
  }
}
