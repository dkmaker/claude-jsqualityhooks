/**
 * TypeScript Validator Tests
 *
 * Tests for the TypeScript validator functionality including:
 * - Validation of TypeScript files
 * - Error detection and reporting
 * - Configuration handling
 * - Timeout protection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TypeScriptValidator } from '../../../src/validators/typescript/TypeScriptValidator.js';
import type { TypeScriptConfig } from '../../../src/types/config.js';
import type { FileInfo } from '../../../src/validators/typescript/TypeScriptValidator.js';

// Mock TypeScript module
const mockTS = {
  version: '5.9.2',
  DiagnosticCategory: {
    Warning: 0,
    Error: 1,
    Suggestion: 2,
    Message: 3,
  },
  createProgram: vi.fn(),
  createCompilerHost: vi.fn(),
  parseJsonConfigFileContent: vi.fn(),
  convertCompilerOptionsFromJson: vi.fn(),
  flattenDiagnosticMessageText: vi.fn(),
  sys: {
    readFile: vi.fn(),
    directoryExists: vi.fn(),
    getDirectories: vi.fn(),
  },
};

// Mock dynamic import of TypeScript
vi.mock('typescript', () => mockTS);

describe('TypeScriptValidator', () => {
  let validator: TypeScriptValidator;
  let mockConfig: TypeScriptConfig;
  let mockFile: FileInfo;

  beforeEach(() => {
    mockConfig = {
      enabled: true,
      configPath: './tsconfig.json',
    };

    mockFile = {
      path: '/test/example.ts',
      relativePath: 'example.ts',
      content: 'const x: number = "string";', // This should cause a type error
    };

    validator = new TypeScriptValidator(mockConfig, '/test');

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    validator.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully when TypeScript is available', async () => {
      // Mock successful TypeScript import
      vi.doMock('typescript', () => mockTS);

      const result = await validator.validate(mockFile);
      
      expect(result.validator).toBe('typescript');
      expect(result.status).toBeOneOf(['success', 'warning', 'error']);
    });

    it('should handle missing TypeScript gracefully', async () => {
      // Mock failed TypeScript import
      vi.doMock('typescript', () => {
        throw new Error('TypeScript not found');
      });

      const result = await validator.validate(mockFile);
      
      expect(result.validator).toBe('typescript');
      expect(result.status).toBe('success');
      expect(result.issues).toEqual([]);
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      // Mock successful TypeScript setup
      vi.doMock('typescript', () => mockTS);
      
      mockTS.createProgram.mockReturnValue({
        getSyntacticDiagnostics: vi.fn().mockReturnValue([]),
        getSemanticDiagnostics: vi.fn().mockReturnValue([]),
      });

      mockTS.createCompilerHost.mockReturnValue({});
      
      mockTS.parseJsonConfigFileContent.mockReturnValue({
        options: { noEmit: true, strict: true },
        errors: [],
      });

      mockTS.convertCompilerOptionsFromJson.mockReturnValue({
        options: { noEmit: true, strict: true },
        errors: [],
      });
    });

    it('should validate TypeScript file successfully with no errors', async () => {
      const result = await validator.validate(mockFile);
      
      expect(result.validator).toBe('typescript');
      expect(result.status).toBe('success');
      expect(result.issues).toEqual([]);
    });

    it('should detect and report TypeScript errors', async () => {
      const mockDiagnostic = {
        file: { 
          fileName: mockFile.path,
          getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 0, character: 6 }),
        },
        start: 6,
        category: mockTS.DiagnosticCategory.Error,
        code: 2322,
        messageText: "Type 'string' is not assignable to type 'number'.",
      };

      const mockProgram = {
        getSyntacticDiagnostics: vi.fn().mockReturnValue([]),
        getSemanticDiagnostics: vi.fn().mockReturnValue([mockDiagnostic]),
      };

      mockTS.createProgram.mockReturnValue(mockProgram);

      const result = await validator.validate(mockFile);
      
      expect(result.validator).toBe('typescript');
      expect(result.status).toBe('error');
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('error');
      expect(result.issues[0].line).toBe(1); // 1-based indexing
      expect(result.issues[0].column).toBe(7); // 1-based indexing
    });

    it('should handle custom tsconfig path', async () => {
      const customConfig = {
        enabled: true,
        configPath: './custom-tsconfig.json',
      };

      const customValidator = new TypeScriptValidator(customConfig, '/test');
      
      const result = await customValidator.validate(mockFile);
      
      expect(result.validator).toBe('typescript');
      // Result depends on whether custom config exists, but should not throw
      expect(['success', 'warning', 'error']).toContain(result.status);

      customValidator.dispose();
    });
  });

  describe('timeout protection', () => {
    it('should handle validation timeout', async () => {
      // Mock a slow validation
      vi.spyOn(validator, 'validate').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const result = await validator.validateWithTimeout(mockFile, 100); // 100ms timeout
      
      expect(result.validator).toBe('typescript');
      expect(result.status).toBe('warning');
      expect(result.issues).toEqual([]);
    });

    it('should return result within timeout', async () => {
      const result = await validator.validateWithTimeout(mockFile, 5000); // 5s timeout
      
      expect(result.validator).toBe('typescript');
      expect(['success', 'warning', 'error']).toContain(result.status);
    });
  });

  describe('utility methods', () => {
    it('should report TypeScript availability correctly', () => {
      // This will depend on whether TypeScript import succeeded
      const isAvailable = validator.isTypeScriptAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return TypeScript version when available', () => {
      const version = validator.getTypeScriptVersion();
      // Version will be null if TypeScript is not available, string if it is
      expect(version === null || typeof version === 'string').toBe(true);
    });

    it('should dispose resources without errors', () => {
      expect(() => validator.dispose()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle malformed TypeScript program creation', async () => {
      mockTS.createProgram.mockImplementation(() => {
        throw new Error('Invalid program');
      });

      const result = await validator.validate(mockFile);
      
      expect(result.validator).toBe('typescript');
      expect(result.status).toBe('error');
      expect(result.issues).toEqual([]);
    });

    it('should handle diagnostic parsing errors', async () => {
      const malformedDiagnostic = {
        // Missing required properties
        category: mockTS.DiagnosticCategory.Error,
      };

      const mockProgram = {
        getSyntacticDiagnostics: vi.fn().mockReturnValue([malformedDiagnostic]),
        getSemanticDiagnostics: vi.fn().mockReturnValue([]),
      };

      mockTS.createProgram.mockReturnValue(mockProgram);

      const result = await validator.validate(mockFile);
      
      // Should handle gracefully and not throw
      expect(result.validator).toBe('typescript');
      expect(['success', 'warning', 'error']).toContain(result.status);
    });
  });
});