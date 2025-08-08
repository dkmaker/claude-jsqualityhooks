/**
 * Configuration types for claude-jsqualityhooks
 *
 * This module defines the TypeScript interfaces for configuration objects.
 * Based on the 10 v1 configuration options defined in docs/config/configuration-guide.md
 */

/**
 * Biome validator configuration
 */
export interface BiomeConfig {
  enabled: boolean;
  version?: 'auto' | '1.x' | '2.x';
  configPath?: string;
}

/**
 * TypeScript validator configuration
 */
export interface TypeScriptConfig {
  enabled: boolean;
  configPath?: string;
}

/**
 * Validators configuration section
 */
export interface ValidatorsConfig {
  biome?: BiomeConfig;
  typescript?: TypeScriptConfig;
}

/**
 * Auto-fix configuration
 */
export interface AutoFixConfig {
  enabled: boolean;
  maxAttempts?: number;
}

/**
 * Main configuration interface
 *
 * Contains all 10 v1 configuration options:
 * 1. enabled (boolean)
 * 2. include (string[])
 * 3. exclude (string[])
 * 4. biome.enabled (boolean)
 * 5. biome.configPath (string, optional)
 * 6. typescript.enabled (boolean)
 * 7. typescript.configPath (string, optional)
 * 8. autoFix.enabled (boolean)
 * 9. autoFix.maxAttempts (number, optional, default 3)
 * 10. timeout (number, optional, default 5000ms)
 */
export interface Config {
  // Global settings
  enabled: boolean;
  include?: string[];
  exclude?: string[];

  // Validators configuration
  validators: ValidatorsConfig;

  // Auto-fix configuration
  autoFix: AutoFixConfig;

  // Global timeout setting
  timeout?: number;
}

/**
 * Configuration loader interface
 */
export interface ConfigLoader {
  load(): Promise<Config>;
  validate(config: unknown): config is Config;
}
