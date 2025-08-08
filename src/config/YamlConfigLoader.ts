/**
 * YAML Configuration Loader for claude-jsqualityhooks
 *
 * This module implements the YamlConfigLoader class that:
 * 1. Loads configuration from claude-jsqualityhooks.config.yaml
 * 2. Validates configuration with Zod schemas
 * 3. Provides graceful error handling for missing files
 * 4. Applies smart defaults for optional settings
 */

import { access, constants, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ZodError } from 'zod';

import type { Config, ConfigLoader } from '../types/config.js';
import { type ConfigSchema, configSchema } from './schemas.js';

/**
 * Configuration file constants
 */
const CONFIG_FILE = 'claude-jsqualityhooks.config.yaml';
const CONFIG_PATH = resolve(process.cwd(), CONFIG_FILE);

/**
 * YAML Configuration Loader
 *
 * Implements the ConfigLoader interface to load and validate
 * configuration from the required YAML file.
 */
export class YamlConfigLoader implements ConfigLoader {
  private readonly configPath: string;
  private readonly configFile: string;

  constructor(configPath?: string) {
    this.configFile = CONFIG_FILE;
    this.configPath = configPath ?? CONFIG_PATH;
  }

  /**
   * Load and validate configuration from YAML file
   *
   * @returns Promise<Config> - Validated configuration object
   * @throws Never - All errors are handled gracefully with process.exit()
   */
  async load(): Promise<Config> {
    try {
      // Check if config file exists
      await this.checkConfigExists();

      // Read and parse YAML file
      const rawContent = await readFile(this.configPath, 'utf-8');
      const parsedYaml = parseYaml(rawContent);

      // Validate with Zod schema
      const isValid = this.validate(parsedYaml);

      if (!isValid || !this._validatedConfig) {
        throw new Error('Configuration validation failed');
      }

      return this._validatedConfig as Config;
    } catch (error) {
      this.handleLoadError(error);
      // This line should never be reached due to process.exit() in handleLoadError
      throw new Error('Unexpected error in configuration loading');
    }
  }

  /**
   * Validate configuration object using Zod schema
   *
   * @param config - Raw configuration object to validate
   * @returns boolean - Type guard for Config interface
   */
  validate(config: unknown): config is Config {
    try {
      const result = configSchema.parse(config);
      // Store the validated result for later use
      this._validatedConfig = result;
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        this.showValidationErrors(error);
      }
      return false;
    }
  }

  private _validatedConfig?: ConfigSchema;

  /**
   * Check if configuration file exists
   *
   * @throws Error if file doesn't exist
   */
  private async checkConfigExists(): Promise<void> {
    try {
      await access(this.configPath, constants.F_OK);
    } catch {
      this.showWarningAndExit();
    }
  }

  /**
   * Handle loading errors with appropriate user messages
   *
   * @param error - The error that occurred during loading
   */
  private handleLoadError(error: unknown): never {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        this.showWarningAndExit();
      } else if (error.name === 'YAMLParseError' || error.message.includes('YAML')) {
        this.showYamlParseError(error);
      } else if (error instanceof ZodError) {
        this.showValidationErrors(error);
      } else {
        this.showGenericError(error);
      }
    }

    // Fallback for unknown error types
    console.error('❌ An unexpected error occurred while loading configuration.');
    console.error('Please check your claude-jsqualityhooks.config.yaml file.');
    process.exit(1);
  }

  /**
   * Show friendly warning message and exit when config file is missing
   *
   * This method provides clear instructions for creating the config file
   * and exits with code 0 (not an error, just missing setup)
   */
  private showWarningAndExit(): never {
    console.log('⚠️  Configuration file not found');
    console.log('');
    console.log(`Claude JS Quality Hooks requires a configuration file:`);
    console.log(`📄 ${this.configFile}`);
    console.log('');
    console.log('To create this file, run:');
    console.log('  npx claude-jsqualityhooks init');
    console.log('');
    console.log('Or create it manually with minimal configuration:');
    console.log('');
    console.log('# claude-jsqualityhooks.config.yaml');
    console.log('enabled: true');
    console.log('validators:');
    console.log('  biome:');
    console.log('    enabled: true');
    console.log('');
    console.log('For more configuration options, see:');
    console.log('https://github.com/dkmaker/claude-jsqualityhooks#configuration');

    // Exit with code 0 - this is not an error, just missing setup
    process.exit(0);
  }

  /**
   * Show YAML parsing errors with helpful context
   *
   * @param error - YAML parsing error
   */
  private showYamlParseError(error: Error): never {
    console.error('❌ Configuration file has invalid YAML syntax');
    console.error('');
    console.error(`File: ${this.configFile}`);
    console.error('Error details:');
    console.error(`  ${error.message}`);
    console.error('');
    console.error('Please check your YAML syntax. Common issues:');
    console.error('  - Incorrect indentation (use spaces, not tabs)');
    console.error('  - Missing colons after property names');
    console.error('  - Unmatched quotes or brackets');
    console.error('');
    console.error('For help with YAML syntax, see:');
    console.error('https://yaml.org/');

    process.exit(1);
  }

  /**
   * Show validation errors with specific field information
   *
   * @param error - Zod validation error
   */
  private showValidationErrors(error: ZodError): never {
    console.error('❌ Configuration file has invalid values');
    console.error('');
    console.error(`File: ${this.configFile}`);
    console.error('Validation errors:');

    for (const issue of error.issues) {
      const path = issue.path.join('.');
      const field = path || 'root';
      console.error(`  ${field}: ${issue.message}`);
    }

    console.error('');
    console.error('For valid configuration options, see:');
    console.error('https://github.com/dkmaker/claude-jsqualityhooks#configuration');

    process.exit(1);
  }

  /**
   * Show generic error message for unexpected errors
   *
   * @param error - Unknown error
   */
  private showGenericError(error: Error): never {
    console.error('❌ Failed to load configuration file');
    console.error('');
    console.error(`File: ${this.configFile}`);
    console.error('Error details:');
    console.error(`  ${error.message}`);
    console.error('');
    console.error('Please check that:');
    console.error('  - The file exists and is readable');
    console.error('  - The file contains valid YAML syntax');
    console.error('  - The configuration values are correct');

    process.exit(1);
  }
}
