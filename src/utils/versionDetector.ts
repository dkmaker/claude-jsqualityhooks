/**
 * Version Detection Utilities
 *
 * Detects versions of Biome, TypeScript, and Node.js for configuration and display.
 * This is a key v1 feature - auto-detecting Biome version to use correct CLI flags.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';
import type { BiomeConfig } from '../types/config.js';

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
}

export interface DetectedVersions {
  biome?: VersionInfo & { source: 'package.json' | 'cli' | 'config' | 'default' };
  typescript?: VersionInfo & { source: 'package.json' | 'cli' };
  node: VersionInfo;
  package: string;
}

// Cache for version detection to avoid repeated calls
let biomeVersionCache:
  | (VersionInfo & { source: 'package.json' | 'cli' | 'config' | 'default' })
  | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Parse a version string into structured info
 * Enhanced to handle various formats and edge cases
 */
function parseVersion(versionStr: string): VersionInfo {
  // Remove leading 'v', 'biome', and clean the string
  const cleanVersion = versionStr
    .replace(/^(v|biome\s+|biome\s+cli\s+version\s+)/i, '')
    .replace(/[^\d.]/g, '') // Remove non-digit, non-dot characters
    .trim();

  // Handle empty strings or strings with no digits
  if (!cleanVersion || cleanVersion === '..') {
    return {
      version: '0.0.0',
      major: 0,
      minor: 0,
      patch: 0,
    };
  }

  const parts = cleanVersion.split('.');

  // Handle edge cases where version might be malformed
  const major = parseInt(parts[0] || '0', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '0', 10);

  // Ensure valid numbers
  const validMajor = Number.isNaN(major) ? 0 : major;
  const validMinor = Number.isNaN(minor) ? 0 : minor;
  const validPatch = Number.isNaN(patch) ? 0 : patch;

  return {
    version: `${validMajor}.${validMinor}.${validPatch}`,
    major: validMajor,
    minor: validMinor,
    patch: validPatch,
  };
}

/**
 * Detect Biome version from package.json with enhanced error handling
 */
async function getBiomeVersionFromPackage(): Promise<VersionInfo | null> {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    // Check both dependencies and devDependencies
    const biomeVersion =
      packageJson.dependencies?.['@biomejs/biome'] ||
      packageJson.devDependencies?.['@biomejs/biome'];

    if (biomeVersion && typeof biomeVersion === 'string') {
      // Remove version prefixes like ^, ~, >=, < and handle ranges
      const cleanVersion = biomeVersion.replace(/^[\^~>=<]+/, '');

      // For entries like 'biome 1.9.2' or similar, we need to parse the entire string
      // not just take the first part before space
      const parsed = parseVersion(cleanVersion || '');

      // Validate the parsed version makes sense
      if (parsed.major > 0) {
        return parsed;
      }
    }

    return null;
  } catch (error) {
    // Enhanced error logging
    if (process.env.DEBUG) {
      console.warn('Failed to read Biome version from package.json:', error);
    }
    return null;
  }
}

/**
 * Detect Biome version from CLI with enhanced error handling
 */
async function getBiomeVersionFromCLI(): Promise<VersionInfo | null> {
  // Try multiple command patterns in order of preference
  const commands = [
    ['npx', ['@biomejs/biome', '--version']],
    ['biome', ['--version']],
    ['npx', ['biome', '--version']],
  ] as const;

  for (const [command, args] of commands) {
    try {
      const result = await execa(command, args, {
        timeout: 5000,
        stdio: 'pipe', // Capture output properly
      });

      if (result.stdout?.trim()) {
        const parsed = parseVersion(result.stdout.trim());
        // Validate the parsed version makes sense
        if (parsed.major > 0) {
          return parsed;
        }
      }
    } catch (error) {
      // Enhanced error logging for debugging
      if (process.env.DEBUG) {
        console.warn(`Failed to detect Biome version via '${command} ${args.join(' ')}':`, error);
      }
    }
  }

  return null;
}

/**
 * Clear the Biome version cache
 * Useful when configuration changes or for testing
 */
export function clearBiomeVersionCache(): void {
  biomeVersionCache = null;
  cacheTimestamp = 0;
}

/**
 * Detect Biome version using multiple strategies with caching and config override
 * Returns the detected version or defaults to 2.x
 */
export async function detectBiomeVersion(
  config?: BiomeConfig
): Promise<VersionInfo & { source: 'package.json' | 'cli' | 'config' | 'default' }> {
  // Check cache first (if not expired)
  const now = Date.now();
  if (biomeVersionCache && now - cacheTimestamp < CACHE_DURATION) {
    return biomeVersionCache;
  }

  let result: VersionInfo & { source: 'package.json' | 'cli' | 'config' | 'default' };

  // Strategy 0: Check config override first
  if (config?.version && config.version !== 'auto') {
    const version = config.version === '1.x' ? '1.0.0' : '2.0.0';
    result = { ...parseVersion(version), source: 'config' };
  } else {
    // Strategy 1: Check package.json first (most reliable)
    const packageVersion = await getBiomeVersionFromPackage();
    if (packageVersion) {
      result = { ...packageVersion, source: 'package.json' };
    } else {
      // Strategy 2: Try CLI detection
      const cliVersion = await getBiomeVersionFromCLI();
      if (cliVersion) {
        result = { ...cliVersion, source: 'cli' };
      } else {
        // Strategy 3: Default to v2.x (latest)
        result = { ...parseVersion('2.0.0'), source: 'default' };
      }
    }
  }

  // Cache the result
  biomeVersionCache = result;
  cacheTimestamp = now;

  // Log detection method for debugging
  if (process.env.DEBUG) {
    console.log(`Biome version detected: v${result.version} (source: ${result.source})`);
  }

  return result;
}

/**
 * Determine Biome CLI format based on version
 * v1.x uses --apply, v2.x uses --write
 * Enhanced with validation
 */
export function getBiomeFixFlag(version: VersionInfo): '--apply' | '--write' {
  // Handle edge cases where major version might be invalid
  const majorVersion =
    typeof version.major === 'number' && !Number.isNaN(version.major) ? version.major : 2;
  return majorVersion >= 2 ? '--write' : '--apply';
}

/**
 * Get simplified version string for API compatibility
 * Returns '1.x' for v1.x.x and '2.x' for v2.x.x
 */
export function getVersionString(version: VersionInfo): '1.x' | '2.x' {
  const majorVersion =
    typeof version.major === 'number' && !Number.isNaN(version.major) ? version.major : 2;
  return majorVersion >= 2 ? '2.x' : '1.x';
}

/**
 * Detect TypeScript version from package.json
 */
async function getTypeScriptVersionFromPackage(): Promise<VersionInfo | null> {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    // Check both dependencies and devDependencies
    const tsVersion =
      packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript;

    if (tsVersion && typeof tsVersion === 'string') {
      // Remove version prefixes like ^, ~, >=
      const cleanVersion = tsVersion.replace(/^[\^~>=<]+/, '');
      return parseVersion(cleanVersion);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect TypeScript version from CLI
 */
async function getTypeScriptVersionFromCLI(): Promise<VersionInfo | null> {
  try {
    const result = await execa('npx', ['typescript', '--version'], {
      timeout: 5000,
    });

    if (result.stdout) {
      // TypeScript CLI outputs "Version X.Y.Z"
      const versionMatch = result.stdout.match(/Version\s+(\d+\.\d+\.\d+)/);
      if (versionMatch?.[1]) {
        return parseVersion(versionMatch[1]);
      }
    }

    return null;
  } catch {
    // Try alternative
    try {
      const result = await execa('tsc', ['--version'], {
        timeout: 5000,
      });

      if (result.stdout) {
        const versionMatch = result.stdout.match(/Version\s+(\d+\.\d+\.\d+)/);
        if (versionMatch?.[1]) {
          return parseVersion(versionMatch[1]);
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Detect TypeScript version
 */
export async function detectTypeScriptVersion(): Promise<
  (VersionInfo & { source: 'package.json' | 'cli' }) | null
> {
  // Strategy 1: Check package.json first
  const packageVersion = await getTypeScriptVersionFromPackage();
  if (packageVersion) {
    return { ...packageVersion, source: 'package.json' };
  }

  // Strategy 2: Try CLI detection
  const cliVersion = await getTypeScriptVersionFromCLI();
  if (cliVersion) {
    return { ...cliVersion, source: 'cli' };
  }

  return null;
}

/**
 * Get Node.js version
 */
export function getNodeVersion(): VersionInfo {
  return parseVersion(process.version);
}

/**
 * Get package version from package.json
 */
export async function getPackageVersion(): Promise<string> {
  try {
    // Get version from the installed package's package.json
    const packagePath = join(
      process.cwd(),
      'node_modules',
      'claude-jsqualityhooks',
      'package.json'
    );
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    return packageJson.version ? String(packageJson.version) : '1.0.0';
  } catch {
    // Fallback to reading from our own package.json (development mode)
    try {
      const packagePath = join(process.cwd(), 'package.json');
      const packageContent = await readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // Only return version if this is actually our package
      if (packageJson.name === 'claude-jsqualityhooks') {
        return packageJson.version ? String(packageJson.version) : '1.0.0';
      }

      return '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
}

/**
 * Detect all versions for display in version command
 * Enhanced with better error handling
 */
export async function detectAllVersions(config?: BiomeConfig): Promise<DetectedVersions> {
  const [biome, typescript, packageVersion] = await Promise.allSettled([
    detectBiomeVersion(config),
    detectTypeScriptVersion(),
    getPackageVersion(),
  ]);

  const result: DetectedVersions = {
    node: getNodeVersion(),
    package: packageVersion.status === 'fulfilled' ? packageVersion.value : '1.0.0',
  };

  if (biome.status === 'fulfilled') {
    result.biome = biome.value;
  } else if (process.env.DEBUG) {
    console.warn('Failed to detect Biome version:', biome.reason);
  }

  if (typescript.status === 'fulfilled' && typescript.value) {
    result.typescript = typescript.value;
  } else if (process.env.DEBUG && typescript.status === 'rejected') {
    console.warn('Failed to detect TypeScript version:', typescript.reason);
  }

  return result;
}
