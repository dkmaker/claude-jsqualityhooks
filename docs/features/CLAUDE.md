# Features Documentation Guide

## Overview

This directory contains detailed documentation for each major feature of claude-jsqualityhooks.

## Files

### 01-hook-system.md
Core hook integration with Claude Code. Covers:
- PostToolUse hook implementation
- File change detection
- Hook lifecycle and execution flow
- Error handling and recovery

### 02-biome-validator.md
Biome linting and formatting integration. Covers:
- Version detection (1.x vs 2.x)
- Command execution strategies
- Configuration discovery
- Error parsing and reporting

### 03-typescript-validator.md  
TypeScript type checking integration. Covers:
- Compiler API usage
- tsconfig.json discovery
- Incremental checking
- Error formatting

### 04-ai-formatter.md
AI-optimized output formatting. Covers:
- ANSI code stripping
- Structured error messages
- Clear action items
- Context preservation

### 05-auto-fix-engine.md
Automatic issue resolution. Covers:
- Safe fix application
- Sequential processing
- Conflict avoidance
- Fix verification

## Feature Dependencies

```
Hook System (01)
    ├── Biome Validator (02)
    ├── TypeScript Validator (03)
    └── Auto-Fix Engine (05)
            └── AI Formatter (04)
```

## Architecture

Features work together in this order:
1. Hook system provides the foundation
2. Validators add checking capabilities
3. TypeScript adds type validation
4. AI formatter ensures clean output
5. Auto-fix adds remediation

## Key Design Decisions

### Post-Write Only
All validation happens after files are written, ensuring:
- Complete file context
- Valid syntax checking
- Reliable error detection

### Parallel Validation
Biome and TypeScript run in parallel for performance.

### Sequential Fixes
Auto-fixes apply one at a time to avoid conflicts.

### Version Detection
Biome version is auto-detected to handle API differences.

## Testing Each Feature

### Hook System
Test with mock Claude Code inputs and file operations.

### Validators
Test with sample files containing known issues.

### AI Formatter
Test output formatting with various error types.

### Auto-Fix
Test fix application and verification.

## Common Patterns

### Error Handling
All features use consistent error handling with fallbacks.

### Logging
Debug logging available but disabled by default.

### Performance
Features optimize for minimal latency.

## Feature Configuration

Each feature respects the configuration options:
- Enable/disable switches
- Custom config paths
- File patterns
- Auto-fix control

## Integration Points

### With Claude Code
- Receives hook input via stdin
- Returns results via stdout
- Exit codes indicate status

### With Each Other
- Validators feed the auto-fix engine
- AI formatter processes all output
- Hook system orchestrates everything