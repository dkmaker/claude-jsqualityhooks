/**
 * TSConfig Loader
 *
 * Handles discovery and loading of TypeScript configuration files.
 * Supports custom paths and fallback to default locations.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export interface TSConfigOptions {
  configPath?: string;
  projectRoot?: string;
}

export interface TSConfig {
  compilerOptions?: Record<string, unknown>;
  include?: string[];
  exclude?: string[];
  extends?: string;
}

export interface LoadedTSConfig {
  config: TSConfig;
  configPath: string;
}

/**
 * Find TypeScript configuration file
 */
export function findTSConfigFile(options: TSConfigOptions = {}): string | null {
  const { configPath, projectRoot = process.cwd() } = options;

  // Use explicit config path if provided
  if (configPath) {
    const fullPath = resolve(projectRoot, configPath);
    return existsSync(fullPath) ? fullPath : null;
  }

  // Default locations to check
  const defaultPaths = [
    resolve(projectRoot, 'tsconfig.json'),
    resolve(projectRoot, 'jsconfig.json'),
  ];

  for (const path of defaultPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Try to find tsconfig.json in parent directories (similar to ts.findConfigFile)
  let currentDir = projectRoot;
  const rootDir = resolve('/');

  while (currentDir !== rootDir) {
    const configFile = join(currentDir, 'tsconfig.json');
    if (existsSync(configFile)) {
      return configFile;
    }

    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Load and parse TypeScript configuration file
 */
export async function loadTSConfig(configPath: string): Promise<TSConfig> {
  try {
    const content = await readFile(configPath, 'utf-8');

    // Remove JSON comments (basic implementation for // and /* */)
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, ''); // Remove // comments

    const config = JSON.parse(cleanContent) as TSConfig;

    // Handle extends property (basic implementation)
    if (config.extends) {
      const baseConfigPath = resolve(dirname(configPath), config.extends);
      if (existsSync(baseConfigPath)) {
        const baseConfig = await loadTSConfig(baseConfigPath);
        // Merge configurations (extends first, then current overrides)
        return {
          ...baseConfig,
          ...config,
          compilerOptions: {
            ...baseConfig.compilerOptions,
            ...config.compilerOptions,
          },
        };
      }
    }

    return config;
  } catch (error) {
    throw new Error(`Failed to load TypeScript config from ${configPath}: ${error}`);
  }
}

/**
 * Load TypeScript configuration with discovery
 */
export async function loadTSConfigWithDiscovery(
  options: TSConfigOptions = {}
): Promise<LoadedTSConfig | null> {
  const configPath = findTSConfigFile(options);

  if (!configPath) {
    return null;
  }

  try {
    const config = await loadTSConfig(configPath);
    return { config, configPath };
  } catch (error) {
    // Return null instead of throwing to allow graceful fallbacks
    console.warn(`Warning: Could not load TypeScript config from ${configPath}:`, error);
    return null;
  }
}

/**
 * Get default TypeScript compiler options
 */
export function getDefaultCompilerOptions(): Record<string, unknown> {
  return {
    target: 'ES2020',
    module: 'CommonJS',
    moduleResolution: 'node',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    noEmit: true, // We're only doing type checking
  };
}
