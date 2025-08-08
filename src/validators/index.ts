/**
 * Validation engines for claude-jsqualityhooks
 *
 * This module exports all validators (Biome, TypeScript, etc.)
 */

import type { BiomeConfig, TypeScriptConfig } from '../types/config.js';

// Biome adapter exports
export type {
  BiomeAdapter,
  BiomeCommandOptions,
  ValidationIssue,
} from './biome/adapters/BiomeAdapter.js';
export {
  createAdapter,
  createAdapterFromDetection,
  createAdapterFromVersion,
} from './biome/adapters/BiomeAdapterFactory.js';
export { BiomeV1Adapter } from './biome/adapters/BiomeV1Adapter.js';
export { BiomeV2Adapter } from './biome/adapters/BiomeV2Adapter.js';
export type { BiomeValidationResult } from './biome/BiomeValidator.js';
// Biome validator exports
export { BiomeValidator } from './biome/BiomeValidator.js';
export type { TypeScriptValidationResult } from './typescript/index.js';
// TypeScript validator exports
export { TypeScriptValidator } from './typescript/index.js';
export type {
  ValidationResponse,
  ValidationResult as ValidatorResult,
} from './ValidatorManager.js';
// ValidatorManager exports
export { ValidatorManager } from './ValidatorManager.js';

// Convenience function for backward compatibility
export async function validateWithBiome(
  filePath: string,
  config: BiomeConfig,
  autoFix = false
): Promise<unknown> {
  const { BiomeValidator } = await import('./biome/BiomeValidator.js');
  const validator = new BiomeValidator(config);
  return await validator.validate(filePath, autoFix);
}

export async function validateWithTypeScript(
  file: { path: string; relativePath: string; content: string },
  config: TypeScriptConfig
): Promise<unknown> {
  const { TypeScriptValidator } = await import('./typescript/index.js');
  const validator = new TypeScriptValidator(config);
  return await validator.validate(file);
}
