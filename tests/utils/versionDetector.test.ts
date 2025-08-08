/**
 * Tests for version detector utilities
 *
 * Tests the enhanced Biome version detection with caching, config override,
 * and improved error handling from Phase 2 Task 1
 */

import { readFile } from 'node:fs/promises';
import { execa } from 'execa';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { BiomeConfig } from '../../src/types/config.js';
import {
  clearBiomeVersionCache,
  detectAllVersions,
  detectBiomeVersion,
  getBiomeFixFlag,
  getVersionString,
} from '../../src/utils/versionDetector.js';

// Mock external dependencies
vi.mock('node:fs/promises');
vi.mock('execa');

const mockReadFile = readFile as Mock;
const mockExeca = execa as Mock;

describe('versionDetector', () => {
  beforeEach(() => {
    // Clear all mocks and cache before each test
    vi.clearAllMocks();
    clearBiomeVersionCache();
    delete process.env.DEBUG;
  });

  describe('detectBiomeVersion', () => {
    it('should detect version from package.json (dependencies)', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': '^1.8.3',
          },
        })
      );

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '1.8.3',
        major: 1,
        minor: 8,
        patch: 3,
        source: 'package.json',
      });
    });

    it('should detect version from package.json (devDependencies)', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          devDependencies: {
            '@biomejs/biome': '~2.1.0',
          },
        })
      );

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '2.1.0',
        major: 2,
        minor: 1,
        patch: 0,
        source: 'package.json',
      });
    });

    it('should prefer dependencies over devDependencies', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': '2.0.0',
          },
          devDependencies: {
            '@biomejs/biome': '1.8.3',
          },
        })
      );

      const result = await detectBiomeVersion();

      expect(result.version).toBe('2.0.0');
      expect(result.source).toBe('package.json');
    });

    it('should fall back to CLI detection when package.json fails', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      mockExeca.mockResolvedValue({
        stdout: 'biome 1.9.0',
      });

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '1.9.0',
        major: 1,
        minor: 9,
        patch: 0,
        source: 'cli',
      });
    });

    it('should try multiple CLI commands', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      mockExeca.mockRejectedValueOnce(new Error('npx command failed')).mockResolvedValue({
        stdout: '2.1.3',
      });

      const result = await detectBiomeVersion();

      expect(result.version).toBe('2.1.3');
      expect(result.source).toBe('cli');
      expect(mockExeca).toHaveBeenCalledTimes(2);
    });

    it('should default to 2.x when all detection methods fail', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      mockExeca.mockRejectedValue(new Error('Command failed'));

      const result = await detectBiomeVersion();

      expect(result).toEqual({
        version: '2.0.0',
        major: 2,
        minor: 0,
        patch: 0,
        source: 'default',
      });
    });

    it('should use config override when version is specified', async () => {
      const config: BiomeConfig = {
        enabled: true,
        version: '1.x',
      };

      const result = await detectBiomeVersion(config);

      expect(result).toEqual({
        version: '1.0.0',
        major: 1,
        minor: 0,
        patch: 0,
        source: 'config',
      });

      // Should not attempt file reads or CLI calls
      expect(mockReadFile).not.toHaveBeenCalled();
      expect(mockExeca).not.toHaveBeenCalled();
    });

    it('should perform detection when config version is auto', async () => {
      const config: BiomeConfig = {
        enabled: true,
        version: 'auto',
      };

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': '2.1.0',
          },
        })
      );

      const result = await detectBiomeVersion(config);

      expect(result.version).toBe('2.1.0');
      expect(result.source).toBe('package.json');
    });

    it('should cache results for subsequent calls', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': '1.8.3',
          },
        })
      );

      // First call
      const result1 = await detectBiomeVersion();
      expect(result1.version).toBe('1.8.3');

      // Second call should use cache
      const result2 = await detectBiomeVersion();
      expect(result2.version).toBe('1.8.3');

      // Should only read file once
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed version strings', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': 'invalid-version',
          },
        })
      );
      mockExeca.mockResolvedValue({
        stdout: 'biome 2.1.0',
      });

      const result = await detectBiomeVersion();

      // Should fall back to CLI when package.json version is invalid
      expect(result.version).toBe('2.1.0');
      expect(result.source).toBe('cli');
    });

    it('should log debug information when DEBUG is set', async () => {
      process.env.DEBUG = 'true';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': '2.0.0',
          },
        })
      );

      await detectBiomeVersion();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Biome version detected: v2.0.0 (source: package.json)')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getBiomeFixFlag', () => {
    it('should return --write for v2.x', () => {
      const version = { version: '2.1.0', major: 2, minor: 1, patch: 0 };
      expect(getBiomeFixFlag(version)).toBe('--write');
    });

    it('should return --apply for v1.x', () => {
      const version = { version: '1.8.3', major: 1, minor: 8, patch: 3 };
      expect(getBiomeFixFlag(version)).toBe('--apply');
    });

    it('should handle invalid major version', () => {
      const version = { version: '0.0.0', major: NaN, minor: 0, patch: 0 };
      expect(getBiomeFixFlag(version)).toBe('--write'); // Defaults to v2.x behavior
    });
  });

  describe('getVersionString', () => {
    it('should return 2.x for v2.x.x', () => {
      const version = { version: '2.1.0', major: 2, minor: 1, patch: 0 };
      expect(getVersionString(version)).toBe('2.x');
    });

    it('should return 1.x for v1.x.x', () => {
      const version = { version: '1.8.3', major: 1, minor: 8, patch: 3 };
      expect(getVersionString(version)).toBe('1.x');
    });

    it('should handle invalid major version', () => {
      const version = { version: '0.0.0', major: NaN, minor: 0, patch: 0 };
      expect(getVersionString(version)).toBe('2.x'); // Defaults to 2.x
    });
  });

  describe('clearBiomeVersionCache', () => {
    it('should clear cached version', async () => {
      // First detection
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': '1.8.3',
          },
        })
      );
      await detectBiomeVersion();

      // Clear cache
      clearBiomeVersionCache();

      // Mock different version
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          dependencies: {
            '@biomejs/biome': '2.1.0',
          },
        })
      );

      // Should detect new version after cache clear
      const result = await detectBiomeVersion();
      expect(result.version).toBe('2.1.0');
      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('detectAllVersions', () => {
    it('should detect all versions successfully', async () => {
      mockReadFile
        .mockResolvedValueOnce(
          JSON.stringify({
            dependencies: {
              '@biomejs/biome': '2.1.0',
              typescript: '5.0.0',
            },
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            dependencies: {
              '@biomejs/biome': '2.1.0',
              typescript: '5.0.0',
            },
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            name: 'claude-jsqualityhooks',
            version: '1.0.0',
          })
        );

      const result = await detectAllVersions();

      expect(result.biome).toBeDefined();
      expect(result.biome?.version).toBe('2.1.0');
      expect(result.typescript).toBeDefined();
      expect(result.typescript?.version).toBe('5.0.0');
      expect(result.node).toBeDefined();
      expect(result.package).toBe('1.0.0');
    });

    it('should handle detection failures gracefully', async () => {
      process.env.DEBUG = 'true';
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockReadFile.mockRejectedValue(new Error('File not found'));
      mockExeca.mockRejectedValue(new Error('Command failed'));

      const result = await detectAllVersions();

      expect(result.biome?.source).toBe('default');
      expect(result.typescript).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should pass config to biome detection', async () => {
      const config: BiomeConfig = {
        enabled: true,
        version: '1.x',
      };

      const result = await detectAllVersions(config);

      expect(result.biome?.version).toBe('1.0.0');
      expect(result.biome?.source).toBe('config');
    });
  });

  describe('version parsing edge cases', () => {
    it('should handle various version formats', async () => {
      const testCases = [
        { input: 'v1.8.3', expected: '1.8.3' },
        { input: '2.1.0', expected: '2.1.0' },
        { input: 'biome 1.9.2', expected: '1.9.2' },
        { input: 'Biome CLI version 2.0.1', expected: '2.0.1' },
        { input: '>=2.0.0', expected: '2.0.0' },
        { input: '^1.8.0', expected: '1.8.0' },
        { input: '~2.1.0', expected: '2.1.0' },
      ];

      for (const { input, expected } of testCases) {
        mockReadFile.mockResolvedValue(
          JSON.stringify({
            dependencies: {
              '@biomejs/biome': input,
            },
          })
        );

        clearBiomeVersionCache();
        const result = await detectBiomeVersion();
        expect(result.version).toBe(expected);
      }
    });
  });
});
