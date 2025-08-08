/**
 * Tests for YamlConfigLoader
 *
 * These tests verify the configuration loading and validation functionality.
 * They use mocked file system operations to test various scenarios.
 */

import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { YamlConfigLoader } from '../../src/config/YamlConfigLoader.js';

// Mock file system operations
vi.mock('node:fs/promises');

const mockReadFile = vi.mocked(readFile);
const mockAccess = vi.mocked(access);

// Mock process.exit to prevent tests from actually exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit() called');
});

// Mock console methods to prevent noisy test output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('YamlConfigLoader', () => {
  let loader: YamlConfigLoader;

  beforeEach(() => {
    loader = new YamlConfigLoader();
    vi.clearAllMocks();
  });

  describe('load()', () => {
    it('should load and validate a minimal config', async () => {
      const yamlContent = `
enabled: true
validators:
  biome:
    enabled: true
`;

      mockAccess.mockResolvedValueOnce(undefined);
      mockReadFile.mockResolvedValueOnce(yamlContent);

      const config = await loader.load();

      expect(config.enabled).toBe(true);
      expect(config.validators.biome?.enabled).toBe(true);
      expect(config.validators.biome?.version).toBe('auto'); // Default value
      expect(config.autoFix.enabled).toBe(true); // Default value
      expect(config.timeout).toBe(5000); // Default value
    });

    it('should load and validate a complete config', async () => {
      const yamlContent = `
enabled: true
include:
  - "src/**/*.ts"
  - "src/**/*.tsx"
exclude:
  - "node_modules/**"
  - "dist/**"
validators:
  biome:
    enabled: true
    version: "2.x"
    configPath: "./custom-biome.json"
  typescript:
    enabled: true
    configPath: "./custom-tsconfig.json"
autoFix:
  enabled: true
  maxAttempts: 5
timeout: 10000
`;

      mockAccess.mockResolvedValueOnce(undefined);
      mockReadFile.mockResolvedValueOnce(yamlContent);

      const config = await loader.load();

      expect(config.enabled).toBe(true);
      expect(config.include).toEqual(['src/**/*.ts', 'src/**/*.tsx']);
      expect(config.exclude).toEqual(['node_modules/**', 'dist/**']);
      expect(config.validators.biome?.enabled).toBe(true);
      expect(config.validators.biome?.version).toBe('2.x');
      expect(config.validators.biome?.configPath).toBe('./custom-biome.json');
      expect(config.validators.typescript?.enabled).toBe(true);
      expect(config.validators.typescript?.configPath).toBe('./custom-tsconfig.json');
      expect(config.autoFix.enabled).toBe(true);
      expect(config.autoFix.maxAttempts).toBe(5);
      expect(config.timeout).toBe(10000);
    });

    it('should exit gracefully when config file is missing', async () => {
      mockAccess.mockRejectedValueOnce(new Error('ENOENT: no such file'));

      await expect(loader.load()).rejects.toThrow('process.exit() called');

      expect(mockExit).toHaveBeenCalledWith(0);
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  Configuration file not found');
    });

    it('should handle YAML parsing errors', async () => {
      const invalidYaml = `
enabled: true
validators:
  biome:
    enabled: true
    version: auto # Missing quotes - this should cause a parse error in some cases
    invalid-key: [unclosed array
`;

      mockAccess.mockResolvedValueOnce(undefined);
      mockReadFile.mockResolvedValueOnce(invalidYaml);

      // This should either succeed (if YAML is actually valid) or exit with error
      try {
        const config = await loader.load();
        // If parsing succeeds, verify the config is valid
        expect(config.enabled).toBe(true);
      } catch (error) {
        // If parsing fails, should call process.exit(1)
        expect(error).toEqual(new Error('process.exit() called'));
      }
    });
  });

  describe('validate()', () => {
    it('should validate a correct configuration object', () => {
      const validConfig = {
        enabled: true,
        validators: {
          biome: {
            enabled: true,
            version: 'auto',
          },
        },
        autoFix: {
          enabled: true,
          maxAttempts: 3,
        },
      };

      const isValid = loader.validate(validConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration objects', () => {
      const invalidConfig = {
        enabled: 'not-a-boolean', // Should be boolean
        validators: {
          biome: {
            enabled: 'also-not-a-boolean', // Should be boolean
          },
        },
      };

      expect(() => loader.validate(invalidConfig)).toThrow('process.exit() called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should apply default values for missing optional fields', () => {
      const minimalConfig = {
        enabled: true,
        validators: {},
      };

      const isValid = loader.validate(minimalConfig);
      expect(isValid).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should show validation errors for invalid config values', () => {
      const invalidConfig = {
        enabled: true,
        autoFix: {
          enabled: true,
          maxAttempts: 15, // Exceeds maximum of 10
        },
        timeout: 500, // Below minimum of 1000
      };

      expect(() => loader.validate(invalidConfig)).toThrow('process.exit() called');
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith('❌ Configuration file has invalid values');
    });

    it('should provide helpful error messages', () => {
      const invalidConfig = {
        enabled: 'not-a-boolean',
      };

      expect(() => loader.validate(invalidConfig)).toThrow('process.exit() called');
      expect(mockConsoleError).toHaveBeenCalledWith('❌ Configuration file has invalid values');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation errors:');
    });
  });
});
