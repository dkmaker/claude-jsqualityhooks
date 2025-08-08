/**
 * Hook system types for claude-jsqualityhooks
 *
 * This module defines the TypeScript interfaces for the hook system.
 */

// ValidationResult will be imported in Phase 2

/**
 * File information passed to hooks
 */
export interface FileInfo {
  /** Absolute file path */
  path: string;
  /** File content */
  content: string;
  /** File extension */
  extension: string;
  /** Whether file exists on disk */
  exists: boolean;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  lastModified?: number | undefined;
}

/**
 * Result returned by hook execution
 */
export interface HookResult {
  /** Whether hook execution was successful */
  success: boolean;
  /** Whether the file was modified during hook execution */
  modified: boolean;
  /** Hook execution duration in milliseconds */
  duration: number;
  /** Validation results if any */
  validation?: unknown;
  /** Error message if hook failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Base hook interface
 */
export interface Hook {
  /** Hook name/identifier */
  name: string;
  /** Execute hook on file */
  execute(file: FileInfo): Promise<HookResult>;
}

/**
 * Claude Code input structure
 */
export interface ClaudeCodeInput {
  /** Operation type */
  operation: 'write' | 'edit' | 'multiedit';
  /** File path being operated on */
  file_path: string;
  /** New file content */
  content?: string;
  /** Edit operations (for edit/multiedit) */
  edits?: Array<{
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }>;
  /** Additional metadata from Claude */
  metadata?: Record<string, unknown>;
}

/**
 * File pattern matching options
 */
export interface PatternMatchOptions {
  /** Include patterns (glob) */
  include: string[];
  /** Exclude patterns (glob) */
  exclude: string[];
}

/**
 * Hook execution options
 */
export interface HookExecutionOptions {
  /** Timeout in milliseconds */
  timeout: number;
  /** Pattern matching options */
  patterns: PatternMatchOptions;
  /** Whether to continue on hook failure */
  continueOnFailure: boolean;
}
