# System Architecture

## Overview

The Claude Code Hooks Format & Lint Validator is built as a modular TypeScript application that intercepts file operations from Claude Code, validates the written content, applies automatic fixes, and reports results back to Claude in an AI-optimized format.

## Architecture Diagram

```
Claude Code API
     ↓
Hook Manager (TypeScript)
     ↓
┌────────────┬──────────────┬──────────────┐
│ Post-Write │   Pre-Read   │    Batch     │
│   Hook     │  Hook (opt)  │  Operation   │
└────────────┴──────────────┴──────────────┘
     ↓              ↓              ↓
┌─────────────────────────────────────────┐
│         Validation Pipeline              │
│  ┌─────────────┐  ┌──────────────┐      │
│  │   Biome     │  │  TypeScript  │      │
│  │  Validator  │  │  Validator   │      │
│  └─────────────┘  └──────────────┘      │
└─────────────────────────────────────────┘
     ↓              ↓              
┌─────────────────────────────────────────┐
│           Fix Engine                     │
│  ┌─────────────┐  ┌──────────────┐      │
│  │  Auto-Fix   │  │   Conflict   │      │
│  │   Manager   │  │   Resolver   │      │
│  └─────────────┘  └──────────────┘      │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│      AI Output Formatter                 │
│  ┌─────────────┐  ┌──────────────┐      │
│  │    JSON     │  │   Message    │      │
│  │   Parser    │  │  Simplifier  │      │
│  └─────────────┘  └──────────────┘      │
└─────────────────────────────────────────┘
     ↓
Claude Notification System
```

## Core Components

### 1. Hook Manager
**Location**: `src/hooks/`

Central orchestrator for all hook operations:
- Manages hook lifecycle and event handling
- Routes file operations to appropriate validators
- Handles error recovery and fallback strategies
- Maintains session state and caching

### 2. Validation Pipeline
**Location**: `src/validators/`

Parallel validation execution system:
- Configurable validation order and priority
- Result aggregation and conflict resolution
- Cache management for repeated validations
- Version detection for tool compatibility

### 3. Fix Engine
**Location**: `src/fixers/`

Intelligent code modification system:
- AST-based transformations for safe fixes
- Text-based fixes for formatting issues
- Conflict detection between multiple fixers
- Rollback capability for failed fixes

### 4. AI Output Formatter
**Location**: `src/formatters/`

Standardizes output for Claude consumption:
- Parses JSON output from Biome
- Formats TypeScript diagnostics
- Removes terminal decorations
- Creates structured responses

### 5. Notification Service
**Location**: `src/notifications/`

Communication layer with Claude:
- Real-time file change updates
- Detailed change logs and diffs
- Error reporting with suggestions
- Context synchronization

## Technology Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript 5.x
- **Validation Tools**:
  - TypeScript Compiler API for type checking
  - Biome 1.x or 2.x for formatting and linting (auto-detected)
- **Configuration**: YAML for human-readable settings
- **Testing**: Jest/Vitest with full coverage
- **Build Tool**: esbuild/tsup for fast builds

## Project Structure

```
claude-hooks-format-lint/
├── src/
│   ├── hooks/
│   │   ├── postWrite.ts
│   │   ├── preRead.ts
│   │   └── batchOperation.ts
│   ├── validators/
│   │   ├── biome/
│   │   │   ├── index.ts
│   │   │   ├── versionDetector.ts
│   │   │   ├── v1Adapter.ts
│   │   │   └── v2Adapter.ts
│   │   └── typescript.ts
│   ├── fixers/
│   │   ├── autoFix.ts
│   │   └── conflictResolver.ts
│   ├── formatters/
│   │   ├── aiOutputFormatter.ts
│   │   ├── biomeJsonParser.ts
│   │   └── typescriptFormatter.ts
│   ├── notifications/
│   │   └── claudeNotifier.ts
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
├── claude-hooks.config.yaml
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

## Performance Considerations

### Parallel Processing
- Validators run concurrently when possible
- Batch operations process multiple files simultaneously
- Worker threads for CPU-intensive operations

### Caching Strategy
- Version detection cached per session
- Validation results cached with TTL
- Configuration cached and watched for changes

### Optimization Techniques
- Incremental TypeScript compilation
- Debouncing for rapid file changes
- Lazy loading of validators
- Efficient diff algorithms

## Error Handling

### Graceful Degradation
- Fallback to warning mode if validation fails
- Continue with remaining validators if one fails
- Report partial results rather than failing completely

### Recovery Mechanisms
- Automatic retry with exponential backoff
- Rollback capability for failed fixes
- Session state preservation
- Detailed error logging

## Security Considerations

- No execution of untrusted code
- Sandboxed validation processes
- File system access restrictions
- Sensitive data filtering in logs