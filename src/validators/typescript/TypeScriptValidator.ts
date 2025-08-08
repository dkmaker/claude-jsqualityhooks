/**
 * TypeScript Validator
 *
 * Provides TypeScript type checking using the TypeScript Compiler API.
 * Handles tsconfig discovery, program creation, and diagnostic parsing.
 */

import type { TypeScriptConfig } from '../../types/config.js';
import type { ValidationIssue } from '../biome/adapters/BiomeAdapter.js';
import { loadTSConfigWithDiscovery, getDefaultCompilerOptions } from './tsconfigLoader.js';
import { parseDiagnostics, filterDiagnosticsForFile } from './diagnosticParser.js';

// TypeScript is imported dynamically to handle cases where it's not available
let ts: typeof import('typescript') | null = null;

export interface TypeScriptValidationResult {
  success: boolean;
  issues: ValidationIssue[];
  error?: string;
}

export interface FileInfo {
  path: string;
  relativePath: string;
  content: string;
}

export interface ValidationResult {
  validator: string;
  status: 'success' | 'warning' | 'error';
  issues: ValidationIssue[];
}

export class TypeScriptValidator {
  public readonly name = 'typescript';
  private config: TypeScriptConfig;
  private program: import('typescript').Program | null = null;
  private projectRoot: string;
  private initialized = false;
  private tsAvailable = false;

  constructor(config: TypeScriptConfig, projectRoot: string = process.cwd()) {
    this.config = config;
    this.projectRoot = projectRoot;
  }

  /**
   * Initialize TypeScript and load configuration
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Try to load TypeScript
    try {
      ts = await import('typescript');
      this.tsAvailable = true;
    } catch (_error) {
      console.warn('TypeScript not found. Type checking will be skipped.');
      this.tsAvailable = false;
      this.initialized = true;
      return;
    }

    this.initialized = true;
  }

  /**
   * Create or update TypeScript program
   */
  private async createProgram(filePaths: string[]): Promise<import('typescript').Program | null> {
    if (!ts || !this.tsAvailable) {
      return null;
    }

    try {
      // Load TypeScript configuration
      const tsConfigOptions: { projectRoot: string; configPath?: string } = {
        projectRoot: this.projectRoot,
      };

      if (this.config.configPath) {
        tsConfigOptions.configPath = this.config.configPath;
      }

      const tsConfigResult = await loadTSConfigWithDiscovery(tsConfigOptions);

      let compilerOptions: import('typescript').CompilerOptions;

      if (tsConfigResult) {
        // Parse compiler options using TypeScript's API
        const parsed = ts.parseJsonConfigFileContent(
          tsConfigResult.config,
          ts.sys,
          this.projectRoot
        );

        if (parsed.errors.length > 0 && ts) {
          console.warn(
            'TypeScript config errors found, using defaults:',
            parsed.errors.map((err) => ts?.flattenDiagnosticMessageText(err.messageText, '\n'))
          );
        }

        compilerOptions = parsed.options;
      } else {
        // Use default compiler options if no config found
        compilerOptions = ts.convertCompilerOptionsFromJson(
          getDefaultCompilerOptions(),
          this.projectRoot
        ).options;
      }

      // Ensure noEmit is true (we only want type checking)
      compilerOptions.noEmit = true;

      // Create compiler host
      const host = ts.createCompilerHost(compilerOptions);

      // Create program with the provided files
      this.program = ts.createProgram({
        rootNames: filePaths,
        options: compilerOptions,
        host,
      });

      return this.program;
    } catch (error) {
      console.warn(`Failed to create TypeScript program: ${error}`);
      return null;
    }
  }

  /**
   * Get diagnostics for a specific file
   */
  private getDiagnosticsForFile(
    program: import('typescript').Program,
    filePath: string
  ): import('typescript').Diagnostic[] {
    if (!ts) {
      return [];
    }

    try {
      // Get all diagnostics
      const allDiagnostics = [
        ...program.getSyntacticDiagnostics(),
        ...program.getSemanticDiagnostics(),
      ];

      // Filter for the specific file
      return filterDiagnosticsForFile(allDiagnostics, filePath);
    } catch (error) {
      console.warn(`Failed to get TypeScript diagnostics: ${error}`);
      return [];
    }
  }

  /**
   * Validate a single file using TypeScript
   */
  async validate(file: FileInfo): Promise<ValidationResult> {
    try {
      await this.initialize();

      // If TypeScript is not available, return success with no issues
      if (!this.tsAvailable || !ts) {
        return {
          validator: this.name,
          status: 'success',
          issues: [],
        };
      }

      // Create program with the file
      const program = await this.createProgram([file.path]);

      if (!program) {
        return {
          validator: this.name,
          status: 'error',
          issues: [],
        };
      }

      // Get diagnostics for the file
      const diagnostics = this.getDiagnosticsForFile(program, file.path);

      // Parse diagnostics to ValidationIssue format
      const issues = parseDiagnostics(diagnostics, {
        projectRoot: this.projectRoot,
      });

      // Determine status based on issues
      const hasErrors = issues.some((issue) => issue.severity === 'error');
      const hasWarnings = issues.some((issue) => issue.severity === 'warning');

      const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success';

      return {
        validator: this.name,
        status,
        issues,
      };
    } catch (error) {
      console.warn(`TypeScript validation failed for ${file.path}: ${error}`);

      return {
        validator: this.name,
        status: 'error',
        issues: [],
      };
    }
  }

  /**
   * Validate with timeout protection
   */
  async validateWithTimeout(file: FileInfo, timeoutMs = 5000): Promise<ValidationResult> {
    return new Promise((resolve) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        console.warn(`TypeScript validation timed out after ${timeoutMs}ms for ${file.path}`);
        resolve({
          validator: this.name,
          status: 'warning',
          issues: [],
        });
      }, timeoutMs);

      // Run validation
      this.validate(file)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.warn(`TypeScript validation error for ${file.path}: ${error}`);
          resolve({
            validator: this.name,
            status: 'error',
            issues: [],
          });
        });
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.program = null;
    // TypeScript doesn't require explicit cleanup in most cases
  }

  /**
   * Check if TypeScript is available in the environment
   */
  isTypeScriptAvailable(): boolean {
    return this.tsAvailable;
  }

  /**
   * Get the TypeScript version being used
   */
  getTypeScriptVersion(): string | null {
    if (!ts || !this.tsAvailable) {
      return null;
    }

    return ts.version;
  }
}
