/**
 * File pattern matcher for claude-jsqualityhooks
 *
 * This module handles include/exclude pattern matching using fast-glob
 * with smart defaults for TypeScript/JavaScript files.
 */

import fg from 'fast-glob';
import type { PatternMatchOptions } from '../types/hooks.js';

/**
 * Default file patterns
 */
export const DEFAULT_INCLUDE_PATTERNS = ['**/*.{ts,tsx,js,jsx}', '*.{ts,tsx,js,jsx}'];

export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.git/**',
  '**/*.d.ts', // Skip type declaration files by default
];

/**
 * File pattern matcher with smart defaults
 */
export class PatternMatcher {
  private readonly patterns: PatternMatchOptions;

  constructor(include?: string[], exclude?: string[]) {
    this.patterns = {
      include: include && include.length > 0 ? include : DEFAULT_INCLUDE_PATTERNS,
      exclude: exclude && exclude.length > 0 ? exclude : DEFAULT_EXCLUDE_PATTERNS,
    };
  }

  /**
   * Check if a file should be validated based on include/exclude patterns
   */
  shouldValidate(filePath: string): boolean {
    try {
      // Normalize path for consistent matching
      const normalizedPath = filePath.replace(/\\/g, '/');

      // Check if file matches include patterns
      const isIncluded = this.matchesPatterns(normalizedPath, this.patterns.include);

      if (!isIncluded) {
        return false;
      }

      // Check if file matches exclude patterns
      const isExcluded = this.matchesPatterns(normalizedPath, this.patterns.exclude);

      return !isExcluded;
    } catch (error) {
      // On pattern matching error, be conservative and validate
      console.warn(`[PatternMatcher] Pattern matching failed for ${filePath}:`, error);
      return true;
    }
  }

  /**
   * Get files matching the patterns from a directory
   */
  async getMatchingFiles(baseDirectory: string): Promise<string[]> {
    try {
      const files = await fg(this.patterns.include, {
        cwd: baseDirectory,
        ignore: this.patterns.exclude,
        absolute: true,
        onlyFiles: true,
      });

      return files;
    } catch (error) {
      console.warn(`[PatternMatcher] Failed to get matching files from ${baseDirectory}:`, error);
      return [];
    }
  }

  /**
   * Get the current patterns
   */
  getPatterns(): PatternMatchOptions {
    return { ...this.patterns };
  }

  /**
   * Check if a path matches any of the given patterns
   */
  private matchesPatterns(filePath: string, patterns: string[]): boolean {
    // Use fast-glob's minimatch functionality
    try {
      // Create a temporary glob to test the patterns
      for (const pattern of patterns) {
        if (this.testPattern(filePath, pattern)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn(`[PatternMatcher] Pattern test failed:`, error);
      // On error, be conservative - include files for include patterns, exclude for exclude patterns
      return false;
    }
  }

  /**
   * Test if a file path matches a specific pattern
   */
  private testPattern(filePath: string, pattern: string): boolean {
    try {
      // Use minimatch-style matching
      const regex = this.patternToRegex(pattern);
      return regex.test(filePath);
    } catch (error) {
      console.warn(
        `[PatternMatcher] Pattern regex conversion failed for pattern "${pattern}":`,
        error
      );
      return false;
    }
  }

  /**
   * Convert glob pattern to regex for testing
   * Simple implementation for common patterns
   */
  private patternToRegex(pattern: string): RegExp {
    // Escape special regex characters except glob characters
    let regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*\*/g, '.*') // ** matches any path
      .replace(/\*/g, '[^/]*') // * matches any file name
      .replace(/\?/g, '.'); // ? matches single character

    // Handle file extensions pattern like {ts,tsx,js,jsx}
    regexPattern = regexPattern.replace(/\{([^}]+)\}/g, '($1)');
    regexPattern = regexPattern.replace(/,/g, '|');

    // Anchor the pattern
    regexPattern = `^${regexPattern}$`;

    return new RegExp(regexPattern, 'i'); // Case insensitive for Windows compatibility
  }
}
