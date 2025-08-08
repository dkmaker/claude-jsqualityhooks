# System Architecture

**Project**: Claude JS Quality Hooks  
**Package**: `claude-jsqualityhooks`  
**Repository**: https://github.com/dkmaker/claude-jsqualityhooks  
**Developer**: DKMaker

## Overview

Claude JS Quality Hooks is built as a modular TypeScript application that intercepts file operations from Claude Code, validates the written content, applies automatic fixes, and reports results back to Claude in an AI-optimized format.

## Architecture Diagram

```
Claude Code API
     ↓
Hook Manager (Post-Write Only)
     ↓
┌─────────────────────────────────────────┐
│         Validation Pipeline              │
│  ┌─────────────┐  ┌──────────────┐      │
│  │   Biome     │  │  TypeScript  │      │
│  │  Validator  │  │  Validator   │      │
│  │             │  │              │      │
│  └─────────────┘  └──────────────┘      │
└─────────────────────────────────────────┘
     ↓              ↓              
┌─────────────────────────────────────────┐
│            Auto-Fix Engine               │
│                                         │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│      AI Output Formatter                 │
│                                         │
└─────────────────────────────────────────┘
     ↓
Claude Notification System
```

## Core Components

### 1. Hook Manager
**Location**: `src/hooks/`

Post-write hook handler:
- Captures post-write events only
- Routes to validators
- Uses smart defaults

### 2. Validation Pipeline
**Location**: `src/validators/`

Parallel validation:
- Runs Biome and TypeScript validators
- Biome version auto-detection
- Result aggregation

### 3. Fix Engine
**Location**: `src/fixers/`

Auto-fix system:
- Applies Biome fixes
- Applies TypeScript quick fixes
- Sequential application

### 4. AI Output Formatter
**Location**: `src/formatters/`

AI-optimized output:
- Parses JSON from validators
- Removes terminal decorations
- Creates structured responses
- Standardized format

### 5. Notification Service
**Location**: `src/notifications/`

Claude communication:
- File change notifications
- Error reporting
- Structured output

## Technology Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript
- **Validation Tools**:
  - TypeScript Compiler API for type checking
  - Biome for formatting and linting (auto-detected)
- **Configuration**: YAML for human-readable settings
- **Testing**: Jest/Vitest with full coverage
- **Build Tool**: esbuild/tsup for fast builds

## Project Structure

```
claude-jsqualityhooks/
├── src/
│   ├── hooks/
│   │   └── postWrite.ts         # Only post-write hook
│   ├── validators/
│   │   ├── biome/
│   │   │   ├── index.ts
│   │   │   ├── versionDetector.ts
│   │   │   ├── v1Adapter.ts
│   │   │   └── v2Adapter.ts
│   │   └── typescript.ts
│   ├── fixers/
│   │   └── autoFix.ts
│   ├── formatters/
│   │   └── aiOutputFormatter.ts
│   ├── config/
│   │   └── yamlConfigLoader.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
├── claude-jsqualityhooks.config.yaml
├── biome.json
├── tsconfig.json
├── package.json
└── README.md
```

## Data Flow

1. **Hook Trigger**: Claude writes/modifies a file
2. **File Interception**: Hook manager captures the file operation
3. **Validation**: File content sent to validation pipeline
4. **Issue Detection**: Validators identify problems
5. **Auto-Fix**: Fix engine applies safe corrections
6. **File Update**: Modified content written back to disk
7. **Formatting**: Results formatted for AI consumption
8. **Notification**: Claude receives structured feedback

## Performance

Performance optimizations use smart defaults:
- Validators run in parallel automatically
- Biome version cached per session
- Debouncing for rapid changes
- Handled internally with minimal configuration

## Error Handling

Robust error handling:
- Always warns, never blocks
- Continues with remaining validators if one fails
- Reports partial results
- Comprehensive error logging

## Security Considerations

- No execution of untrusted code
- Sandboxed validation processes
- File system access restrictions
- Sensitive data filtering in logs