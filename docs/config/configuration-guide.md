# Configuration Guide

## Overview

Claude JS Quality Hooks uses a single YAML configuration file (`claude-jsqualityhooks.config.yaml`) for all configuration settings.

## Configuration File Requirement

**IMPORTANT:** The configuration file `claude-jsqualityhooks.config.yaml` MUST exist in your project root directory.

- **Location:** `./claude-jsqualityhooks.config.yaml` (current directory only)
- **Required:** Yes - the tool will NOT run without this file

### Quick Setup

```bash
npx claude-jsqualityhooks init
```

Or create manually:

```yaml
# claude-jsqualityhooks.config.yaml
enabled: true
validators:
  biome: true
```

## Configuration Options

### Global Settings

```yaml
enabled: true   # Master switch
autoFix: true   # Apply fixes automatically
```

### Validator Settings

```yaml
validators:
  biome:
    enabled: true
    version: auto              # auto | 1.x | 2.x (ESSENTIAL!)
    configPath: ./biome.json  # Optional custom path
  typescript:
    enabled: true
    configPath: ./tsconfig.json  # Optional custom path
```

#### Biome Version Management

The `version` option is **critical** for compatibility:

- `auto` (recommended) - Automatically detects Biome version
- `1.x` - Force Biome 1.x command syntax
- `2.x` - Force Biome 2.x command syntax

This handles the different command syntax between Biome versions:
- Biome 1.x uses `--apply` for fixes
- Biome 2.x uses `--write` for fixes

### File Patterns

```yaml
# Optional - has smart defaults
include:
  - "src/**/*.{ts,tsx,js,jsx}"

exclude:
  - "node_modules/**"
  - "dist/**"
```

If not specified, defaults are:
- **Include**: All `.ts`, `.tsx`, `.js`, `.jsx` files
- **Exclude**: node_modules, dist, build directories

## Complete Examples

### Minimal

```yaml
enabled: true
validators:
  biome: true
```

### Recommended

```yaml
enabled: true
autoFix: true
validators:
  biome:
    enabled: true
    version: auto
  typescript: true
```

### Complete Configuration

```yaml
enabled: true
autoFix: true

validators:
  biome:
    enabled: true
    version: auto
    configPath: ./biome.json
  typescript:
    enabled: true
    configPath: ./tsconfig.json

include:
  - "src/**/*.{ts,tsx,js,jsx}"

exclude:
  - "node_modules/**"
  - "dist/**"
  - "build/**"
```

## Smart Defaults

Everything else is handled automatically:

- **Output**: AI-optimized JSON format
- **Timeouts**: 5 seconds
- **Performance**: Parallel execution with caching
- **Fix Order**: Format → Imports → Lint
- **Failure Handling**: Warn but don't block
- **Notifications**: No colors, relative paths, simplified messages
- **Default includes**: All JS/TS files if not specified
- **Default excludes**: node_modules, dist, build if not specified


## Troubleshooting

### Biome Version Issues

If auto-detection fails, specify version explicitly:

```yaml
validators:
  biome:
    version: 2.x  # Force v2 syntax
```

### Custom Config Paths

If your config files are in non-standard locations:

```yaml
validators:
  biome:
    configPath: ./config/biome.json
  typescript:
    configPath: ./config/tsconfig.json
```

### Disable a Validator

```yaml
validators:
  biome: true
  typescript: false  # Disabled
```

## Migration Guide

### Updating Configuration

To modify your configuration:

1. Edit the `claude-jsqualityhooks.config.yaml` file
2. Add or modify the options you need
3. Test with your project files

## Best Practices

- Start with the minimal configuration and add options as needed
- Use `version: auto` for Biome to handle version differences automatically
- Rely on smart defaults for file patterns unless you have specific requirements
- Keep the configuration file in your project root directory
- Test your configuration with a few files before running on your entire codebase