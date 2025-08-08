/**
 * Input handler for claude-jsqualityhooks
 *
 * This module handles parsing and processing input from Claude Code,
 * including stdin input and file operation metadata.
 */

import { readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import type { ClaudeCodeInput, FileInfo } from '../types/hooks.js';

/**
 * Handles parsing and processing Claude Code input
 *
 * Features:
 * - Parse JSON input from stdin
 * - Extract file information from operations
 * - Handle different operation types (write, edit, multiedit)
 * - Validate input structure
 * - Convert to FileInfo format
 */
export class InputHandler {
  /**
   * Parse Claude Code input from stdin
   */
  static async parseStdin(): Promise<ClaudeCodeInput | null> {
    try {
      // Read all input from stdin
      const chunks: Uint8Array[] = [];

      if (process.stdin.isTTY) {
        // No stdin input available
        return null;
      }

      // Set stdin encoding
      process.stdin.setEncoding('utf8');

      // Read stdin chunks
      for await (const chunk of process.stdin) {
        chunks.push(Buffer.from(chunk, 'utf8'));
      }

      if (chunks.length === 0) {
        return null;
      }

      // Combine chunks and parse JSON
      const inputData = Buffer.concat(chunks).toString('utf8').trim();

      if (!inputData) {
        return null;
      }

      const parsed = JSON.parse(inputData) as ClaudeCodeInput;
      return InputHandler.validateInput(parsed) ? parsed : null;
    } catch (error) {
      console.warn('[InputHandler] Failed to parse stdin input:', error);
      return null;
    }
  }

  /**
   * Parse Claude Code input from string
   */
  static parseString(input: string): ClaudeCodeInput | null {
    try {
      const trimmed = input.trim();
      if (!trimmed) {
        return null;
      }

      const parsed = JSON.parse(trimmed) as ClaudeCodeInput;
      return InputHandler.validateInput(parsed) ? parsed : null;
    } catch (error) {
      console.warn('[InputHandler] Failed to parse input string:', error);
      return null;
    }
  }

  /**
   * Convert Claude Code input to FileInfo
   */
  static async inputToFileInfo(input: ClaudeCodeInput): Promise<FileInfo> {
    const filePath = resolve(input.file_path);
    const extension = extname(filePath);

    // Determine file content based on operation type
    let content = '';

    try {
      switch (input.operation) {
        case 'write':
          // For write operations, use provided content
          content = input.content ?? '';
          break;

        case 'edit':
        case 'multiedit':
          // For edit operations, read current file content
          // In real scenarios, Claude would provide the final content
          // but we can read from disk as fallback
          try {
            content = readFileSync(filePath, 'utf-8');
          } catch {
            content = input.content ?? '';
          }
          break;

        default:
          content = input.content ?? '';
      }
    } catch (error) {
      console.warn(`[InputHandler] Failed to determine content for ${filePath}:`, error);
      content = input.content ?? '';
    }

    // Get file stats
    let exists = false;
    let size = content.length;
    let lastModified: number | undefined;

    try {
      const fs = await import('node:fs');
      const stats = fs.statSync(filePath);
      exists = true;
      size = stats.size;
      lastModified = stats.mtime.getTime();
    } catch {
      // File doesn't exist or can't be accessed
      exists = false;
      size = content.length;
    }

    return {
      path: filePath,
      content,
      extension,
      exists,
      size,
      lastModified,
    };
  }

  /**
   * Create FileInfo from file path and optional content
   */
  static async createFileInfo(filePath: string, content?: string): Promise<FileInfo> {
    const resolvedPath = resolve(filePath);
    const extension = extname(resolvedPath);

    // If content not provided, try to read from file
    let fileContent = content;
    if (!fileContent) {
      try {
        fileContent = readFileSync(resolvedPath, 'utf-8');
      } catch {
        fileContent = '';
      }
    }

    // Get file stats
    let exists = false;
    let size = fileContent.length;
    let lastModified: number | undefined;

    try {
      const fs = await import('node:fs');
      const stats = fs.statSync(resolvedPath);
      exists = true;
      size = stats.size;
      lastModified = stats.mtime.getTime();
    } catch {
      exists = false;
      size = fileContent.length;
    }

    return {
      path: resolvedPath,
      content: fileContent,
      extension,
      exists,
      size,
      lastModified,
    };
  }

  /**
   * Validate Claude Code input structure
   */
  private static validateInput(input: unknown): input is ClaudeCodeInput {
    if (!input || typeof input !== 'object') {
      return false;
    }

    // Cast to Record to access properties safely
    const obj = input as Record<string, unknown>;

    // Check required fields
    if (!obj.operation || typeof obj.operation !== 'string') {
      return false;
    }

    if (!obj.file_path || typeof obj.file_path !== 'string') {
      return false;
    }

    // Check valid operation types
    const validOperations = ['write', 'edit', 'multiedit'];
    if (!validOperations.includes(obj.operation)) {
      return false;
    }

    // For write operations, content should be present
    if (obj.operation === 'write' && obj.content === undefined) {
      console.warn('[InputHandler] Write operation without content');
      // Don't fail validation - content could be empty string
    }

    // For edit operations, edits array should be present
    if ((obj.operation === 'edit' || obj.operation === 'multiedit') && !Array.isArray(obj.edits)) {
      console.warn('[InputHandler] Edit operation without edits array');
      // Don't fail validation - edits could be provided another way
    }

    return true;
  }

  /**
   * Get operation summary for logging
   */
  static getOperationSummary(input: ClaudeCodeInput): string {
    switch (input.operation) {
      case 'write':
        return `Write file: ${input.file_path}`;
      case 'edit':
        return `Edit file: ${input.file_path} (${input.edits?.length || 0} edits)`;
      case 'multiedit':
        return `Multi-edit file: ${input.file_path} (${input.edits?.length || 0} edits)`;
      default:
        return `Unknown operation: ${input.operation} on ${input.file_path}`;
    }
  }
}
