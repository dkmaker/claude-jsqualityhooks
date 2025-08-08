/**
 * Tests for Version Detection Utilities
 *
 * These tests verify Biome/TypeScript version detection from package.json and CLI,
 * the key v1 feature for auto-detecting Biome version to use correct CLI flags.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectAllVersions,
  detectBiomeVersion,
  detectTypeScriptVersion,
  getBiomeFixFlag,
  getNodeVersion,
  getPackageVersion,
  type VersionInfo,
} from '../../src/utils/versionDetector.js';

// Mock file system operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

// Mock path operations
vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

// Mock process execution
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

const mockReadFile = vi.mocked(readFile);
const mockJoin = vi.mocked(join);
const mockExeca = vi.mocked(execa);

// Mock process.cwd and process.version
const originalCwd = process.cwd;
const originalVersion = process.version;

describe('versionDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = vi.fn().mockReturnValue('/test/project');
    process.version = 'v18.17.0';
  });

  afterEach(() => {
    process.cwd = originalCwd;
    process.version = originalVersion;
  });

  describe('detectBiomeVersion()', () => {
    it('should detect Biome version from package.json (strategy 1)', async () => {
      const packageJson = {
        dependencies: {},
        devDependencies: {
          '@biomejs/biome': '^2.1.3',
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));
      mockJoin.mockReturnValue('/test/project/package.json');

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '2.1.3',
        major: 2,
        minor: 1,
        patch: 3,
        source: 'package.json',
      });
      expect(mockReadFile).toHaveBeenCalledWith('/test/project/package.json', 'utf-8');
    });

    it('should detect Biome from dependencies instead of devDependencies', async () => {
      const packageJson = {
        dependencies: {
          '@biomejs/biome': '~1.8.3',
        },
        devDependencies: {},
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '1.8.3',
        major: 1,
        minor: 8,
        patch: 3,
        source: 'package.json',
      });
    });

    it('should handle version prefixes in package.json', async () => {
      const packageJson = {
        devDependencies: {
          '@biomejs/biome': '>=2.0.0',
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await detectBiomeVersion();

      expect(result.version).toBe('2.0.0');
      expect(result.source).toBe('package.json');
    });

    it('should fall back to CLI detection when package.json fails', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));
      mockExeca.mockResolvedValueOnce({
        stdout: '2.1.3',
        stderr: '',
        exitCode: 0,
      } as any);

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '2.1.3',
        major: 2,
        minor: 1,
        patch: 3,
        source: 'cli',
      });
      expect(mockExeca).toHaveBeenCalledWith('npx', ['@biomejs/biome', '--version'], {
        timeout: 5000,
      });
    });

    it('should try alternative CLI command when npx fails', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca
        .mockRejectedValueOnce(new Error('npx failed'))
        .mockResolvedValueOnce({
          stdout: '1.9.0',
          stderr: '',
          exitCode: 0,
        } as any);

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '1.9.0',
        major: 1,
        minor: 9,
        patch: 0,
        source: 'cli',
      });
      expect(mockExeca).toHaveBeenCalledWith('biome', ['--version'], { timeout: 5000 });
    });

    it('should default to 2.0.0 when all strategies fail', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockRejectedValue(new Error('CLI not found'));

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '2.0.0',
        major: 2,
        minor: 0,
        patch: 0,
        source: 'default',
      });
    });

    it('should handle invalid package.json gracefully', async () => {
      mockReadFile.mockResolvedValue('invalid json');
      mockExeca.mockRejectedValue(new Error('CLI failed'));

      const result = await detectBiomeVersion();

      expect(result.source).toBe('default');
    });

    it('should handle missing Biome in package.json', async () => {
      const packageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));
      mockExeca.mockRejectedValue(new Error('CLI failed'));

      const result = await detectBiomeVersion();

      expect(result.source).toBe('default');
    });

    it('should parse version with v prefix', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockResolvedValueOnce({
        stdout: 'v2.1.3',
        stderr: '',
        exitCode: 0,
      } as any);

      const result = await detectBiomeVersion();

      expect(result.version).toBe('2.1.3');
    });

    it('should handle CLI timeout', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockRejectedValue(new Error('timeout'));

      const result = await detectBiomeVersion();

      expect(result.source).toBe('default');
    });
  });

  describe('getBiomeFixFlag()', () => {
    it('should return --write for Biome 2.x and above', () => {
      const version: VersionInfo = { version: '2.1.3', major: 2, minor: 1, patch: 3 };
      expect(getBiomeFixFlag(version)).toBe('--write');
    });

    it('should return --write for Biome 3.x (future version)', () => {
      const version: VersionInfo = { version: '3.0.0', major: 3, minor: 0, patch: 0 };
      expect(getBiomeFixFlag(version)).toBe('--write');
    });

    it('should return --apply for Biome 1.x', () => {
      const version: VersionInfo = { version: '1.8.3', major: 1, minor: 8, patch: 3 };
      expect(getBiomeFixFlag(version)).toBe('--apply');
    });

    it('should return --apply for Biome 0.x (hypothetical)', () => {
      const version: VersionInfo = { version: '0.9.0', major: 0, minor: 9, patch: 0 };
      expect(getBiomeFixFlag(version)).toBe('--apply');
    });
  });

  describe('detectTypeScriptVersion()', () => {
    it('should detect TypeScript version from package.json', async () => {
      const packageJson = {
        devDependencies: {
          typescript: '^5.3.0',
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await detectTypeScriptVersion();

      expect(result).toEqual({
        version: '5.3.0',
        major: 5,
        minor: 3,
        patch: 0,
        source: 'package.json',
      });
    });

    it('should detect TypeScript from dependencies', async () => {
      const packageJson = {
        dependencies: {
          typescript: '~4.9.5',
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await detectTypeScriptVersion();

      expect(result?.source).toBe('package.json');
      expect(result?.version).toBe('4.9.5');
    });

    it('should fall back to CLI detection', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockResolvedValueOnce({
        stdout: 'Version 5.3.2',
        stderr: '',
        exitCode: 0,
      } as any);

      const result = await detectTypeScriptVersion();

      expect(result).toEqual({
        version: '5.3.2',
        major: 5,
        minor: 3,
        patch: 2,
        source: 'cli',
      });
      expect(mockExeca).toHaveBeenCalledWith('npx', ['typescript', '--version'], {
        timeout: 5000,
      });
    });

    it('should try tsc command when typescript command fails', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca
        .mockRejectedValueOnce(new Error('typescript command failed'))
        .mockResolvedValueOnce({
          stdout: 'Version 5.2.4',
          stderr: '',
          exitCode: 0,
        } as any);

      const result = await detectTypeScriptVersion();

      expect(result?.version).toBe('5.2.4');
      expect(mockExeca).toHaveBeenCalledWith('tsc', ['--version'], { timeout: 5000 });
    });

    it('should return null when all strategies fail', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockRejectedValue(new Error('CLI failed'));

      const result = await detectTypeScriptVersion();

      expect(result).toBeNull();
    });

    it('should handle invalid CLI output', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockResolvedValueOnce({
        stdout: 'Invalid output format',
        stderr: '',
        exitCode: 0,
      } as any);

      const result = await detectTypeScriptVersion();

      expect(result).toBeNull();
    });
  });

  describe('getNodeVersion()', () => {
    it('should return current Node.js version', () => {
      const result = getNodeVersion();

      expect(result).toEqual({
        version: '18.17.0',
        major: 18,
        minor: 17,
        patch: 0,
      });
    });

    it('should handle version with v prefix', () => {
      process.version = 'v20.5.1';

      const result = getNodeVersion();

      expect(result.version).toBe('20.5.1');
      expect(result.major).toBe(20);
    });
  });

  describe('getPackageVersion()', () => {
    it('should get version from installed package', async () => {
      const packageJson = { version: '1.2.3' };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));
      mockJoin.mockReturnValue('/test/project/node_modules/claude-jsqualityhooks/package.json');

      const result = await getPackageVersion();

      expect(result).toBe('1.2.3');
      expect(mockJoin).toHaveBeenCalledWith(
        '/test/project',
        'node_modules',
        'claude-jsqualityhooks',
        'package.json'
      );
    });

    it('should fall back to local package.json', async () => {
      mockReadFile
        .mockRejectedValueOnce(new Error('ENOENT: no such file'))
        .mockResolvedValueOnce(
          JSON.stringify({
            name: 'claude-jsqualityhooks',
            version: '1.0.0-dev',
          })
        );
      mockJoin
        .mockReturnValueOnce('/test/project/node_modules/claude-jsqualityhooks/package.json')
        .mockReturnValueOnce('/test/project/package.json');

      const result = await getPackageVersion();

      expect(result).toBe('1.0.0-dev');
    });

    it('should return default version when not our package', async () => {
      mockReadFile
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce(
          JSON.stringify({
            name: 'other-package',
            version: '2.0.0',
          })
        );

      const result = await getPackageVersion();

      expect(result).toBe('1.0.0');
    });

    it('should return default version on all failures', async () => {
      mockReadFile.mockRejectedValue(new Error('Read failed'));

      const result = await getPackageVersion();

      expect(result).toBe('1.0.0');
    });

    it('should handle malformed package.json', async () => {
      mockReadFile.mockResolvedValue('{ invalid json');

      const result = await getPackageVersion();

      expect(result).toBe('1.0.0');
    });
  });

  describe('detectAllVersions()', () => {
    it('should detect all versions successfully', async () => {
      // Mock successful version detection
      const biomePackage = { devDependencies: { '@biomejs/biome': '^2.1.3' } };
      const tsPackage = { devDependencies: { typescript: '^5.3.0' } };
      const ourPackage = { name: 'claude-jsqualityhooks', version: '1.0.5' };

      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(biomePackage)) // Biome from package.json
        .mockResolvedValueOnce(JSON.stringify(tsPackage)) // TS from package.json
        .mockRejectedValueOnce(new Error('ENOENT')) // Package version from installed
        .mockResolvedValueOnce(JSON.stringify(ourPackage)); // Package version from local

      const result = await detectAllVersions();

      expect(result).toEqual({
        node: {
          version: '18.17.0',
          major: 18,
          minor: 17,
          patch: 0,
        },
        biome: {
          version: '2.1.3',
          major: 2,
          minor: 1,
          patch: 3,
          source: 'package.json',
        },
        typescript: {
          version: '5.3.0',
          major: 5,
          minor: 3,
          patch: 0,
          source: 'package.json',
        },
        package: '1.0.5',
      });
    });

    it('should handle partial failures gracefully', async () => {
      // Mock Biome success, TypeScript failure, package failure
      const biomePackage = { devDependencies: { '@biomejs/biome': '^1.8.0' } };
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify(biomePackage)) // Biome success
        .mockRejectedValueOnce(new Error('TS package read failed')) // TS package fails
        .mockRejectedValueOnce(new Error('Package read failed')); // Package version fails

      mockExeca.mockRejectedValue(new Error('CLI failed')); // TS CLI fails too

      const result = await detectAllVersions();

      expect(result).toEqual({
        node: {
          version: '18.17.0',
          major: 18,
          minor: 17,
          patch: 0,
        },
        biome: {
          version: '1.8.0',
          major: 1,
          minor: 8,
          patch: 0,
          source: 'package.json',
        },
        // TypeScript should be missing due to failure
        package: '1.0.0', // Default fallback
      });

      expect(result.typescript).toBeUndefined();
    });

    it('should handle all detection failures', async () => {
      mockReadFile.mockRejectedValue(new Error('All reads fail'));
      mockExeca.mockRejectedValue(new Error('All CLI calls fail'));

      const result = await detectAllVersions();

      expect(result).toEqual({
        node: {
          version: '18.17.0',
          major: 18,
          minor: 17,
          patch: 0,
        },
        biome: {
          version: '2.0.0',
          major: 2,
          minor: 0,
          patch: 0,
          source: 'default',
        },
        // TypeScript should be missing
        package: '1.0.0', // Default
      });

      expect(result.typescript).toBeUndefined();
    });

    it('should run version detection in parallel', async () => {
      // Verify that Promise.allSettled is used for parallel execution
      const startTime = Date.now();

      // Mock delays to verify parallel execution
      mockReadFile.mockImplementation(async (path) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (typeof path === 'string' && path.includes('biome')) {
          return JSON.stringify({ devDependencies: { '@biomejs/biome': '^2.1.0' } });
        }
        throw new Error('Not found');
      });

      mockExeca.mockRejectedValue(new Error('CLI failed'));

      await detectAllVersions();

      const duration = Date.now() - startTime;
      // If run sequentially, would take ~150ms (3 * 50ms), parallel should be closer to 50ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('version parsing edge cases', () => {
    it('should handle version strings with extra whitespace', async () => {
      const packageJson = {
        devDependencies: {
          '@biomejs/biome': '  ^2.1.3  ',
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await detectBiomeVersion();

      expect(result.version).toBe('2.1.3');
    });

    it('should handle incomplete version numbers', async () => {
      const packageJson = {
        devDependencies: {
          '@biomejs/biome': '^2.1',
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '2.1',
        major: 2,
        minor: 1,
        patch: 0,
        source: 'package.json',
      });
    });

    it('should handle version with only major number', async () => {
      const packageJson = {
        devDependencies: {
          '@biomejs/biome': '2',
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '2',
        major: 2,
        minor: 0,
        patch: 0,
        source: 'package.json',
      });
    });

    it('should handle non-numeric version parts', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      mockExeca.mockResolvedValueOnce({
        stdout: '2.1.3-beta.1',
        stderr: '',
        exitCode: 0,
      } as any);

      const result = await detectBiomeVersion();

      expect(result.version).toBe('2.1.3-beta.1');
      expect(result.major).toBe(2);
      expect(result.minor).toBe(1);
      expect(result.patch).toBe(3);
    });
  });
});