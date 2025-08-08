# TypeScript Interfaces

> API interfaces for **Claude JS Quality Hooks** (`claude-jsqualityhooks`)

## Core Configuration

### Main Config Interface

The main configuration interface:

```typescript
interface Config {
  // Global settings (2)
  enabled: boolean;
  autoFix: boolean;
  
  // Validators (6 total fields)
  validators: {
    biome?: {
      enabled: boolean;
      version: 'auto' | '1.x' | '2.x';
      configPath?: string;
    };
    typescript?: {
      enabled: boolean;
      configPath?: string;
    };
  };
  
  // File patterns (2)
  include?: string[];
  exclude?: string[];
}
```

## File Information

```typescript
interface FileInfo {
  path: string;          // Absolute file path
  relativePath: string;  // Relative to project root
  content: string;       // File content
}
```

## Validation Results

```typescript
interface ValidationResponse {
  status: 'success' | 'warning' | 'error';
  filesModified: boolean;
  summary: string;
  issues: ValidationIssue[];
  statistics: ValidationStatistics;
}

interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fixed: boolean;
  fixable: boolean;
}

interface ValidationStatistics {
  totalIssues: number;
  fixedIssues: number;
  remainingIssues: number;
}
```

## Validator Interfaces

### Base Validator

```typescript
interface Validator {
  name: string;
  validate(file: FileInfo): Promise<ValidationResult>;
  fix?(file: FileInfo): Promise<string>;
}

interface ValidationResult {
  validator: string;
  status: 'success' | 'warning' | 'error';
  issues: ValidationIssue[];
}
```

### Biome Validator Specific

```typescript
interface BiomeValidator extends Validator {
  name: 'biome';
  version: '1.x' | '2.x';
  detectVersion(): Promise<'1.x' | '2.x'>;
}

// Biome version adapters
interface BiomeAdapter {
  buildCommand(file: string, autoFix: boolean): string[];
  parseOutput(output: string): ValidationIssue[];
}

class BiomeV1Adapter implements BiomeAdapter {
  buildCommand(file: string, autoFix: boolean) {
    // Uses --apply for fixes
  }
}

class BiomeV2Adapter implements BiomeAdapter {
  buildCommand(file: string, autoFix: boolean) {
    // Uses --write for fixes
  }
}
```

### TypeScript Validator Specific

```typescript
interface TypeScriptValidator extends Validator {
  name: 'typescript';
  program: ts.Program;
  getDiagnostics(file: string): ts.Diagnostic[];
}
```

## Hook System

```typescript
interface Hook {
  name: 'postWrite';
  execute(file: FileInfo): Promise<HookResult>;
}

interface HookResult {
  success: boolean;
  modified: boolean;
  validation?: ValidationResponse;
}
```

## AI Output Formatter

```typescript
interface AIFormatter {
  format(results: ValidationResult[]): AIFormattedOutput;
}

interface AIFormattedOutput {
  status: 'success' | 'warning' | 'error';
  filesModified: boolean;
  summary: string;
  issues: FormattedIssue[];
  statistics: Statistics;
}

interface FormattedIssue {
  file: string;        // Always relative path
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;     // Simplified for AI
  fixed: boolean;
}
```

## Configuration Loader

```typescript
interface ConfigLoader {
  load(): Promise<Config>;
  validate(config: unknown): config is Config;
}

class YamlConfigLoader implements ConfigLoader {
  private readonly CONFIG_FILE = 'claude-jsqualityhooks.config.yaml';
  
  async load(): Promise<Config> {
    // Load and validate configuration
  }
}
```

## Smart Defaults (Internal)

```typescript
// Internal constants - not exposed
const SMART_DEFAULTS = {
  timeout: 5000,
  failureStrategy: 'warn',
  outputFormat: 'ai-optimized',
  fixOrder: ['format', 'imports', 'lint'],
  performance: {
    parallel: true,
    cache: true
  }
};
```


## Usage Examples

### Loading Configuration

```typescript
const loader = new YamlConfigLoader();
const config = await loader.load();

// Configuration example
console.log(config.enabled);          // true
console.log(config.autoFix);          // true
console.log(config.validators.biome.version); // 'auto'
```

### Running Validation

```typescript
const validator = new BiomeValidator(config.validators.biome);
const result = await validator.validate(fileInfo);

// Result uses fixed format
console.log(result.status);
console.log(result.issues);
```

### Formatting for AI

```typescript
const formatter = new AIFormatter();
const output = formatter.format(validationResults);

// Output is always AI-optimized
console.log(output.summary);
console.log(output.statistics);
```

## Implementation Notes

1. Keep interfaces minimal
2. Use smart defaults internally
3. Focus on Biome version detection
4. Fixed AI output format
5. Type safety with proper validation