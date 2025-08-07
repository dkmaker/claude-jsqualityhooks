# TypeScript Validator

## Overview

The TypeScript validator uses the TypeScript Compiler API to perform type checking and report type errors in a format optimized for AI consumption.

## TypeScript Compiler API Integration

### Programmatic Compilation

```typescript
import * as ts from 'typescript';

class TypeScriptValidator {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  
  initialize(configPath: string) {
    // Parse tsconfig.json
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );
    
    // Create program
    this.program = ts.createProgram({
      rootNames: parsedConfig.fileNames,
      options: parsedConfig.options,
      configFileParsingDiagnostics: parsedConfig.errors
    });
    
    this.checker = this.program.getTypeChecker();
  }
}
```

### Incremental Compilation

```typescript
class IncrementalTypeScriptValidator {
  private builderProgram: ts.EmitAndSemanticDiagnosticsBuilderProgram;
  
  initialize(configPath: string) {
    const host = ts.createWatchCompilerHost(
      configPath,
      {},
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram
    );
    
    this.builderProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      host.rootNames,
      host.options,
      host
    );
  }
  
  async validateFile(filePath: string): Promise<Diagnostic[]> {
    const sourceFile = this.builderProgram.getSourceFile(filePath);
    if (!sourceFile) return [];
    
    return [
      ...this.builderProgram.getSemanticDiagnostics(sourceFile),
      ...this.builderProgram.getSyntacticDiagnostics(sourceFile)
    ];
  }
}
```

## Diagnostic Processing

### TypeScript Diagnostic Structure

```typescript
interface ts.Diagnostic {
  file?: ts.SourceFile;
  start?: number;
  length?: number;
  messageText: string | ts.DiagnosticMessageChain;
  category: ts.DiagnosticCategory;
  code: number;
  source?: string;
}

enum ts.DiagnosticCategory {
  Warning = 0,
  Error = 1,
  Suggestion = 2,
  Message = 3
}
```

### Converting to AI-Friendly Format

```typescript
function formatTypeScriptDiagnostic(
  diagnostic: ts.Diagnostic
): ValidationIssue {
  const file = diagnostic.file;
  const start = diagnostic.start || 0;
  
  // Get line and column
  let line = 0;
  let column = 0;
  if (file && typeof start === 'number') {
    const { line: lineNum, character } = 
      file.getLineAndCharacterOfPosition(start);
    line = lineNum + 1; // Convert to 1-based
    column = character + 1;
  }
  
  // Extract message
  const message = typeof diagnostic.messageText === 'string'
    ? diagnostic.messageText
    : flattenMessageChain(diagnostic.messageText);
  
  return {
    file: file ? path.relative(process.cwd(), file.fileName) : 'unknown',
    line,
    column,
    severity: mapDiagnosticCategory(diagnostic.category),
    type: 'type',
    message: simplifyMessage(message),
    rule: `TS${diagnostic.code}`,
    autoFixed: false // TypeScript errors cannot be auto-fixed
  };
}

function simplifyMessage(message: string): string {
  // Remove technical jargon for AI
  return message
    .replace(/Type '(.+?)' is not assignable to type '(.+?)'/, 
             'Cannot assign $1 to $2')
    .replace(/Property '(.+?)' does not exist on type '(.+?)'/, 
             '$1 not found in $2')
    .replace(/Cannot find name '(.+?)'/, 
             '$1 is not defined');
}
```

## Configuration

### TypeScript Settings in YAML

```yaml
validators:
  typescript:
    enabled: true
    configPath: ./tsconfig.json
    strict: true
    checkJs: false
    incremental: true
    noEmitOnError: true
    diagnosticOptions:
      skipLibCheck: true
      skipDefaultLibCheck: true
      suppressExcessPropertyErrors: false
```

### TSConfig.json Example

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

## Validation Workflow

```typescript
class TypeScriptValidator implements Validator {
  private program: ts.Program;
  private config: TypeScriptConfig;
  
  async validate(file: FileInfo): Promise<ValidationResult> {
    // 1. Get or create source file
    const sourceFile = this.getSourceFile(file.path);
    
    // 2. Get diagnostics
    const diagnostics = [
      ...this.program.getSyntacticDiagnostics(sourceFile),
      ...this.program.getSemanticDiagnostics(sourceFile),
      ...this.program.getDeclarationDiagnostics(sourceFile)
    ];
    
    // 3. Filter based on config
    const filtered = this.filterDiagnostics(diagnostics);
    
    // 4. Format for AI
    const issues = filtered.map(formatTypeScriptDiagnostic);
    
    return {
      status: issues.some(i => i.severity === 'error') 
        ? 'error' 
        : 'success',
      issues,
      statistics: {
        totalIssues: issues.length,
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length
      }
    };
  }
}
```

## Common TypeScript Errors

### Error Patterns and AI-Friendly Messages

```typescript
const ERROR_SIMPLIFICATIONS: Record<number, (msg: string) => string> = {
  // TS2322: Type assignability
  2322: (msg) => 'Type mismatch: ' + extractTypes(msg),
  
  // TS2339: Property doesn't exist
  2339: (msg) => 'Unknown property: ' + extractProperty(msg),
  
  // TS2304: Cannot find name
  2304: (msg) => 'Undefined variable: ' + extractName(msg),
  
  // TS2345: Argument type mismatch
  2345: (msg) => 'Invalid argument type: ' + extractTypes(msg),
  
  // TS7006: Parameter implicitly has 'any' type
  7006: (msg) => 'Missing type annotation for parameter',
  
  // TS2307: Cannot find module
  2307: (msg) => 'Module not found: ' + extractModule(msg)
};
```

## Performance Optimization

### Watch Mode Integration

```typescript
class TypeScriptWatcher {
  private watcher: ts.WatchOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram>;
  private diagnosticCache = new Map<string, Diagnostic[]>();
  
  start(configPath: string) {
    const host = ts.createWatchCompilerHost(
      configPath,
      {},
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      this.reportDiagnostic.bind(this),
      this.reportWatchStatus.bind(this)
    );
    
    this.watcher = ts.createWatchProgram(host);
  }
  
  private reportDiagnostic(diagnostic: ts.Diagnostic) {
    const file = diagnostic.file?.fileName;
    if (file) {
      const cache = this.diagnosticCache.get(file) || [];
      cache.push(diagnostic);
      this.diagnosticCache.set(file, cache);
    }
  }
  
  getDiagnostics(file: string): Diagnostic[] {
    return this.diagnosticCache.get(file) || [];
  }
}
```

### Project References

```typescript
function createProgramWithReferences(
  configPath: string
): ts.Program {
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    path.dirname(configPath)
  );
  
  // Handle project references
  if (parsed.projectReferences) {
    return ts.createProgram({
      rootNames: parsed.fileNames,
      options: parsed.options,
      projectReferences: parsed.projectReferences,
      configFileParsingDiagnostics: parsed.errors
    });
  }
  
  return ts.createProgram(parsed.fileNames, parsed.options);
}
```

## Integration with Other Tools

### Coordinating with Biome

```typescript
class CoordinatedValidator {
  async validate(file: FileInfo): Promise<CombinedResult> {
    // Run TypeScript first for type errors
    const tsResult = await this.typescript.validate(file);
    
    // Skip Biome if TypeScript has errors
    if (tsResult.hasErrors && this.config.skipOnTypeErrors) {
      return { typescript: tsResult, biome: null };
    }
    
    // Run Biome for format/lint
    const biomeResult = await this.biome.validate(file);
    
    return {
      typescript: tsResult,
      biome: biomeResult,
      combined: mergeResults(tsResult, biomeResult)
    };
  }
}
```

## Error Recovery

### Handling Compilation Errors

```typescript
function handleCompilationError(
  error: Error,
  file: string
): ValidationResult {
  if (error.message.includes('Cannot read file')) {
    return {
      status: 'error',
      issues: [{
        file,
        line: 0,
        column: 0,
        severity: 'error',
        type: 'type',
        message: 'File not found or cannot be read',
        autoFixed: false
      }]
    };
  }
  
  if (error.message.includes('tsconfig')) {
    return {
      status: 'error',
      issues: [{
        file: 'tsconfig.json',
        line: 0,
        column: 0,
        severity: 'error',
        type: 'config',
        message: 'Invalid TypeScript configuration',
        autoFixed: false
      }]
    };
  }
  
  throw error; // Re-throw unknown errors
}
```

## Testing

### Unit Tests

```typescript
describe('TypeScriptValidator', () => {
  let validator: TypeScriptValidator;
  
  beforeEach(() => {
    validator = new TypeScriptValidator();
    validator.initialize('./tsconfig.json');
  });
  
  it('should detect type errors', async () => {
    const file = mockFile('invalid.ts', `
      const x: number = "string";
    `);
    
    const result = await validator.validate(file);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].rule).toBe('TS2322');
  });
  
  it('should format messages for AI', async () => {
    const file = mockFile('test.ts', `
      const obj = { a: 1 };
      console.log(obj.b);
    `);
    
    const result = await validator.validate(file);
    expect(result.issues[0].message).toContain('not found');
  });
});
```

## Troubleshooting

### Common Issues

1. **Slow Validation**
   - Enable incremental compilation
   - Use project references
   - Skip lib checking
   - Exclude node_modules

2. **Missing Types**
   - Install @types packages
   - Check tsconfig includes
   - Verify module resolution

3. **False Positives**
   - Review strict settings
   - Check lib configuration
   - Verify target version

4. **Memory Issues**
   - Limit file scope
   - Use watch mode
   - Clear cache periodically