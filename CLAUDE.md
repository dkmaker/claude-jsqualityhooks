# Claude JS Quality Hooks - AI Development Guide

## Project Overview

**claude-jsqualityhooks** is a Claude Code Hooks extension that validates and auto-fixes TypeScript/JavaScript code after Claude writes files. This is the complete documentation for v1.0, which prioritizes simplicity with only 10 configuration options.

**Repository**: https://github.com/dkmaker/claude-jsqualityhooks  
**NPM Package**: `claude-jsqualityhooks`  
**Developer**: DKMaker

## Key Concepts

### What This Tool Does
1. **Intercepts file writes** - Hooks into Claude's Write/Edit/MultiEdit operations
2. **Validates code** - Runs Biome linting and TypeScript checking on modified files
3. **Auto-fixes issues** - Applies safe formatting and linting fixes automatically
4. **Reports to Claude** - Returns AI-optimized feedback without ANSI codes

### v1 Philosophy: Simplicity First
- Only 10 configuration options (down from 76+ in initial design)
- Smart defaults for everything else
- Biome version auto-detection as the key feature
- No complex customization in v1

## Project Structure

```
claude-jsqualityhooks/
├── CLAUDE.md                    # This file - AI development guide
├── docs/                        # Documentation root
│   ├── CLAUDE.md               # Documentation structure guide
│   ├── README.md               # Main project documentation
│   ├── ARCHITECTURE.md         # System design and components
│   ├── DEVELOPMENT.md          # Development workflow and phases
│   ├── DEVELOPMENT-SETUP.md   # pnpm setup and library rationale
│   ├── INSTALLATION.md         # User installation guide
│   ├── CLI.md                  # CLI commands reference
│   ├── api/                    # API documentation
│   │   ├── CLAUDE.md          # API docs guide
│   │   └── interfaces.md      # TypeScript interfaces (simplified)
│   ├── config/                 # Configuration documentation
│   │   ├── CLAUDE.md          # Config docs guide
│   │   ├── configuration-guide.md  # Complete v1 config guide
│   │   └── example-config.yaml     # Minimal 10-line example
│   ├── features/               # Feature documentation
│   │   ├── CLAUDE.md          # Features guide
│   │   ├── 01-hook-system.md  # Post-write hooks only
│   │   ├── 02-biome-validator.md   # Biome with version detection
│   │   ├── 03-typescript-validator.md  # TypeScript checking
│   │   ├── 04-ai-formatter.md      # AI-optimized output
│   │   └── 05-auto-fix-engine.md   # Sequential safe fixes
│   ├── implementation/         # Implementation phases
│   │   ├── CLAUDE.md          # Implementation guide
│   │   ├── phase-1-infrastructure.md  # Core setup with pnpm
│   │   ├── phase-2-validators.md      # Biome & TypeScript
│   │   ├── phase-3-auto-fix.md        # Auto-fix implementation
│   │   ├── phase-4-ai-output.md       # AI formatting
│   │   └── phase-5-testing.md         # Testing strategy
│   └── reference/              # External references
│       ├── CLAUDE.md          # Reference guide
│       └── HOOKS.md           # Link to Anthropic docs
└── IDEAS/                      # Future features (v2+)
    ├── CLAUDE.md              # Ideas structure guide
    └── v2-features/           # Deferred complex features

```

## Quick Navigation

### For Understanding the Project
1. Start with [docs/README.md](docs/README.md) - Project overview
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
3. Review [docs/config/configuration-guide.md](docs/config/configuration-guide.md) - The 10 config options

### For Development
1. Read [docs/DEVELOPMENT-SETUP.md](docs/DEVELOPMENT-SETUP.md) - pnpm setup and libraries
2. Follow [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Implementation phases
3. Start with [docs/implementation/phase-1-infrastructure.md](docs/implementation/phase-1-infrastructure.md)

### For Configuration
1. See [docs/config/example-config.yaml](docs/config/example-config.yaml) - Minimal config
2. Read [docs/config/configuration-guide.md](docs/config/configuration-guide.md) - All options explained

### For Features
1. [docs/features/01-hook-system.md](docs/features/01-hook-system.md) - How hooks work
2. [docs/features/02-biome-validator.md](docs/features/02-biome-validator.md) - Biome integration
3. [docs/features/03-typescript-validator.md](docs/features/03-typescript-validator.md) - TypeScript checking

## Important Development Notes

### Package Management
- **Development**: Use pnpm (v10.14.0) via Corepack
- **End Users**: Use npx (no installation needed)
- **Never**: Install as project dependency

### Key Libraries (Verified Versions)
- `commander@14.0.0` - CLI framework
- `yaml@2.8.1` - Config parsing
- `zod@4.0.15` - Runtime validation
- `execa@9.6.0` - Process execution (Biome version detection)
- `fast-glob@3.3.3` - File pattern matching
- `tsup@8.5.0` - TypeScript bundler
- `vitest@3.2.4` - Testing framework
- `@biomejs/biome@2.1.3` - Code quality

### Configuration File
The tool requires `claude-jsqualityhooks.config.yaml` in the project root. Without it, the tool exits gracefully with instructions.

### Biome Version Detection
The key v1 feature - automatically detects and adapts to:
- Biome 1.x: Uses `--apply` flag
- Biome 2.x: Uses `--write` flag

## Testing Commands

When testing the implementation:

```bash
# Run with pnpm (development)
pnpm test
pnpm typecheck
pnpm lint
pnpm format

# End users will use npx
npx claude-jsqualityhooks init
npx claude-jsqualityhooks install
```

## v1 Scope Reminder

**IN v1:**
- Post-write hooks only
- 10 configuration options
- Biome version auto-detection
- TypeScript validation
- AI-optimized output
- Sequential auto-fix

**NOT in v1 (moved to IDEAS/):**
- Pre-write hooks
- Hook customization
- Performance tuning
- Notification customization
- Severity levels
- Fix priorities
- Multiple config locations
- Complex strategies

## Common Tasks

### Adding a New Feature
1. Check if it belongs in v1 (simplicity first)
2. If complex, document in IDEAS/v2-features/
3. If simple, implement following the phases in docs/implementation/

### Updating Documentation
1. Keep v1 scope in mind
2. Update relevant CLAUDE.md files
3. Ensure consistency across all docs

### Testing Changes
1. Use pnpm for all development
2. Test with both Biome 1.x and 2.x
3. Verify AI output format (no ANSI codes)

## Questions to Ask

When implementing:
1. Does this feature require more than the 10 config options?
2. Can this be handled with smart defaults?
3. Is this essential for v1 or can it wait?
4. Does this maintain backward compatibility?

## Remember

This is documentation for a tool that **does not exist yet**. The documentation is being created first to guide the implementation. All code examples are specifications, not existing code.