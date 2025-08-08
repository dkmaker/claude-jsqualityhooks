/**
 * BiomeValidator
 *
 * Main Biome validator that uses version-specific adapters to handle
 * differences between Biome 1.x and 2.x command structures.
 */

import { execa } from 'execa';
import type { BiomeConfig } from '../../types/config.js';
import { detectBiomeVersion } from '../../utils/versionDetector.js';
import type { BiomeAdapter, ValidationIssue } from './adapters/BiomeAdapter.js';
import { createAdapterFromDetection } from './adapters/BiomeAdapterFactory.js';

export interface BiomeValidationResult {
  success: boolean;
  issues: ValidationIssue[];
  fixed: number;
  error?: string | undefined;
}

export class BiomeValidator {
  private adapter: BiomeAdapter | null = null;
  private config: BiomeConfig;

  constructor(config: BiomeConfig) {
    this.config = config;
  }

  /**
   * Initialize the validator with the appropriate adapter
   */
  private async initialize(): Promise<void> {
    if (this.adapter) {
      return;
    }

    try {
      const versionInfo = await detectBiomeVersion(this.config);
      this.adapter = createAdapterFromDetection(versionInfo);
    } catch (error) {
      throw new Error(`Failed to initialize Biome validator: ${error}`);
    }
  }

  /**
   * Validate a file using Biome
   */
  async validate(filePath: string, autoFix = false): Promise<BiomeValidationResult> {
    try {
      await this.initialize();

      if (!this.adapter) {
        return {
          success: false,
          issues: [],
          fixed: 0,
          error: 'Biome adapter not initialized',
        };
      }

      // Build command using adapter
      const command = this.adapter.buildCommand(filePath, {
        autoFix,
        configPath: this.config.configPath || undefined,
        unsafeFixes: false, // Always use safe fixes by default in v1
      });

      // Execute Biome command
      const result = await execa('npx', ['@biomejs/biome', ...command], {
        cwd: process.cwd(),
        timeout: 30000, // 30 second timeout
        stdio: 'pipe',
        reject: false, // Don't throw on non-zero exit codes
      });

      // Parse output using adapter
      const issues = this.adapter.parseOutput(result.stdout || '', filePath);

      // Count fixed issues
      const fixed = issues.filter((issue) => issue.fixed).length;

      return {
        success: result.exitCode === 0,
        issues,
        fixed,
        error: result.exitCode !== 0 && result.stderr ? result.stderr : undefined,
      };
    } catch (error) {
      return {
        success: false,
        issues: [],
        fixed: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if a file should be validated by Biome
   */
  static shouldValidate(filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';

    // Biome supports these file types
    const supportedExtensions = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'jsonc'];

    return supportedExtensions.includes(ext);
  }

  /**
   * Get the current adapter version
   */
  async getVersion(): Promise<string> {
    await this.initialize();
    return this.adapter?.version || 'unknown';
  }
}
