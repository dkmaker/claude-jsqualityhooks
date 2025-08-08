# Biome Validator

> Part of **Claude JS Quality Hooks** (`claude-jsqualityhooks`)

## Overview

The Biome validator provides formatting and linting with automatic version detection for both Biome 1.x and 2.x.

## Version Compatibility

### Auto-Detection (Default)

```yaml
validators:
  biome:
    enabled: true
    version: auto  # Automatically detects 1.x or 2.x
```

### Version Differences

| Feature | Biome 1.x | Biome 2.x |
|---------|-----------|-----------|
| **Fix Command** | `--apply` | `--write` |
| **JSON Output** | `--reporter=json` | `--reporter=json --no-colors` |
| **Unsafe Fixes** | `--apply-unsafe` | `--write --unsafe` |

## Version Detection Strategy

```typescript
async function detectBiomeVersion(): Promise<'1.x' | '2.x'> {
  // 1. Check package.json
  const packageVersion = await getVersionFromPackageJson();
  if (packageVersion) return parseVersion(packageVersion);
  
  // 2. Run biome --version
  const cliVersion = await getVersionFromCLI();
  if (cliVersion) return parseVersion(cliVersion);
  
  // 3. Default to v2 (latest)
  return '2.x';
}
```

## Configuration

```yaml
validators:
  biome:
    enabled: true                    # Enable/disable
    version: auto                    # auto | 1.x | 2.x
    configPath: ./biome.json        # Optional custom path
```

## How It Works

### 1. Version Detection
```typescript
const version = config.version === 'auto' 
  ? await detectBiomeVersion()
  : config.version;
```

### 2. Adapter Selection
```typescript
const adapter = version === '1.x'
  ? new BiomeV1Adapter()
  : new BiomeV2Adapter();
```

### 3. Command Building
```typescript
// V1 Adapter
class BiomeV1Adapter {
  buildCommand(file: string, autoFix: boolean) {
    return [
      'check',
      file,
      autoFix ? '--apply' : '',
      '--reporter=json'
    ];
  }
}

// V2 Adapter
class BiomeV2Adapter {
  buildCommand(file: string, autoFix: boolean) {
    return [
      'check', 
      file,
      autoFix ? '--write' : '',
      '--reporter=json',
      '--no-colors'
    ];
  }
}
```

### 4. Validation
```typescript
async function validate(file: FileInfo): Promise<ValidationResult> {
  const adapter = await getAdapter();
  const command = adapter.buildCommand(file.path, config.autoFix);
  const result = await exec(`biome ${command.join(' ')}`);
  return parseJsonOutput(result.stdout);
}
```

## Smart Defaults

These are handled automatically:

- **Output Format**: Always JSON for parsing
- **Fix Order**: Format → Imports → Lint
- **Timeout**: 5 seconds
- **Error Handling**: Warn but don't block
- **Safe Fixes Only**: Only safe fixes are applied

## Biome Configuration File

The validator uses your project's `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

## Error Handling

- Missing Biome: Clear error message with installation instructions
- Version detection failure: Falls back to v2 syntax
- Invalid configuration: Uses Biome defaults
- Validation failure: Reports issues but doesn't block

