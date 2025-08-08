# TypeScript Validator

> Part of **Claude JS Quality Hooks** (`claude-jsqualityhooks`)

## Overview

The TypeScript validator provides type checking using the TypeScript Compiler API with minimal configuration required.

## Configuration

```yaml
validators:
  typescript:
    enabled: true                      # Enable/disable
    configPath: ./tsconfig.json       # Optional custom path
```

All other settings come from your `tsconfig.json`.

## How It Works

### 1. Load TypeScript Configuration
```typescript
const configPath = config.configPath || './tsconfig.json';
const tsConfig = ts.readConfigFile(configPath, ts.sys.readFile);
```

### 2. Create Program
```typescript
const program = ts.createProgram({
  rootNames: [file.path],
  options: tsConfig.config.compilerOptions,
  host: ts.createCompilerHost(tsConfig.config.compilerOptions)
});
```

### 3. Get Diagnostics
```typescript
const diagnostics = [
  ...program.getSemanticDiagnostics(),
  ...program.getSyntacticDiagnostics()
];
```

### 4. Format Results
```typescript
return diagnostics.map(diagnostic => ({
  file: file.path,
  line: getLineNumber(diagnostic),
  column: getColumnNumber(diagnostic),
  severity: getSeverity(diagnostic),
  message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  code: diagnostic.code
}));
```

## Smart Defaults

All handled automatically:
- **Timeout**: 5 seconds
- **Error Handling**: Report errors but don't block
- **Diagnostic Types**: Both semantic and syntactic
- **Output Format**: AI-optimized
- **Severity Mapping**: Error/Warning/Info based on TypeScript categories

## TypeScript Configuration

The validator respects your project's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Quick Fixes

Safe TypeScript quick fixes are applied:
- Missing semicolons
- Unused imports (removal)
- Simple syntax corrections

Complex fixes are not attempted automatically.

## Error Messages

TypeScript errors are simplified for AI consumption:
- Technical jargon removed
- Paths made relative
- Context preserved
- Actionable information highlighted

## Integration with Biome

TypeScript and Biome validators run in parallel:
- No coordination needed
- Both report independently
- Results are merged for display

## Error Handling

- Missing TypeScript: Clear installation message
- Invalid tsconfig.json: Falls back to defaults
- Compilation errors: Reports what it can
- Never blocks file operations

