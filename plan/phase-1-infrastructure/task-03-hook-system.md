# Task 3: Hook System Base

## Task Overview
Create the base hook architecture that will process Claude Code events, manage validators, and coordinate the validation pipeline.

## References
- Primary: `docs/implementation/phase-1-infrastructure.md#L179-L237`
- Hook Feature: `docs/features/01-hook-system.md`
- Architecture: `docs/ARCHITECTURE.md#L41-L52`
- Interfaces: `docs/api/interfaces.md#L130-L144`

## Prerequisites
- [ ] Task 1 (Project Setup) completed
- [ ] Task 2 (Config Loader) completed
- [ ] Type definitions available
- [ ] Config loading working

## Implementation TODOs

### 1. Create Base Hook Class
- [ ] Create src/hooks/BaseHook.ts
- [ ] Define abstract Hook class
- [ ] Add name property
- [ ] Add execute method signature
- [ ] Include timeout handling (5s default)
- [ ] Add failure strategy (warn, don't block)
- Reference: `docs/implementation/phase-1-infrastructure.md#L181-L206`

### 2. Implement Timeout Wrapper
- [ ] Create withTimeout method
- [ ] Use Promise.race pattern
- [ ] Default timeout: 5000ms
- [ ] Return timeout error gracefully
- Reference: `docs/features/01-hook-system.md#L49-L52`

### 3. Create Hook Manager
- [ ] Create src/hooks/HookManager.ts
- [ ] Accept Config in constructor
- [ ] Initialize hooks Map
- [ ] Add hook registration method
- [ ] Add execution methods
- Reference: `docs/implementation/phase-1-infrastructure.md#L209-L237`

### 4. Implement PostWrite Hook
- [ ] Create src/hooks/PostWriteHook.ts
- [ ] Extend BaseHook
- [ ] Implement execute method
- [ ] Add file validation check
- [ ] Prepare for validator integration
- Reference: `docs/features/01-hook-system.md#L19-L39`

### 5. Add File Pattern Matching
- [ ] Implement shouldValidate method
- [ ] Use fast-glob for pattern matching
- [ ] Apply include patterns
- [ ] Apply exclude patterns
- [ ] Use defaults if not specified
- Reference: `docs/features/01-hook-system.md#L59-L72`

### 6. Create Hook Input Handler
- [ ] Create src/hooks/InputHandler.ts
- [ ] Parse Claude Code JSON input
- [ ] Extract file information
- [ ] Handle stdin input
- [ ] Validate input structure
- Reference: `docs/api/interfaces.md#L95-L110`

### 7. Add Hook Result Types
- [ ] Define HookResult interface
- [ ] Include success boolean
- [ ] Include modified boolean
- [ ] Include duration number
- [ ] Include optional validation data
- Reference: `docs/api/interfaces.md#L136-L142`

### 8. Implement Error Recovery
- [ ] Add try-catch in execute
- [ ] Log errors but continue
- [ ] Return partial results
- [ ] Never block operations
- [ ] Always notify Claude
- Reference: `docs/features/01-hook-system.md#L88-L93`

### 9. Add Default Patterns
- [ ] Define DEFAULT_INCLUDE array
- [ ] Add *.ts, *.tsx, *.js, *.jsx
- [ ] Define DEFAULT_EXCLUDE array
- [ ] Add node_modules/**, dist/**, build/**
- Reference: `docs/features/01-hook-system.md#L70-L72`

## Success Criteria
- [ ] BaseHook class compiles
- [ ] HookManager initializes
- [ ] PostWriteHook extends BaseHook
- [ ] Timeout handling works
- [ ] Pattern matching functional
- [ ] Error recovery verified
- [ ] Type safety maintained

## Testing Requirements
- [ ] Test hook registration
- [ ] Test timeout behavior
- [ ] Test pattern matching
- [ ] Test error recovery
- [ ] Test with mock input
- [ ] Test include/exclude logic
- [ ] Verify non-blocking behavior

## Notes for Implementation Agent
1. Start with BaseHook abstract class
2. Focus on extensibility for validators
3. Keep hooks stateless if possible
4. Use dependency injection for config
5. Prepare structure for parallel execution
6. Don't implement validators yet
7. Create placeholder for validator calls
8. Ensure all errors are caught