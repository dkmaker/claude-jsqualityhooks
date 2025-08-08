# Phase 2: Validator Integration

## Overview

Phase 2 implements the Biome and TypeScript validators for Claude JS Quality Hooks with version detection and JSON output parsing.

## Goals

1. Implement Biome version detection
2. Create version-specific adapters
3. Integrate TypeScript Compiler API
4. Build validation pipeline
5. Parse and standardize results

## Key Implementation Files

- `src/validators/biome/versionDetector.ts`
- `src/validators/biome/adapterFactory.ts`
- `src/validators/biome/index.ts`
- `src/validators/typescript.ts`
- `src/validators/base.ts`

## Biome Version Detector

```typescript
// src/validators/biome/versionDetector.ts
export class BiomeVersionDetector {
  async detect(): Promise<BiomeVersion> {
    // Check package.json first
    const pkgVersion = await this.getPackageVersion();
    if (pkgVersion) return pkgVersion;
    
    // Run biome --version as fallback
    const cliVersion = await this.getCLIVersion();
    if (cliVersion) return cliVersion;
    
    // Default fallback
    return { major: 2, minor: 0, patch: 0 };
  }
  
  private async getPackageVersion(): Promise<BiomeVersion | null> {
    // Implementation for reading package.json
  }
  
  private async getCLIVersion(): Promise<BiomeVersion | null> {
    // Implementation for running biome --version
  }
}
```

## Biome Adapter Factory

```typescript
// src/validators/biome/adapterFactory.ts
export class BiomeAdapterFactory {
  static create(version: BiomeVersion): BiomeAdapter {
    if (version.major >= 2) {
      return new Modern BiomeAdapter(version);
    }
    return new LegacyBiomeAdapter(version);
  }
}
```

## TypeScript Validator

```typescript
// src/validators/typescript.ts
export class TypeScriptValidator {
  private program: ts.Program;
  
  async initialize(configPath: string) {
    // Load tsconfig.json and create TypeScript program
    const config = this.loadTSConfig(configPath);
    this.program = ts.createProgram(config.fileNames, config.options);
  }
  
  async validate(file: FileInfo): Promise<ValidationResult> {
    // Get type checker diagnostics
    const diagnostics = this.program.getSemanticDiagnostics(file.sourceFile);
    return this.formatDiagnostics(diagnostics);
  }
  
  private formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): ValidationResult {
    // Convert TypeScript diagnostics to standardized format
  }
}
```

## Base Validator

```typescript
// src/validators/base.ts
export abstract class BaseValidator {
  abstract name: string;
  
  constructor(protected config: ValidatorConfig) {}
  
  abstract validate(file: FileInfo): Promise<ValidationResult>;
  
  protected standardizeResult(rawResult: any): ValidationResult {
    // Common result formatting logic
  }
}
```

## Validation Pipeline

```typescript
// src/validators/pipeline.ts
export class ValidationPipeline {
  private validators: BaseValidator[] = [];
  
  addValidator(validator: BaseValidator) {
    this.validators.push(validator);
  }
  
  async validateFile(file: FileInfo): Promise<ValidationResult[]> {
    const results = await Promise.allSettled(
      this.validators.map(validator => validator.validate(file))
    );
    
    return results
      .filter((result): result is PromiseFulfilledResult<ValidationResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }
}
```

## Implementation Steps

### Step 1: Create Base Validator Class

Implement the abstract base class that all validators extend from.

### Step 2: Implement Biome Version Detection

Create the version detection logic that checks both package.json and CLI output.

### Step 3: Build Biome Adapters

Create adapters that handle different Biome versions and their output formats.

### Step 4: Implement TypeScript Validator

Integrate with TypeScript Compiler API for type checking and diagnostics.

### Step 5: Create Validation Pipeline

Build the orchestration layer that runs validators in parallel and collects results.

### Step 6: Add Result Standardization

Ensure all validators output consistent ValidationResult format.

## Success Criteria

- [ ] Biome version auto-detection works reliably
- [ ] Both validators produce standardized output
- [ ] Results include file paths, line numbers, and messages
- [ ] Parallel validation executes correctly
- [ ] Error handling covers all failure scenarios
- [ ] Performance is acceptable for large files

## Testing

Create tests for each validator component:

```typescript
// tests/validators/biome.test.ts
describe('BiomeValidator', () => {
  it('should detect version correctly', async () => {
    // Test version detection
  });
  
  it('should validate files and return results', async () => {
    // Test file validation
  });
});
```

## Next Steps

Proceed to [Phase 3: Auto-Fix](./phase-3-auto-fix.md) to implement the automatic fix engine.