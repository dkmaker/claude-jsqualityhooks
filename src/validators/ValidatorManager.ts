/**
 * ValidatorManager
 *
 * Orchestrates parallel execution of multiple validators (Biome, TypeScript, etc.)
 * with proper error handling, result aggregation, and performance monitoring.
 */

import { createHash } from 'node:crypto';
import type { BiomeConfig, Config, TypeScriptConfig } from '../types/config.js';
import type { FileInfo } from '../types/hooks.js';
import type { ValidationIssue } from './biome/adapters/BiomeAdapter.js';
import { type BiomeValidationResult, BiomeValidator } from './biome/BiomeValidator.js';
import {
  type ValidationResult as TSValidationResult,
  TypeScriptValidator,
} from './typescript/index.js';

/**
 * Unified validation result interface
 */
export interface ValidationResult {
  validator: string;
  status: 'success' | 'warning' | 'error';
  issues: ValidationIssue[];
  duration: number;
  error?: string | undefined;
}

/**
 * Aggregated validation response
 */
export interface ValidationResponse {
  success: boolean;
  results: ValidationResult[];
  summary: {
    totalValidators: number;
    successfulValidators: number;
    failedValidators: number;
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
  performance: {
    totalDuration: number;
    parallelEfficiency: number;
  };
  cached: boolean;
}

/**
 * Internal validator interface
 */
interface ValidatorInstance {
  name: string;
  enabled: boolean;
  validator: BiomeValidator | TypeScriptValidator;
}

/**
 * Cache entry structure
 */
interface CacheEntry {
  hash: string;
  result: ValidationResponse;
  timestamp: number;
}

/**
 * ValidatorManager orchestrates parallel execution of validators
 */
export class ValidatorManager {
  private config: Config;
  private validators: ValidatorInstance[] = [];
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private initialized = false;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Initialize enabled validators
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.validators = [];

    // Initialize Biome validator if enabled
    if (this.config.validators.biome?.enabled) {
      try {
        const biomeValidator = new BiomeValidator(this.config.validators.biome as BiomeConfig);
        this.validators.push({
          name: 'biome',
          enabled: true,
          validator: biomeValidator,
        });
      } catch (error) {
        console.warn(`Failed to initialize Biome validator: ${error}`);
      }
    }

    // Initialize TypeScript validator if enabled
    if (this.config.validators.typescript?.enabled) {
      try {
        const typescriptValidator = new TypeScriptValidator(
          this.config.validators.typescript as TypeScriptConfig,
          process.cwd()
        );
        this.validators.push({
          name: 'typescript',
          enabled: true,
          validator: typescriptValidator,
        });
      } catch (error) {
        console.warn(`Failed to initialize TypeScript validator: ${error}`);
      }
    }

    this.initialized = true;
  }

  /**
   * Validate a file using all enabled validators in parallel
   */
  async validateFile(file: FileInfo): Promise<ValidationResponse> {
    const startTime = performance.now();

    await this.initialize();

    // Check cache first
    const cacheKey = this.generateCacheKey(file);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // If no validators are enabled, return empty success result
    if (this.validators.length === 0) {
      return this.createEmptyResponse(startTime);
    }

    // Create validation promises for all enabled validators
    const validationPromises = this.validators.map(async (validatorInstance) => {
      const validatorStartTime = performance.now();

      try {
        const result = await this.executeValidator(validatorInstance, file);
        const duration = performance.now() - validatorStartTime;

        return this.normalizeValidationResult(validatorInstance.name, result, duration);
      } catch (error) {
        const duration = performance.now() - validatorStartTime;
        return this.createErrorResult(validatorInstance.name, error, duration);
      }
    });

    // Use Promise.allSettled to ensure all validators run to completion
    const settledResults = await Promise.allSettled(validationPromises);

    // Process settled results
    const validationResults: ValidationResult[] = [];
    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        validationResults.push(settled.value);
      } else {
        // This should rarely happen as we handle errors in the promise itself
        console.warn(`Validator promise rejected: ${settled.reason}`);
        validationResults.push(this.createErrorResult('unknown', settled.reason, 0));
      }
    }

    const totalDuration = performance.now() - startTime;
    const response = this.aggregateResults(validationResults, totalDuration);

    // Cache the result
    this.addToCache(cacheKey, response);

    return response;
  }

  /**
   * Execute a specific validator
   */
  private async executeValidator(
    validatorInstance: ValidatorInstance,
    file: FileInfo
  ): Promise<BiomeValidationResult | TSValidationResult> {
    const { validator, name } = validatorInstance;

    if (name === 'biome') {
      return await (validator as BiomeValidator).validate(file.path, false);
    } else if (name === 'typescript') {
      return await (validator as TypeScriptValidator).validate({
        path: file.path,
        relativePath: file.path.replace(process.cwd(), '').replace(/^[/\\]/, ''),
        content: file.content,
      });
    }

    throw new Error(`Unknown validator type: ${name}`);
  }

  /**
   * Normalize different validator result formats to common interface
   */
  private normalizeValidationResult(
    validatorName: string,
    result: BiomeValidationResult | TSValidationResult,
    duration: number
  ): ValidationResult {
    const hasErrors = result.issues.some((issue) => issue.severity === 'error');
    const hasWarnings = result.issues.some((issue) => issue.severity === 'warning');

    let status: 'success' | 'warning' | 'error';

    // Handle different result structures
    if ('success' in result) {
      // BiomeValidationResult structure
      if (!result.success || result.error) {
        status = 'error';
      } else if (hasErrors) {
        status = 'error';
      } else if (hasWarnings) {
        status = 'warning';
      } else {
        status = 'success';
      }
    } else {
      // TSValidationResult structure (has status property)
      status = result.status;
    }

    return {
      validator: validatorName,
      status,
      issues: result.issues,
      duration,
      error: 'error' in result ? result.error : undefined,
    };
  }

  /**
   * Create error result for failed validator
   */
  private createErrorResult(
    validatorName: string,
    error: unknown,
    duration: number
  ): ValidationResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      validator: validatorName,
      status: 'error',
      issues: [],
      duration,
      error: errorMessage,
    };
  }

  /**
   * Create empty response when no validators are enabled
   */
  private createEmptyResponse(startTime: number): ValidationResponse {
    const duration = performance.now() - startTime;

    return {
      success: true,
      results: [],
      summary: {
        totalValidators: 0,
        successfulValidators: 0,
        failedValidators: 0,
        totalIssues: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
      },
      performance: {
        totalDuration: duration,
        parallelEfficiency: 1.0,
      },
      cached: false,
    };
  }

  /**
   * Aggregate results from multiple validators
   */
  private aggregateResults(results: ValidationResult[], totalDuration: number): ValidationResponse {
    // Calculate summary statistics
    const summary = {
      totalValidators: results.length,
      successfulValidators: results.filter((r) => r.status === 'success').length,
      failedValidators: results.filter((r) => r.status === 'error').length,
      totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
    };

    // Count issues by severity
    for (const result of results) {
      for (const issue of result.issues) {
        switch (issue.severity) {
          case 'error':
            summary.errorCount++;
            break;
          case 'warning':
            summary.warningCount++;
            break;
          case 'info':
            summary.infoCount++;
            break;
        }
      }
    }

    // Calculate parallel efficiency
    const totalValidatorTime = results.reduce((sum, r) => sum + r.duration, 0);
    const parallelEfficiency = totalDuration > 0 ? totalValidatorTime / totalDuration : 1.0;

    // Overall success if no validator failed and no errors found
    const success = summary.failedValidators === 0 && summary.errorCount === 0;

    // Sort results by validator name for consistency
    const sortedResults = [...results].sort((a, b) => a.validator.localeCompare(b.validator));

    return {
      success,
      results: sortedResults,
      summary,
      performance: {
        totalDuration,
        parallelEfficiency,
      },
      cached: false,
    };
  }

  /**
   * Generate cache key for file
   */
  private generateCacheKey(file: FileInfo): string {
    const content = file.content || '';
    const hash = createHash('sha256')
      .update(file.path)
      .update(content)
      .update(JSON.stringify(this.config))
      .digest('hex');

    return hash;
  }

  /**
   * Get result from cache if valid
   */
  private getFromCache(key: string): ValidationResponse | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if cache entry is still valid
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Mark as cached and return
    return {
      ...entry.result,
      cached: true,
    };
  }

  /**
   * Add result to cache
   */
  private addToCache(key: string, result: ValidationResponse): void {
    // Limit cache size to prevent memory leaks
    if (this.cache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 100 entries
      for (let i = 0; i < 100 && i < entries.length; i++) {
        const entry = entries[i];
        if (entry) {
          this.cache.delete(entry[0]);
        }
      }
    }

    this.cache.set(key, {
      hash: key,
      result: { ...result, cached: false },
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the validation cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: 1000,
      ttl: this.CACHE_TTL,
    };
  }

  /**
   * Get enabled validators info
   */
  getEnabledValidators(): Array<{ name: string; enabled: boolean }> {
    return this.validators.map((v) => ({
      name: v.name,
      enabled: v.enabled,
    }));
  }
}
