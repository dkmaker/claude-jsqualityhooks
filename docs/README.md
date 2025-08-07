# Claude JS Quality Hooks

A TypeScript-based Claude Code Hooks extension that ensures code quality through automatic validation and fixing.

**Repository**: https://github.com/dkmaker/claude-jsqualityhooks  
**Developer**: DKMaker  
**NPM Package**: `claude-jsqualityhooks`

## Overview

This project provides post-write hooks for Claude Code that:
- Validate code immediately after Claude writes files
- Automatically fix formatting and linting issues
- Support both Biome 1.x and 2.x with auto-detection
- Provide AI-optimized output for clear error reporting
- Maintain context synchronization with Claude

## Quick Start

1. **Install Package**
   ```bash
   npm install claude-jsqualityhooks
   npm install --save-dev @biomejs/biome@^2  # or @^1 for v1.x
   ```

2. **Configure**
   ```bash
   cp docs/config/example-config.yaml claude-hooks.config.yaml
   # Edit configuration as needed
   ```

3. **Build & Register**
   ```bash
   npm run build
   npm run register-hooks
   ```

## Key Features

- ✅ **Automatic Validation** - TypeScript type checking and Biome linting
- ✅ **Auto-Fix** - Automatically fixes formatting and safe linting issues
- ✅ **Version Detection** - Works with both Biome 1.x and 2.x
- ✅ **AI-Optimized Output** - Clean, structured output for Claude
- ✅ **Performance** - Parallel processing and intelligent caching

## Project Goals

1. **Automatic Code Quality** - Validate and fix files immediately after Claude writes them
2. **Seamless Remediation** - Fix issues automatically without manual intervention
3. **Transparent Communication** - Keep Claude informed of all modifications
4. **Comprehensive Coverage** - Support multiple file types through unified interface
5. **Performance** - Minimal latency while ensuring thorough validation

## Documentation Structure

- **[Architecture](./ARCHITECTURE.md)** - System design and components
- **[Development](./DEVELOPMENT.md)** - Implementation phases and workflow
- **Features**
  - [Hook System](./features/01-hook-system.md)
  - [Biome Validator](./features/02-biome-validator.md)
  - [TypeScript Validator](./features/03-typescript-validator.md)
  - [AI Formatter](./features/04-ai-formatter.md)
  - [Auto-Fix Engine](./features/05-auto-fix-engine.md)
- **Configuration**
  - [Configuration Guide](./config/configuration-guide.md)
  - [Example Config](./config/example-config.yaml)
- **API Reference**
  - [Interfaces](./api/interfaces.md)
  - [Hook API](./api/hook-api.md)
  - [Formatter API](./api/formatter-api.md)
- **Implementation Guides**
  - [Phase 1: Infrastructure](./implementation/phase-1-infrastructure.md)
  - [Phase 2: Validators](./implementation/phase-2-validators.md)
  - [Phase 3: Auto-Fix](./implementation/phase-3-auto-fix.md)
  - [Phase 4: AI Output](./implementation/phase-4-ai-output.md)
  - [Phase 5: Testing](./implementation/phase-5-testing.md)

## Supported File Types

### Primary Support
- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx, .mjs, .cjs)
- JSON (.json, .jsonc)

### Extended Support
- CSS/SCSS (.css, .scss, .sass)
- HTML (.html, .htm)
- Markdown (.md, .mdx)
- YAML (.yml, .yaml)

## Requirements

- Node.js v18+
- Claude Code CLI
- TypeScript 5.x
- Biome 1.x or 2.x

## License

MIT - See LICENSE file for details

## Repository

**GitHub**: https://github.com/dkmaker/claude-jsqualityhooks  
**Developer**: DKMaker