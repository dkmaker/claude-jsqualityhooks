# Documentation Structure Guide

## Overview

This directory contains all documentation for claude-jsqualityhooks. The documentation is organized by topic and follows a clear hierarchy from high-level concepts to implementation details.

## Directory Contents

### High-Level Documentation

- **README.md** - Main project documentation, quick start guide
- **ARCHITECTURE.md** - System design, component overview, data flow
- **DEVELOPMENT.md** - Development workflow, implementation phases
- **DEVELOPMENT-SETUP.md** - pnpm setup, library choices with rationale
- **INSTALLATION.md** - User installation guide (npx-based)
- **CLI.md** - Command-line interface reference
- **DEBUG-SYSTEM.md** - Development debug system guide (development only)

### Subdirectories

- **api/** - TypeScript interfaces and API contracts
- **config/** - Configuration guide and examples
- **features/** - Individual feature documentation
- **implementation/** - Phase-by-phase implementation guides
- **reference/** - External documentation references

## Reading Order

### For New Contributors
1. README.md - Understand the project
2. ARCHITECTURE.md - Learn the system design
3. DEVELOPMENT-SETUP.md - Set up your environment
4. DEBUG-SYSTEM.md - Set up debug capabilities
5. DEVELOPMENT.md - Understand the workflow
6. implementation/phase-1-infrastructure.md - Start coding

### For Users
1. README.md - Quick start
2. INSTALLATION.md - Detailed setup
3. config/configuration-guide.md - Configure the tool
4. CLI.md - Available commands

### For Understanding Features
1. features/01-hook-system.md - Core hook mechanism
2. features/02-biome-validator.md - Biome integration
3. features/03-typescript-validator.md - TypeScript validation
4. features/04-ai-formatter.md - Output formatting
5. features/05-auto-fix-engine.md - Auto-fix logic

## Key Files

### Essential Reading
- **config/configuration-guide.md** - The 10 configuration options
- **config/example-config.yaml** - Minimal working config
- **api/interfaces.md** - Core TypeScript types

### Implementation Guides
- **implementation/phase-1-infrastructure.md** - Project setup
- **implementation/phase-2-validators.md** - Validator implementation
- **implementation/phase-3-auto-fix.md** - Auto-fix feature
- **implementation/phase-4-ai-output.md** - AI formatting
- **implementation/phase-5-testing.md** - Testing strategy

### Development Tools
- **DEBUG-SYSTEM.md** - Debug system setup and usage

## Documentation Principles

### Design Principles
- Focus on essential configuration options
- Emphasize smart defaults
- Keep documentation clear and focused

### Consistency
- All paths use forward slashes
- Package name: `claude-jsqualityhooks`
- GitHub: `dkmaker/claude-jsqualityhooks`
- Config file: `claude-jsqualityhooks.config.yaml`

### User vs Developer
- Users run: `npx claude-jsqualityhooks`
- Developers use: `pnpm` commands
- Never install as dependency

## Quick Reference

### Configuration Options
1. `enabled` - Master switch
2. `autoFix` - Enable auto-fixing
3. `validators.biome.enabled` - Biome on/off
4. `validators.biome.version` - auto/specific version
5. `validators.biome.configPath` - Custom biome.json
6. `validators.typescript.enabled` - TypeScript on/off
7. `validators.typescript.configPath` - Custom tsconfig
8. `include` - File patterns to include
9. `exclude` - File patterns to exclude
10. `logLevel` - Logging verbosity

### Advanced Features (Future)
- Pre-write hooks
- Multiple config locations
- Performance tuning
- Custom notification formats
- Severity customization
- Fix priorities

## Development vs Production Documentation

### Development-Only Files
- **DEBUG-SYSTEM.md** - Excluded from NPM distribution, for development use only
- Debug code and documentation exist only in source repository
- End users never see debug-related documentation

### Production Files  
- All other documentation files are included in the distributed package
- User-facing guides focus on configuration and usage
- No references to internal development tools

## Maintenance Notes

When updating documentation:
1. Keep current scope in mind
2. Update this CLAUDE.md if adding files
3. Ensure examples use current package versions
4. Test all code examples
5. Maintain clear separation between development and user documentation
6. Debug system changes only affect development workflow, not end users