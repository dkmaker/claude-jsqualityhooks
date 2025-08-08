/**
 * BiomeAdapter Interface
 *
 * Defines the contract for Biome version adapters to handle differences
 * between Biome 1.x (--apply) and 2.x (--write) command flags.
 */

export interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fixed: boolean;
  fixable: boolean;
}

export interface BiomeCommandOptions {
  autoFix?: boolean;
  configPath?: string | undefined;
  unsafeFixes?: boolean;
}

/**
 * Base interface for Biome version adapters
 */
export interface BiomeAdapter {
  /**
   * Build command arguments for Biome execution
   * @param file - File path to check
   * @param options - Command options
   * @returns Array of command arguments
   */
  buildCommand(file: string, options?: BiomeCommandOptions): string[];

  /**
   * Parse Biome JSON output into ValidationIssue format
   * @param output - Raw JSON output from Biome
   * @param filePath - File path being validated
   * @returns Array of validation issues
   */
  parseOutput(output: string, filePath: string): ValidationIssue[];

  /**
   * Get the fix flag for this Biome version
   * @param unsafe - Whether to use unsafe fixes
   * @returns Fix flag string
   */
  getFixFlag(unsafe?: boolean): string;

  /**
   * Get the version identifier for this adapter
   */
  readonly version: '1.x' | '2.x';
}
