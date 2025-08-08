# Claude JS Quality Hooks

A TypeScript-based Claude Code Hooks extension that ensures code quality through automatic validation and fixing.

**Repository**: https://github.com/dkmaker/claude-jsqualityhooks  
**Developer**: DKMaker  
**NPM Package**: `claude-jsqualityhooks`

## Overview

This project provides post-write hooks for Claude Code that:
- Validate code immediately after Claude writes files
- Automatically fix formatting and linting issues
- Support multiple Biome versions with auto-detection
- Provide AI-optimized output for clear error reporting
- Maintain context synchronization with Claude

## Quick Start

**No installation required!** Use directly with `npx`:

1. **Initialize Configuration**
   ```bash
   npx claude-jsqualityhooks init
   ```
   This creates `claude-jsqualityhooks.config.yaml` and detects your environment.

2. **Install Biome in your project**
   ```bash
   npm install --save-dev @biomejs/biome  # Automatically detects version
   ```

3. **Register with Claude**
   ```bash
   npx claude-jsqualityhooks install
   ```

That's it! The hooks will now run automatically when Claude modifies files.

### Optional: Global Installation

For frequent CLI usage, you can install globally:
```bash
# Always use npx - no installation needed
npx claude-jsqualityhooks [command]
claude-jsqualityhooks version  # Now available without npx
```

See [Installation Guide](./INSTALLATION.md) for detailed setup options.

## Key Features

- ✅ **Automatic Validation** - TypeScript type checking and Biome linting
- ✅ **Auto-Fix** - Automatically fixes formatting and safe linting issues
- ✅ **Version Detection** - Works with multiple Biome versions
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

- Node.js 18+
- Claude Code CLI
- TypeScript 5.x
- Biome (current versions)

## License

MIT - See LICENSE file for details

## Repository

**GitHub**: https://github.com/dkmaker/claude-jsqualityhooks  
**Developer**: DKMaker