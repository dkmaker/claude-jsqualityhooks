/**
 * Version Detection Utilities
 *
 * Detects versions of Biome, TypeScript, and Node.js for configuration and display.
 * This is a key v1 feature - auto-detecting Biome version to use correct CLI flags.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';

export interface VersionInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
}

export interface DetectedVersions {
  biome?: VersionInfo & { source: 'package.json' | 'cli' | 'default' };
  typescript?: VersionInfo & { source: 'package.json' | 'cli' };
  node: VersionInfo;
  package: string;
}

/**
 * Parse a version string into structured info
 */
function parseVersion(versionStr: string): VersionInfo {
  // Remove leading 'v' if present and clean the string
  const cleanVersion = versionStr.replace(/^v/, '').trim();
  const parts = cleanVersion.split('.');

  return {
    version: cleanVersion,
    major: parseInt(parts[0] || '0', 10),
    minor: parseInt(parts[1] || '0', 10),
    patch: parseInt(parts[2] || '0', 10),
  };
}

/**
 * Detect Biome version from package.json
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
      // Remove version prefixes like ^, ~, >=
      const cleanVersion = biomeVersion.replace(/^[\^~>=<]+/, '');
      return parseVersion(cleanVersion);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Detect Biome version from CLI
 */
async function getBiomeVersionFromCLI(): Promise<VersionInfo | null> {
  try {
    const result = await execa('npx', ['@biomejs/biome', '--version'], {
      timeout: 5000,
    });

    if (result.stdout?.trim()) {
      return parseVersion(result.stdout.trim());
    }

    return null;
  } catch {
    // Try alternative command patterns
    try {
      const result = await execa('biome', ['--version'], {
        timeout: 5000,
      });

      if (result.stdout?.trim()) {
        return parseVersion(result.stdout.trim());
      }

      return null;
    } catch {
      return null;
    }
  }
}

/**
 * Detect Biome version using multiple strategies
 * Returns the detected version or defaults to 2.x
 */
export async function detectBiomeVersion(): Promise<
  VersionInfo & { source: 'package.json' | 'cli' | 'default' }
> {
  // Strategy 1: Check package.json first (most reliable)
  const packageVersion = await getBiomeVersionFromPackage();
  if (packageVersion) {
    return { ...packageVersion, source: 'package.json' };
  }

  // Strategy 2: Try CLI detection
  const cliVersion = await getBiomeVersionFromCLI();
  if (cliVersion) {
    return { ...cliVersion, source: 'cli' };
  }

  // Strategy 3: Default to v2.x (latest)
  return { ...parseVersion('2.0.0'), source: 'default' };
}

/**
 * Determine Biome CLI format based on version
 * v1.x uses --apply, v2.x uses --write
 */
export function getBiomeFixFlag(version: VersionInfo): '--apply' | '--write' {
  return version.major >= 2 ? '--write' : '--apply';
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
 */
export async function detectAllVersions(): Promise<DetectedVersions> {
  const [biome, typescript, packageVersion] = await Promise.allSettled([
    detectBiomeVersion(),
    detectTypeScriptVersion(),
    getPackageVersion(),
  ]);

  const result: DetectedVersions = {
    node: getNodeVersion(),
    package: packageVersion.status === 'fulfilled' ? packageVersion.value : '1.0.0',
  };

  if (biome.status === 'fulfilled') {
    result.biome = biome.value;
  }

  if (typescript.status === 'fulfilled' && typescript.value) {
    result.typescript = typescript.value;
  }

  return result;
}
