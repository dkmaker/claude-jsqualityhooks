/**
 * Hook system for claude-jsqualityhooks
 *
 * This module implements the post-write hooks that integrate with Claude Code.
 */

// Re-export hook types for convenience
export type {
  ClaudeCodeInput,
  FileInfo,
  Hook,
  HookExecutionOptions,
  HookResult,
  PatternMatchOptions,
} from '../types/hooks.js';
// Core hook system exports
export { BaseHook } from './BaseHook.js';
export { HookManager } from './HookManager.js';
export { InputHandler } from './InputHandler.js';
export {
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_INCLUDE_PATTERNS,
  PatternMatcher,
} from './PatternMatcher.js';
export { PostWriteHook } from './PostWriteHook.js';

import type { Config } from '../types/config.js';
import { HookManager } from './HookManager.js';

// Global hook manager instance (initialized when needed)
let globalHookManager: HookManager | null = null;

/**
 * Initialize hook system with configuration
 */
export async function initializeHooks(config: Config): Promise<HookManager> {
  if (globalHookManager) {
    console.warn('[HookSystem] Hook system already initialized, returning existing instance');
    return globalHookManager;
  }

  try {
    globalHookManager = new HookManager(config);
    await globalHookManager.initialize();
    console.info('[HookSystem] Hook system initialized successfully');
    return globalHookManager;
  } catch (error) {
    console.error('[HookSystem] Failed to initialize hook system:', error);
    throw error;
  }
}

/**
 * Get the global hook manager instance
 */
export function getHookManager(): HookManager | null {
  return globalHookManager;
}

/**
 * Process file write operation
 */
export async function processFileWrite(filePath: string, content?: string): Promise<unknown> {
  try {
    if (!globalHookManager) {
      console.warn('[HookSystem] Hook system not initialized, cannot process file write');
      return { success: false, error: 'Hook system not initialized' };
    }

    // Create FileInfo from the provided parameters
    const { InputHandler } = await import('./InputHandler.js');
    const fileInfo = await InputHandler.createFileInfo(filePath, content);

    // Execute post-write hook
    const result = await globalHookManager.executePostWrite(fileInfo);

    console.info(
      `[HookSystem] Processed file write for ${filePath}: success=${result.success}, modified=${result.modified}`
    );
    return result;
  } catch (error) {
    console.error(`[HookSystem] Failed to process file write for ${filePath}:`, error);
    return {
      success: false,
      modified: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process Claude Code input from stdin
 */
export async function processClaudeInput(): Promise<unknown> {
  try {
    if (!globalHookManager) {
      console.warn('[HookSystem] Hook system not initialized, cannot process Claude input');
      return { success: false, error: 'Hook system not initialized' };
    }

    // Parse input from stdin
    const { InputHandler } = await import('./InputHandler.js');
    const input = await InputHandler.parseStdin();

    if (!input) {
      console.warn('[HookSystem] No valid input received from stdin');
      return { success: false, error: 'No valid input received' };
    }

    console.info(
      `[HookSystem] Processing Claude operation: ${InputHandler.getOperationSummary(input)}`
    );

    // Convert input to FileInfo
    const fileInfo = await InputHandler.inputToFileInfo(input);

    // Execute post-write hook
    const result = await globalHookManager.executePostWrite(fileInfo);

    console.info(
      `[HookSystem] Processed Claude input: success=${result.success}, modified=${result.modified}`
    );
    return result;
  } catch (error) {
    console.error('[HookSystem] Failed to process Claude input:', error);
    return {
      success: false,
      modified: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Shutdown hook system (cleanup)
 */
export function shutdownHooks(): void {
  if (globalHookManager) {
    console.info('[HookSystem] Shutting down hook system');
    globalHookManager = null;
  }
}
