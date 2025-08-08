/**
 * BiomeAdapterFactory
 *
 * Factory for creating appropriate Biome adapter based on version.
 * Centralizes the version-based adapter selection logic.
 */

import type { VersionInfo } from '../../../utils/versionDetector.js';
import type { BiomeAdapter } from './BiomeAdapter.js';
import { BiomeV1Adapter } from './BiomeV1Adapter.js';
import { BiomeV2Adapter } from './BiomeV2Adapter.js';

/**
 * Create appropriate Biome adapter based on version string
 */
export function createAdapter(version: '1.x' | '2.x'): BiomeAdapter {
  switch (version) {
    case '1.x':
      return new BiomeV1Adapter();
    case '2.x':
      return new BiomeV2Adapter();
    default:
      throw new Error(`Unsupported Biome version: ${version}`);
  }
}

/**
 * Create adapter from VersionInfo object
 */
export function createAdapterFromVersion(versionInfo: VersionInfo): BiomeAdapter {
  const versionString = versionInfo.major >= 2 ? '2.x' : '1.x';
  return createAdapter(versionString);
}

/**
 * Create adapter from version detection result
 */
export function createAdapterFromDetection(
  detectionResult: VersionInfo & { source: 'package.json' | 'cli' | 'config' | 'default' }
): BiomeAdapter {
  return createAdapterFromVersion(detectionResult);
}
