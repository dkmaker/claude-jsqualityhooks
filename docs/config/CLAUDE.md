# Configuration Documentation Guide

## Overview

This directory contains configuration documentation and examples for claude-jsqualityhooks.

## Files

### configuration-guide.md
The complete configuration reference covering all configuration options with detailed explanations, examples, and default values.

### example-config.yaml
A minimal working configuration file showing the most common setup.

## Configuration Structure

The configuration uses YAML format with these top-level sections:
- Core settings (`enabled`, `autoFix`, `logLevel`)
- Validators configuration (`biome`, `typescript`)
- File patterns (`include`, `exclude`)

## Key Configuration Options

### Required
- Configuration file must exist at `claude-jsqualityhooks.config.yaml`
- At least one validator must be enabled

### Biome Version Detection
The `version: auto` setting is the recommended approach, automatically detecting:
- Biome version 1.x (uses `--apply` flag)
- Biome version 2.x (uses `--write` flag)

### File Patterns
- `include`: Glob patterns for files to validate
- `exclude`: Glob patterns for files to skip
- Defaults handle most JavaScript/TypeScript projects

## Usage Examples

### Minimal Config
```yaml
enabled: true
validators:
  biome:
    enabled: true
```

### Standard Config
```yaml
enabled: true
autoFix: true
validators:
  biome:
    enabled: true
    version: auto
  typescript:
    enabled: true
```

### Custom Paths
```yaml
enabled: true
autoFix: true
validators:
  biome:
    enabled: true
    configPath: ./config/biome.json
  typescript:
    enabled: true
    configPath: ./config/tsconfig.json
include:
  - "src/**/*.{ts,tsx}"
exclude:
  - "**/*.test.ts"
```

## Configuration Loading

The tool looks for `claude-jsqualityhooks.config.yaml` in the project root. If not found, it displays instructions for creating one.

## Validation

Configuration is validated using Zod schemas to ensure:
- Required fields are present
- Values are correct types
- Enums match allowed values
- Paths are valid strings

## Best Practices

1. Start with the minimal config
2. Use `version: auto` for Biome
3. Let defaults handle file patterns
4. Only customize what you need
5. Keep config in project root

## Common Issues

### Config Not Found
The tool exits gracefully with instructions if the config file doesn't exist.

### Invalid YAML
YAML parser provides line numbers for syntax errors.

### Type Validation
Zod provides clear error messages for invalid values.