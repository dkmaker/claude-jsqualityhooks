/**
 * Tests for Biome adapters
 *
 * Validates that adapter pattern works correctly for both Biome 1.x and 2.x
 */

import { describe, it, expect } from 'vitest';
import { BiomeV1Adapter, BiomeV2Adapter, createAdapter } from '../../../src/validators/biome/adapters/index.js';

describe('Biome Adapters', () => {
  describe('BiomeV1Adapter', () => {
    const adapter = new BiomeV1Adapter();

    it('should have correct version', () => {
      expect(adapter.version).toBe('1.x');
    });

    it('should build command without autofix', () => {
      const command = adapter.buildCommand('test.ts');
      expect(command).toEqual(['check', 'test.ts', '--reporter=json']);
    });

    it('should build command with autofix', () => {
      const command = adapter.buildCommand('test.ts', { autoFix: true });
      expect(command).toEqual(['check', 'test.ts', '--apply', '--reporter=json']);
    });

    it('should build command with unsafe fixes', () => {
      const command = adapter.buildCommand('test.ts', { autoFix: true, unsafeFixes: true });
      expect(command).toEqual(['check', 'test.ts', '--apply-unsafe', '--reporter=json']);
    });

    it('should build command with config path', () => {
      const command = adapter.buildCommand('test.ts', { configPath: './biome.json' });
      expect(command).toEqual(['check', 'test.ts', '--reporter=json', '--config-path', './biome.json']);
    });

    it('should return correct fix flag', () => {
      expect(adapter.getFixFlag()).toBe('--apply');
      expect(adapter.getFixFlag(true)).toBe('--apply-unsafe');
    });

    it('should parse empty output', () => {
      const issues = adapter.parseOutput('', 'test.ts');
      expect(issues).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      const issues = adapter.parseOutput('invalid json', 'test.ts');
      expect(issues).toEqual([]);
    });
  });

  describe('BiomeV2Adapter', () => {
    const adapter = new BiomeV2Adapter();

    it('should have correct version', () => {
      expect(adapter.version).toBe('2.x');
    });

    it('should build command without autofix', () => {
      const command = adapter.buildCommand('test.ts');
      expect(command).toEqual(['check', 'test.ts', '--reporter=json', '--no-colors']);
    });

    it('should build command with autofix', () => {
      const command = adapter.buildCommand('test.ts', { autoFix: true });
      expect(command).toEqual(['check', 'test.ts', '--write', '--reporter=json', '--no-colors']);
    });

    it('should build command with unsafe fixes', () => {
      const command = adapter.buildCommand('test.ts', { autoFix: true, unsafeFixes: true });
      expect(command).toEqual(['check', 'test.ts', '--write', '--unsafe', '--reporter=json', '--no-colors']);
    });

    it('should build command with config path', () => {
      const command = adapter.buildCommand('test.ts', { configPath: './biome.json' });
      expect(command).toEqual(['check', 'test.ts', '--reporter=json', '--no-colors', '--config-path', './biome.json']);
    });

    it('should return correct fix flag', () => {
      expect(adapter.getFixFlag()).toBe('--write');
      expect(adapter.getFixFlag(true)).toBe('--write --unsafe');
    });

    it('should parse empty output', () => {
      const issues = adapter.parseOutput('', 'test.ts');
      expect(issues).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      const issues = adapter.parseOutput('invalid json', 'test.ts');
      expect(issues).toEqual([]);
    });
  });

  describe('createAdapter factory', () => {
    it('should create V1 adapter', () => {
      const adapter = createAdapter('1.x');
      expect(adapter).toBeInstanceOf(BiomeV1Adapter);
      expect(adapter.version).toBe('1.x');
    });

    it('should create V2 adapter', () => {
      const adapter = createAdapter('2.x');
      expect(adapter).toBeInstanceOf(BiomeV2Adapter);
      expect(adapter.version).toBe('2.x');
    });

    it('should throw for invalid version', () => {
      expect(() => createAdapter('3.x' as any)).toThrow('Unsupported Biome version: 3.x');
    });
  });
});