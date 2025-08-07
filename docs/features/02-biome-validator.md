# Biome Validator

## Overview

The Biome validator provides comprehensive formatting and linting capabilities with automatic version detection for both Biome 1.x and 2.x.

## Version Compatibility

### Biome 1.x vs 2.x Differences

| Feature | Biome 1.x | Biome 2.x |
|---------|-----------|----------|
| **Command Syntax** | `biome check --apply` | `biome check --write` |
| **JSON Reporter** | `--reporter=json` | `--reporter=json --no-colors` |
| **Import Sorting** | `--apply-unsafe` | `--write --unsafe` |
| **Config Format** | `biome.json` | `biome.json` or `biome.jsonc` |
| **Workspace Support** | Limited | Full workspace support |
| **Performance** | Fast | ~30% faster |
| **CSS Support** | Experimental | Stable |
| **GraphQL Support** | No | Yes (experimental) |

## Version Detection

### Detection Strategy

```typescript
async function detectBiomeVersion(): Promise<BiomeVersion> {
  // 1. Check package.json
  const packageVersion = await getVersionFromPackageJson();
  if (packageVersion) return parseVersion(packageVersion);
  
  // 2. Run biome --version
  const cliVersion = await getVersionFromCLI();
  if (cliVersion) return parseVersion(cliVersion);
  
  // 3. Try both command syntaxes
  const detected = await detectBySyntax();
  if (detected) return detected;
  
  // 4. Default to v2.x
  return { major: 2, minor: 0, patch: 0 };
}
```

### Version Caching

```typescript
class VersionCache {
  private version: BiomeVersion | null = null;
  private detectedAt: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  async get(): Promise<BiomeVersion> {
    if (this.version && Date.now() - this.detectedAt < this.TTL) {
      return this.version;
    }
    
    this.version = await detectBiomeVersion();
    this.detectedAt = Date.now();
    return this.version;
  }
}
```

## Command Building

### Version-Specific Adapters

```typescript
// V1 Adapter
class BiomeV1Adapter {
  buildCheckCommand(file: string, options: BiomeOptions): string[] {
    const args = ['check', file];
    
    if (options.fix) {
      args.push('--apply');
      if (options.fixUnsafe) args.push('--apply-unsafe');
    }
    
    if (options.outputFormat === 'json') {
      args.push('--reporter=json');
    }
    
    return args;
  }
}

// V2 Adapter
class BiomeV2Adapter {
  buildCheckCommand(file: string, options: BiomeOptions): string[] {
    const args = ['check', file];
    
    if (options.fix) {
      args.push('--write');
      if (options.fixUnsafe) args.push('--unsafe');
    }
    
    if (options.outputFormat === 'json') {
      args.push('--reporter=json', '--no-colors');
    }
    
    return args;
  }
}
```

## JSON Output Processing

### Biome JSON Structure

```typescript
interface BiomeOutput {
  diagnostics: BiomeDiagnostic[];
  summary: {
    errors: number;
    warnings: number;
    information: number;
  };
}

interface BiomeDiagnostic {
  file_path: string;
  severity: 'error' | 'warning' | 'information';
  category: 'format' | 'lint' | 'import';
  message: {
    content: string;
    elements: MessageElement[];
  };
  location: {
    path: string;
    span: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    };
  };
}
```

### Parsing Implementation

```typescript
function parseBiomeJson(output: string): ValidationResult {
  const json: BiomeOutput = JSON.parse(output);
  
  return {
    issues: json.diagnostics.map(diagnostic => ({
      file: path.relative(process.cwd(), diagnostic.file_path),
      line: diagnostic.location.span.start.line,
      column: diagnostic.location.span.start.column,
      severity: mapSeverity(diagnostic.severity),
      type: diagnostic.category,
      message: extractMessage(diagnostic.message),
      rule: diagnostic.rule || undefined,
      autoFixed: false
    })),
    statistics: {
      totalIssues: json.summary.errors + json.summary.warnings,
      errors: json.summary.errors,
      warnings: json.summary.warnings
    }
  };
}
```

## Configuration

### Biome Configuration in YAML

```yaml
validators:
  biome:
    enabled: true
    configPath: ./biome.json
    autoFix: true
    version: auto  # auto | 1.x | 2.x
    outputFormat: json
    rules:
      format: true
      lint: true
      organize: true
      complexity: true
    fixUnsafe: false
    v1Settings:
      useLegacyFlags: true
      reporter: json
    v2Settings:
      useWorkspace: true
      reporter: json
      noColors: true
```

### Biome.json Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"
      }
    }
  },
  "organizeImports": {
    "enabled": true
  },
  "files": {
    "ignore": ["node_modules", "dist", "build"]
  }
}
```

## Validation Workflow

```typescript
class BiomeValidator implements Validator {
  private versionDetector: VersionDetector;
  private adapter: BiomeAdapter;
  
  async validate(file: FileInfo): Promise<ValidationResult> {
    // 1. Detect version
    const version = await this.versionDetector.detect();
    
    // 2. Select adapter
    this.adapter = version.major === 1 
      ? new BiomeV1Adapter() 
      : new BiomeV2Adapter();
    
    // 3. Build command
    const command = this.adapter.buildCheckCommand(
      file.path,
      this.config
    );
    
    // 4. Execute
    const output = await exec(`biome ${command.join(' ')}`);
    
    // 5. Parse results
    return parseBiomeJson(output.stdout);
  }
}
```

## Auto-Fix Implementation

### Fix Application

```typescript
async function applyBiomeFixes(
  file: FileInfo,
  issues: Issue[]
): Promise<FixResult> {
  const fixableIssues = issues.filter(i => i.fixable);
  
  if (fixableIssues.length === 0) {
    return { fixed: false, count: 0 };
  }
  
  // Build fix command
  const command = this.adapter.buildFixCommand(
    file.path,
    { safe: true, unsafe: config.fixUnsafe }
  );
  
  // Execute fix
  const result = await exec(`biome ${command.join(' ')}`);
  
  // Verify fixes
  const afterValidation = await this.validate(file);
  const fixedCount = issues.length - afterValidation.issues.length;
  
  return {
    fixed: true,
    count: fixedCount,
    remaining: afterValidation.issues
  };
}
```

## Error Handling

### Common Errors

```typescript
function handleBiomeError(error: ExecError): ValidationResult {
  if (error.code === 'ENOENT') {
    throw new Error('Biome not found. Please install @biomejs/biome');
  }
  
  if (error.stderr.includes('configuration')) {
    throw new Error('Invalid Biome configuration: ' + error.stderr);
  }
  
  // Parse errors from stderr
  return parseErrorOutput(error.stderr);
}
```

## Performance Optimization

### Batch Processing

```typescript
async function validateBatch(files: FileInfo[]): Promise<ValidationResult[]> {
  // Use Biome's native batch support
  const command = this.adapter.buildBatchCommand(files.map(f => f.path));
  const output = await exec(`biome ${command.join(' ')}`);
  
  // Parse batch results
  return parseBatchOutput(output.stdout);
}
```

### Incremental Validation

```typescript
class IncrementalValidator {
  private lastResults = new Map<string, ValidationResult>();
  
  async validate(file: FileInfo): Promise<ValidationResult> {
    // Check if file changed
    const hash = await hashFile(file.path);
    const cached = this.lastResults.get(file.path);
    
    if (cached && cached.hash === hash) {
      return cached.result;
    }
    
    // Validate changed file
    const result = await biomeValidator.validate(file);
    this.lastResults.set(file.path, { hash, result });
    
    return result;
  }
}
```

## Testing

### Unit Tests

```typescript
describe('BiomeValidator', () => {
  it('should detect Biome version', async () => {
    const version = await detector.detect();
    expect(version.major).toBeGreaterThanOrEqual(1);
  });
  
  it('should validate TypeScript file', async () => {
    const result = await validator.validate(mockTsFile);
    expect(result.issues).toBeDefined();
  });
  
  it('should apply fixes', async () => {
    const fixed = await validator.fix(mockFileWithIssues);
    expect(fixed.count).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Version Detection Issues
- Check if Biome is installed
- Verify PATH includes Biome
- Check package.json for version
- Try manual version specification

### Performance Issues
- Enable batch processing
- Use incremental validation
- Adjust timeout settings
- Exclude large files

### Fix Conflicts
- Disable unsafe fixes
- Run format before lint
- Check rule priorities
- Review biome.json settings