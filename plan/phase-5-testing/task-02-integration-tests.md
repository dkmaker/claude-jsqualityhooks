# Task 2: Integration Tests

## Task Overview
Create integration tests that verify the complete pipeline from Claude input to formatted output.

## References
- Primary: `docs/implementation/phase-5-testing.md`
- Hook Flow: `docs/features/01-hook-system.md#L19-L39`
- Claude Input: `docs/CLI.md#L146-L150`
- E2E Flow: `docs/ARCHITECTURE.md#L130-L138`

## Prerequisites
- [ ] Task 1 (Unit Tests) completed
- [ ] Components integrated
- [ ] Test fixtures ready

## Implementation TODOs

### 1. Create Test Fixtures
- [ ] Create tests/fixtures/ directory
- [ ] Add sample TypeScript files with errors
- [ ] Add sample JavaScript files
- [ ] Add clean files
- [ ] Create Claude input JSON samples
- [ ] Add expected output samples
- Reference: `docs/CLI.md#L146-L150`

### 2. Test Complete Hook Flow
- [ ] Create tests/integration/hookFlow.test.ts
- [ ] Test Claude input processing
- [ ] Test file validation
- [ ] Test auto-fix application
- [ ] Test output formatting
- [ ] Verify Claude response
- Reference: `docs/features/01-hook-system.md#L19-L39`

### 3. Test Biome Integration
- [ ] Create tests/integration/biome.test.ts
- [ ] Test with Biome 1.x
- [ ] Test with Biome 2.x
- [ ] Test version detection
- [ ] Test fix application
- [ ] Use real Biome if available

### 4. Test TypeScript Integration
- [ ] Create tests/integration/typescript.test.ts
- [ ] Test with real TS files
- [ ] Test tsconfig discovery
- [ ] Test error detection
- [ ] Test with complex types
- [ ] Verify diagnostics

### 5. Test Parallel Validation
- [ ] Create tests/integration/parallel.test.ts
- [ ] Test both validators together
- [ ] Test one validator failing
- [ ] Test performance
- [ ] Verify parallel execution
- [ ] Check result merging

### 6. Test CLI Commands E2E
- [ ] Create tests/integration/cli.test.ts
- [ ] Test init creates config
- [ ] Test install modifies settings
- [ ] Test version shows info
- [ ] Test with real file system
- [ ] Verify file changes

### 7. Test Error Scenarios
- [ ] Create tests/integration/errors.test.ts
- [ ] Test missing config file
- [ ] Test invalid input
- [ ] Test validator failures
- [ ] Test file write errors
- [ ] Verify graceful handling
- Reference: `docs/ARCHITECTURE.md#L149-L162`

### 8. Test Fix and Verify Flow
- [ ] Create tests/integration/autofix.test.ts
- [ ] Test fix application
- [ ] Test verification after fix
- [ ] Test partial fixes
- [ ] Test rollback scenarios
- [ ] Verify file integrity

### 9. Test Output Pipeline
- [ ] Create tests/integration/output.test.ts
- [ ] Test JSON parsing
- [ ] Test ANSI removal
- [ ] Test Claude formatting
- [ ] Test stdout output
- [ ] Verify clean JSON

## Success Criteria
- [ ] Full pipeline tested
- [ ] Real tools tested
- [ ] Error flows verified
- [ ] Performance acceptable
- [ ] No integration issues
- [ ] Claude format validated

## Testing Requirements
- [ ] Test with real files
- [ ] Test actual tools
- [ ] Verify file changes
- [ ] Check performance
- [ ] Test error recovery
- [ ] Validate output format

## Notes for Implementation Agent
1. Integration tests can be slower
2. Use real tools when possible
3. Test the full flow
4. Verify actual file changes
5. Test with realistic scenarios
6. Check Claude compatibility
7. Monitor test duration