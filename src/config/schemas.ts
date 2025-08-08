/**
 * Zod schemas for configuration validation
 *
 * This module defines runtime validation schemas that match the TypeScript interfaces
 * defined in src/types/config.ts. All schemas include smart defaults for optional fields.
 */

import { z } from 'zod';

/**
 * Smart defaults for configuration options
 */
const SMART_DEFAULTS = {
  enabled: true,
  autoFixEnabled: true,
  autoFixMaxAttempts: 3,
  timeout: 5000, // 5 seconds
  biomeVersion: 'auto' as const,
  include: ['src/**/*.{ts,tsx,js,jsx}', '**/*.{ts,tsx,js,jsx}'] as string[],
  exclude: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**'] as string[],
};

/**
 * Biome validator configuration schema
 */
export const biomeConfigSchema = z
  .object({
    enabled: z.boolean(),
    version: z.enum(['auto', '1.x', '2.x']).default(SMART_DEFAULTS.biomeVersion),
    configPath: z.string().optional(),
  })
  .default({
    enabled: true,
    version: SMART_DEFAULTS.biomeVersion,
  });

/**
 * TypeScript validator configuration schema
 */
export const typeScriptConfigSchema = z
  .object({
    enabled: z.boolean(),
    configPath: z.string().optional(),
  })
  .default({
    enabled: true,
  });

/**
 * Validators configuration schema
 */
export const validatorsConfigSchema = z
  .object({
    biome: biomeConfigSchema.optional(),
    typescript: typeScriptConfigSchema.optional(),
  })
  .default({
    biome: {
      enabled: true,
      version: SMART_DEFAULTS.biomeVersion,
    },
  });

/**
 * Auto-fix configuration schema
 */
export const autoFixConfigSchema = z
  .object({
    enabled: z.boolean(),
    maxAttempts: z.number().min(1).max(10).default(SMART_DEFAULTS.autoFixMaxAttempts),
  })
  .default({
    enabled: SMART_DEFAULTS.autoFixEnabled,
    maxAttempts: SMART_DEFAULTS.autoFixMaxAttempts,
  });

/**
 * Main configuration schema
 *
 * This schema validates all 10 v1 configuration options with smart defaults:
 * 1. enabled (boolean) - defaults to true
 * 2. include (string[]) - defaults to common TS/JS patterns
 * 3. exclude (string[]) - defaults to common build/dependency dirs
 * 4. biome.enabled (boolean) - defaults to true
 * 5. biome.configPath (string, optional) - no default
 * 6. typescript.enabled (boolean) - defaults to true
 * 7. typescript.configPath (string, optional) - no default
 * 8. autoFix.enabled (boolean) - defaults to true
 * 9. autoFix.maxAttempts (number, optional) - defaults to 3
 * 10. timeout (number, optional) - defaults to 5000ms
 */
export const configSchema = z.object({
  // Global settings
  enabled: z.boolean().default(SMART_DEFAULTS.enabled),
  include: z.array(z.string()).default(SMART_DEFAULTS.include),
  exclude: z.array(z.string()).default(SMART_DEFAULTS.exclude),

  // Validators configuration
  validators: validatorsConfigSchema,

  // Auto-fix configuration
  autoFix: autoFixConfigSchema,

  // Global timeout setting
  timeout: z.number().min(1000).max(30000).default(SMART_DEFAULTS.timeout),
});

/**
 * Type inference from schema
 */
export type ConfigSchema = z.infer<typeof configSchema>;

/**
 * Default configuration object for when no config file exists
 */
export const DEFAULT_CONFIG: ConfigSchema = {
  enabled: SMART_DEFAULTS.enabled,
  include: SMART_DEFAULTS.include,
  exclude: SMART_DEFAULTS.exclude,
  validators: {
    biome: {
      enabled: true,
      version: SMART_DEFAULTS.biomeVersion,
    },
  },
  autoFix: {
    enabled: SMART_DEFAULTS.autoFixEnabled,
    maxAttempts: SMART_DEFAULTS.autoFixMaxAttempts,
  },
  timeout: SMART_DEFAULTS.timeout,
};
