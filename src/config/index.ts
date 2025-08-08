/**
 * Configuration loader for claude-jsqualityhooks
 *
 * This module handles loading and validating the YAML configuration file.
 * Uses the YamlConfigLoader class to provide a clean API for config operations.
 */

import type { Config } from '../types/config.js';
import { YamlConfigLoader } from './YamlConfigLoader.js';

// Export the config types and schemas for use by other modules
export type {
  AutoFixConfig,
  BiomeConfig,
  Config,
  ConfigLoader,
  TypeScriptConfig,
  ValidatorsConfig,
} from '../types/config.js';
export { type ConfigSchema, configSchema, DEFAULT_CONFIG } from './schemas.js';
// Export the YamlConfigLoader class for direct use
export { YamlConfigLoader } from './YamlConfigLoader.js';

/**
 * Convenience function to load configuration using the default YamlConfigLoader
 *
 * This function creates a YamlConfigLoader instance and loads the configuration
 * from the default location (claude-jsqualityhooks.config.yaml in project root).
 *
 * @returns Promise<Config> - Validated configuration object with smart defaults applied
 * @throws Never - All errors are handled gracefully with process.exit()
 */
export async function loadConfig(): Promise<Config> {
  const loader = new YamlConfigLoader();
  return await loader.load();
}

/**
 * Convenience function to validate configuration using the default YamlConfigLoader
 *
 * @param config - Raw configuration object to validate
 * @returns boolean - Type guard indicating if the config is valid
 */
export function validateConfig(config: unknown): config is Config {
  const loader = new YamlConfigLoader();
  return loader.validate(config);
}
