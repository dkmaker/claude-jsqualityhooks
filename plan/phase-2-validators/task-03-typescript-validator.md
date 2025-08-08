# Task 3: TypeScript Validator

## Task Overview
Implement TypeScript type checking using the TypeScript Compiler API to validate files and report type errors.

## References
- Primary: `docs/features/03-typescript-validator.md`
- Interfaces: `docs/api/interfaces.md#L120-L128`
- Architecture: `docs/ARCHITECTURE.md#L54-L56`
- Config: `docs/config/configuration-guide.md#L46-L48`

## Prerequisites
- [ ] Phase 1 completed
- [ ] TypeScript package installed
- [ ] Config loader working

## Implementation TODOs

### 1. Create TypeScript Validator Class
- [ ] Create src/validators/typescript/TypeScriptValidator.ts
- [ ] Implement Validator interface
- [ ] Name property: 'typescript'
- [ ] Add validate method
- [ ] Add tsconfig discovery
- Reference: `docs/api/interfaces.md#L120-L128`

### 2. Implement TSConfig Discovery
- [ ] Create findTsConfig function
- [ ] Check config.validators.typescript.configPath
- [ ] Fall back to ./tsconfig.json
- [ ] Use ts.findConfigFile if needed
- [ ] Handle missing tsconfig gracefully
- Reference: `docs/config/configuration-guide.md#L47-L48`

### 3. Create TypeScript Program
- [ ] Use ts.createProgram
- [ ] Load tsconfig.json settings
- [ ] Create compiler host
- [ ] Set up source file list
- [ ] Handle incremental compilation
- Reference: TypeScript Compiler API docs

### 4. Get Diagnostics
- [ ] Get semantic diagnostics
- [ ] Get syntactic diagnostics  
- [ ] Filter by current file
- [ ] Combine diagnostic arrays
- [ ] Sort by line/column
- Reference: `docs/api/interfaces.md#L126`

### 5. Format Diagnostics
- [ ] Convert ts.Diagnostic to ValidationIssue
- [ ] Extract file path
- [ ] Get line and column numbers
- [ ] Map diagnostic category to severity
- [ ] Format error messages
- [ ] Handle related information
- Reference: `docs/api/interfaces.md#L56-L65`

### 6. Map Severity Levels
- [ ] Error: ts.DiagnosticCategory.Error
- [ ] Warning: ts.DiagnosticCategory.Warning
- [ ] Info: ts.DiagnosticCategory.Message
- [ ] Info: ts.DiagnosticCategory.Suggestion
- [ ] Set fixed: false (no auto-fix)
- [ ] Set fixable: false

### 7. Handle Missing TypeScript
- [ ] Check if TypeScript available
- [ ] Return empty results if missing
- [ ] Log warning message
- [ ] Don't block validation
- Reference: `docs/ARCHITECTURE.md#L149-L162`

### 8. Optimize Performance
- [ ] Cache TypeScript program
- [ ] Use incremental compilation
- [ ] Only check changed files
- [ ] Dispose program when done
- [ ] Limit diagnostic count
- Reference: `docs/features/01-hook-system.md#L95-L101`

### 9. Add Timeout Protection
- [ ] Wrap validation in timeout
- [ ] Default 5 second timeout
- [ ] Return partial results on timeout
- [ ] Log timeout occurrence
- Reference: `docs/features/01-hook-system.md#L50`

## Success Criteria
- [ ] TypeScript errors detected
- [ ] Line/column numbers correct
- [ ] Custom tsconfig.json used
- [ ] Missing TypeScript handled
- [ ] Performance acceptable
- [ ] No memory leaks
- [ ] Timeout protection working

## Testing Requirements
- [ ] Test with type errors
- [ ] Test with syntax errors
- [ ] Test with clean file
- [ ] Test custom tsconfig path
- [ ] Test missing tsconfig
- [ ] Test timeout scenario
- [ ] Mock TypeScript API

## Notes for Implementation Agent
1. TypeScript Compiler API is complex
2. Start with basic diagnostics
3. Incremental compilation later
4. Focus on error detection first
5. Performance optimization can wait
6. Dispose resources properly
7. Cache program if possible