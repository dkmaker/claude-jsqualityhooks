# Implementation Guides

## Overview

This directory contains phase-by-phase implementation guides for building claude-jsqualityhooks. Each phase builds on the previous one, creating a complete system.

## Files

### phase-1-infrastructure.md
Core project setup and foundation. Covers:
- TypeScript project initialization
- pnpm setup with Corepack
- YAML configuration loader
- Base hook classes
- Claude Code API integration

### phase-2-validators.md
Biome and TypeScript validator implementation. Covers:
- Biome version detection logic
- Adapter factory pattern
- TypeScript Compiler API integration
- Parallel execution strategy
- Error collection and formatting

### phase-3-auto-fix.md
Automatic fix implementation. Covers:
- Safe fix identification
- Priority-based fix ordering
- Conflict detection and resolution
- File backup and rollback systems
- Fix verification processes

### phase-4-ai-output.md
AI-optimized output formatting. Covers:
- ANSI code removal
- Message simplification for AI
- Structured response formatting
- Issue grouping and categorization
- Claude-friendly notifications

### phase-5-testing.md
Comprehensive testing strategy. Covers:
- Unit test structure
- Integration test scenarios
- Mock Claude Code environment
- Performance benchmarks
- Production readiness checks

## Implementation Timeline

```
Phase 1: Infrastructure (2-3 days)
    ├── Project setup and configuration
    ├── Base architecture
    └── Hook registration system

Phase 2: Validators (3-4 days)
    ├── Biome integration
    ├── Version detection system
    └── TypeScript checking

Phase 3: Auto-Fix (2-3 days)
    ├── Fix engine implementation
    ├── Conflict resolution
    └── Backup/rollback system

Phase 4: AI Output (1-2 days)
    ├── Output formatting
    └── Claude integration

Phase 5: Testing (2-3 days)
    ├── Comprehensive test suite
    └── Performance optimization

Total: 10-15 days
```

## Development Workflow

### Starting a Phase
1. Read the phase guide completely
2. Set up the required dependencies
3. Create the file structure
4. Implement core functionality
5. Add unit tests
6. Document any deviations

### Between Phases
1. Run all tests
2. Update documentation
3. Commit changes
4. Review next phase requirements

## Key Technologies

### Build Tools
- **tsup**: Fast TypeScript bundler
- **vitest**: Testing framework
- **pnpm**: Package manager

### Core Libraries
- **commander**: CLI framework
- **yaml**: Configuration parsing
- **zod**: Runtime validation
- **execa**: Process execution
- **fast-glob**: File matching

### Development Dependencies
- **TypeScript**: Type checking
- **Biome**: Code quality
- **Node.js**: Runtime (v18+)

## Common Implementation Patterns

### Error Handling
```typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', error);
  return { success: false, error };
}
```

### Adapter Factory Pattern
```typescript
const version = await detectVersion();
const adapter = AdapterFactory.create(version);
```

### Parallel Processing
```typescript
const results = await Promise.allSettled([
  validateBiome(file),
  validateTypeScript(file)
]);
```

## Testing Strategy

### Unit Tests
Each component has dedicated unit tests with mocks.

### Integration Tests
End-to-end scenarios testing the complete flow.

### Performance Tests
Benchmarks for large files and multiple files.

## Debugging Tips

### Enable Debug Logging
Set `logLevel: 'debug'` in configuration.

### Test Individual Components
Use focused tests: `pnpm test:unit path/to/test`

### Mock Claude Input
Use test fixtures for hook input simulation.

### Performance Profiling
Use Node.js built-in profiler: `node --prof dist/index.js`

## Common Pitfalls

### Version Detection
Always handle detection failure with appropriate fallbacks.

### File System Operations
Use absolute paths and handle permissions properly.

### Process Execution
Set appropriate timeouts and handle both stdout and stderr.

### Memory Management
Dispose of resources properly, especially TypeScript programs.

### Configuration Validation
Validate all configuration inputs before using them.

## Success Metrics

Each phase is complete when:
- All tests pass with adequate coverage
- Documentation is complete and accurate
- Code follows established conventions
- Performance targets are met
- Integration with Claude Code is verified
- Error handling is comprehensive
- Security requirements are satisfied