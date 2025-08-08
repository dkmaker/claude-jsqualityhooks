# Development Setup Guide

## Package Manager: pnpm with Corepack

This project uses **pnpm** managed through Corepack for consistent dependency management across all development environments.

### Why pnpm?

- **Disk efficiency**: Shared dependency storage saves gigabytes
- **Speed**: Up to 3x faster than npm
- **Strict**: Prevents phantom dependencies
- **Workspace support**: Future monorepo compatibility
- **Lockfile**: More reliable than npm

### Setting Up pnpm with Corepack

```bash
# 1. Ensure Node.js 18+ is installed
node --version  # Should output v18.0.0 or higher

# 2. Enable Corepack (included with Node.js)
corepack enable

# 3. Prepare the specific pnpm version
corepack prepare pnpm@latest --activate

# 4. Verify installation
pnpm --version  # Should output latest version
```

## Dependencies

Key package dependencies:

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `commander` | 14.0.0 | CLI framework for commands |
| `yaml` | 2.8.1 | Parse YAML config files |
| `zod` | 4.0.15 | Runtime type validation |
| `execa` | 9.6.0 | Execute Biome/TS commands |
| `fast-glob` | 3.3.3 | File pattern matching |
| `chalk` | 5.5.0 | Terminal colors (dev mode) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.9.2 | TypeScript compiler |
| `tsup` | 8.5.0 | Fast TS bundler |
| `@biomejs/biome` | 2.1.3 | Linting & formatting |
| `vitest` | 3.2.4 | Testing framework |
| `@types/node` | 20.11.0 | Node.js types |

## Library Selection Rationale

### Core CLI & Configuration

#### `commander@14.0.0` - CLI Framework
- **Why chosen**: Industry standard for Node.js CLI applications
- **Usage**: Powers the essential commands: `init`, `install`, `version`
- **Key features**: 
  - TypeScript support out of the box
  - Automatic help generation
  - Subcommand support for future expansion
- **Alternatives considered**: 
  - `yargs` - More complex, overkill for 3 commands
  - `minimist` - Too basic, no TypeScript support
  - Native Node.js - Would require building all CLI features from scratch

#### `yaml@2.8.1` - Configuration Parser
- **Why chosen**: Only mature YAML parser with full YAML 1.2 support
- **Usage**: Parses the required `claude-jsqualityhooks.config.yaml` file
- **Key features**:
  - Preserves comments (important for config documentation)
  - Excellent error messages with line numbers
  - Small bundle size (87kb)
- **Alternatives considered**:
  - `js-yaml` - Older, doesn't preserve comments
  - JSON config - Less human-friendly, no comments
  - TOML - Less familiar to most developers

#### `zod@4.0.15` - Configuration Validation
- **Why chosen**: Runtime validation with TypeScript type inference
- **Usage**: Validates the configuration options
- **Key features**:
  - Generates TypeScript types from schemas
  - Excellent error messages for invalid configs
  - Tree-shakeable for smaller bundles
- **Alternatives considered**:
  - `joi` - No TypeScript inference
  - `ajv` - JSON Schema based, more complex
  - Manual validation - Error-prone, poor DX

### Biome Version Detection

#### `execa@9.6.0` - Process Execution
- **Why chosen**: Modern subprocess handling with proper TypeScript types
- **Usage**: Essential for Biome version detection and command execution
- **Key features**:
  - Handles different Biome version command differences
  - Proper stderr/stdout separation for parsing Biome output
  - Automatic escaping prevents command injection
  - Promise-based API with proper cleanup
- **Alternatives considered**:
  - `child_process` - No TypeScript, manual escaping needed
  - `cross-spawn` - Older, less features
  - `shelljs` - Synchronous, blocks event loop

### File Pattern Matching

#### `fast-glob@3.3.3` - File Globbing
- **Why chosen**: Fastest glob implementation, used by ESLint and Prettier
- **Usage**: Implements `include` and `exclude` patterns from config
- **Key features**:
  - 10x faster than `node-glob`
  - Supports advanced patterns like `src/**/*.{ts,tsx}`
  - Proper ignore handling for `node_modules`
  - Stream API for large projects
- **Alternatives considered**:
  - `glob` - Much slower, being deprecated
  - `globby` - Just a wrapper around fast-glob
  - `picomatch` - Lower level, more work needed

### Development Experience

#### `chalk@5.5.0` - Terminal Styling
- **Why chosen**: De facto standard for terminal colors
- **Usage**: Development mode logging only (not in production)
- **Key features**:
  - Auto-detects color support
  - Tree-shakeable
  - No dependencies
- **Note**: User output is plain text for AI parsing

### Build & Development Tools

#### `tsup@8.5.0` - TypeScript Bundler
- **Why chosen**: Zero-config bundler optimized for TypeScript libraries
- **Usage**: Builds both ESM and CJS outputs for maximum compatibility
- **Key features**:
  - Uses esbuild (100x faster than webpack)
  - Automatic code splitting
  - Built-in minification
  - Declaration file generation
- **Alternatives considered**:
  - `webpack` - Too complex for a CLI tool
  - `rollup` - More configuration needed
  - `esbuild` - Direct use requires more setup
  - `tsc` alone - No bundling, larger output

#### `vitest@3.2.4` - Testing Framework
- **Why chosen**: Native ESM support, Jest-compatible, extremely fast
- **Usage**: Tests all features including Biome version detection
- **Key features**:
  - 10x faster than Jest
  - Built-in TypeScript support
  - Watch mode with HMR
  - Compatible with Jest assertions
- **Alternatives considered**:
  - `jest` - Slower, complex ESM setup
  - `mocha` - Requires multiple tools (chai, sinon)
  - `node:test` - Too new, limited ecosystem

#### `@biomejs/biome@2.1.3` - Code Quality
- **Why chosen**: Same tool users will use, ensures compatibility
- **Usage**: Formats and lints the codebase
- **Key features**:
  - Tests our own Biome integration
  - Fast (Rust-based)
  - Single tool instead of ESLint + Prettier
- **Note**: We support multiple Biome versions for users

## Bundle Size Considerations

Total production dependencies size: ~400KB
- Acceptable for CLI tool via npx
- Most of the size is `execa` and `fast-glob` which are essential
- No bloated dependencies included
- Tree-shaking removes unused code

## Security Considerations

All chosen libraries:
- Are actively maintained (updated within last 3 months)
- Have no known critical vulnerabilities
- Are from reputable authors/organizations
- Have been audited via `npm audit`
- Use modern security practices

## Project Configuration Files

### package.json Configuration

```json
{
  "packageManager": "pnpm@10.14.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

### .npmrc Configuration

Create `.npmrc` to enforce pnpm:
```
engine-strict=true
auto-install-peers=true
shamefully-hoist=false
```

### .nvmrc Configuration

Create `.nvmrc` for Node version:
```
18.20.0
```

## Development Commands

All commands use pnpm (NOT npm):

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Development mode with watch
pnpm dev

# Run tests
pnpm test
pnpm test:watch
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting and formatting
pnpm lint
pnpm format
```

## IDE Setup

### VS Code

Install recommended extensions:
- Biome (official)
- TypeScript and JavaScript Language Features

Add to `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

## Important Notes

### For Development (uses pnpm)

- Clone repository
- Use pnpm for all operations
- Enable Corepack first
- All scripts use pnpm

### For End Users (uses npx)

- NO installation required
- Always use `npx claude-jsqualityhooks`
- Never use pnpm as an end user
- Never install globally

## Quick Start for Contributors

```bash
# One-time setup
corepack enable
corepack prepare pnpm@latest --activate

# Clone and develop
git clone https://github.com/dkmaker/claude-jsqualityhooks
cd claude-jsqualityhooks
pnpm install
pnpm build
pnpm test
```

## Troubleshooting

### Corepack not found

If `corepack` command is not found:
```bash
# Install/update Node.js to v18+
# Or enable corepack manually:
npm install -g corepack
```

### Wrong pnpm version

If pnpm version doesn't match:
```bash
corepack prepare pnpm@latest --activate
corepack use pnpm@10.14.0
```

### Permission errors

On Unix systems:
```bash
sudo corepack enable
```

On Windows (run as Administrator):
```powershell
corepack enable
```