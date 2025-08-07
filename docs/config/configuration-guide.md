# Configuration Guide

## Overview

The Claude Hooks Format & Lint Validator uses a YAML configuration file (`claude-hooks.config.yaml`) for all settings. This guide explains each configuration option in detail.

## Configuration File Location

The system looks for configuration in the following order:
1. `./claude-hooks.config.yaml` (current directory)
2. `./config/claude-hooks.yaml`
3. `~/.claude-hooks/config.yaml` (user home)
4. Default configuration (built-in)

## Global Settings

### Basic Configuration

```yaml
# Enable or disable all hooks
enabled: true

# Automatically apply fixes
autoFix: true

# Block operations on errors (not recommended)
blockOnErrors: false
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Master switch for all hooks |
| `autoFix` | boolean | `true` | Apply automatic fixes when available |
| `blockOnErrors` | boolean | `false` | Prevent file operations if validation fails |

## Validators Configuration

### Biome Validator

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
    
    # Version-specific settings
    v1Settings:
      useLegacyFlags: true
      reporter: json
    
    v2Settings:
      useWorkspace: true
      reporter: json
      noColors: true
```

#### Biome Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable Biome validation |
| `configPath` | string | `./biome.json` | Path to Biome configuration |
| `autoFix` | boolean | `true` | Apply Biome fixes |
| `version` | string | `auto` | Biome version (auto-detect or specify) |
| `outputFormat` | string | `json` | Output format for parsing |
| `rules.format` | boolean | `true` | Enable formatting checks |
| `rules.lint` | boolean | `true` | Enable linting checks |
| `rules.organize` | boolean | `true` | Enable import organization |
| `rules.complexity` | boolean | `true` | Enable complexity checks |
| `fixUnsafe` | boolean | `false` | Apply potentially unsafe fixes |

### TypeScript Validator

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

#### TypeScript Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable TypeScript validation |
| `configPath` | string | `./tsconfig.json` | Path to TypeScript configuration |
| `strict` | boolean | `true` | Use strict type checking |
| `checkJs` | boolean | `false` | Type-check JavaScript files |
| `incremental` | boolean | `true` | Use incremental compilation |
| `noEmitOnError` | boolean | `true` | Don't emit on type errors |

## File Patterns

### Include and Exclude Patterns

```yaml
# Files to validate
include:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
  - "**/*.cjs"
  - "**/*.json"
  - "**/*.jsonc"

# Files to skip
exclude:
  - "node_modules/**"
  - "dist/**"
  - "build/**"
  - "coverage/**"
  - "*.min.js"
  - "*.bundle.js"
  - ".git/**"
  - "**/*.d.ts"
```

Pattern syntax follows glob patterns:
- `*` - Match any characters except `/`
- `**` - Match any characters including `/`
- `?` - Match single character
- `[abc]` - Match any character in brackets
- `{a,b}` - Match either pattern

## Hook Settings

### Hook Configuration

```yaml
hooks:
  postWrite:
    enabled: true
    timeout: 5000
    failureStrategy: warn
    autoFix: true
    reportToUser: true
    runValidators:
      - biome
      - typescript
  
  preRead:
    enabled: false
    timeout: 2000
    failureStrategy: ignore
    autoFix: false
  
  batchOperation:
    enabled: true
    timeout: 10000
    failureStrategy: warn
    parallelProcessing: true
    maxBatchSize: 50
```

#### Hook Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | varies | Enable this hook |
| `timeout` | number | `5000` | Timeout in milliseconds |
| `failureStrategy` | string | `warn` | How to handle failures |
| `autoFix` | boolean | `true` | Apply fixes in this hook |
| `reportToUser` | boolean | `true` | Send notifications to Claude |

#### Failure Strategies

- `block` - Stop operation if validation fails (not recommended)
- `warn` - Continue but report issues (default)
- `ignore` - Continue silently without reporting

## Notification Settings

### AI-Optimized Output

```yaml
notifications:
  # Output format
  format: structured  # structured | plain | verbose
  
  # Content settings
  showDiffs: true
  showFixSuggestions: true
  includeContext: true
  maxContextLines: 3
  maxDiffLines: 30
  
  # AI optimization
  removeColors: true
  removeDecorations: true
  useRelativePaths: true
  simplifyMessages: true
  
  # Organization
  groupByFile: true
  sortBy: severity  # severity | file | type
  collapseFixed: true
  highlightUnfixed: true
```

#### Notification Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `format` | string | `structured` | Output format style |
| `showDiffs` | boolean | `true` | Show before/after diffs |
| `includeContext` | boolean | `true` | Include code context |
| `maxContextLines` | number | `3` | Lines of context to show |
| `removeColors` | boolean | `true` | Strip ANSI color codes |
| `simplifyMessages` | boolean | `true` | Simplify technical messages |
| `groupByFile` | boolean | `true` | Group issues by file |
| `sortBy` | string | `severity` | Sort order for issues |

## Performance Settings

### Optimization Options

```yaml
performance:
  parallel: true
  maxWorkers: 4
  cache: true
  cacheTimeout: 300000  # 5 minutes
  debounceDelay: 500
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `parallel` | boolean | `true` | Run validators in parallel |
| `maxWorkers` | number | `4` | Maximum parallel workers |
| `cache` | boolean | `true` | Cache validation results |
| `cacheTimeout` | number | `300000` | Cache TTL in milliseconds |
| `debounceDelay` | number | `500` | Delay for rapid changes |

## Severity Configuration

### Issue Severity Levels

```yaml
severity:
  typeError: error
  formatIssue: warning
  lintIssue: warning
  importOrder: info
  complexity: warning
```

Severity levels:
- `error` - Critical issues that must be fixed
- `warning` - Issues that should be addressed
- `info` - Informational messages

## Fix Priority

### Fix Application Order

```yaml
fixPriority:
  format: 100
  imports: 90
  lint: 80
  complexity: 50
```

Higher numbers are fixed first. This ensures formatting happens before other fixes to avoid conflicts.

## Complete Example

See [example-config.yaml](./example-config.yaml) for a complete configuration file with all options.

## Configuration Schema

The configuration file supports JSON Schema validation:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/.../claude-hooks-schema.json
```

## Best Practices

1. **Start with defaults** - The default configuration works well for most projects
2. **Enable incrementally** - Start with formatting, add linting later
3. **Test fix settings** - Use `fixUnsafe: false` initially
4. **Adjust timeouts** - Increase for large files or slow systems
5. **Use cache** - Improves performance significantly
6. **Group by file** - Makes output easier to understand

## Troubleshooting

### Common Issues

1. **Configuration not found**
   - Check file name is exactly `claude-hooks.config.yaml`
   - Verify file is in project root
   - Check YAML syntax is valid

2. **Validators not running**
   - Ensure validator is enabled
   - Check configPath points to valid config
   - Verify tool is installed (Biome, TypeScript)

3. **Performance issues**
   - Enable caching
   - Increase debounce delay
   - Reduce maxWorkers if system is slow
   - Exclude large files or directories

4. **Too many notifications**
   - Set `collapseFixed: true`
   - Increase `maxDiffLines`
   - Use `summaryOnly` for large changes

## Migration Guide

### From Environment Variables

If migrating from environment variables:

```bash
# Old (environment variables)
CLAUDE_HOOKS_ENABLED=true
CLAUDE_HOOKS_AUTO_FIX=true

# New (YAML)
enabled: true
autoFix: true
```

### From JSON Configuration

If migrating from JSON:

```json
// Old (JSON)
{
  "enabled": true,
  "validators": {
    "biome": {
      "enabled": true
    }
  }
}
```

```yaml
# New (YAML)
enabled: true
validators:
  biome:
    enabled: true
```