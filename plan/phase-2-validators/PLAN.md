# Phase 2: Validators - Implementation Plan

## Phase Overview
Implement Biome and TypeScript validators with automatic version detection, adapter pattern for different Biome versions, and parallel execution strategy.

## Phase Goals
1. Implement Biome version detection system
2. Create adapter pattern for Biome 1.x and 2.x
3. Integrate TypeScript Compiler API
4. Set up parallel validator execution
5. Implement error collection and formatting

## Tasks

### Task 1: Biome Version Detector
**File**: `plan/phase-2-validators/task-01-biome-detector.md`
**Duration**: 2-3 hours
**Dependencies**: Phase 1 complete

### Task 2: Biome Adapters
**File**: `plan/phase-2-validators/task-02-biome-adapters.md`
**Duration**: 3-4 hours
**Dependencies**: Task 1 complete

### Task 3: TypeScript Validator
**File**: `plan/phase-2-validators/task-03-typescript-validator.md`
**Duration**: 3-4 hours
**Dependencies**: Phase 1 complete

### Task 4: Parallel Execution
**File**: `plan/phase-2-validators/task-04-parallel-execution.md`
**Duration**: 2-3 hours
**Dependencies**: Task 2, Task 3 complete

## Success Criteria

### Must Have
- [ ] Biome version auto-detection working
- [ ] Biome 1.x commands use --apply flag
- [ ] Biome 2.x commands use --write flag
- [ ] TypeScript compilation API integrated
- [ ] Validators run in parallel
- [ ] JSON output parsed correctly
- [ ] Error handling non-blocking

### Should Have
- [ ] Version caching per session
- [ ] Custom config path support
- [ ] Detailed error messages
- [ ] Performance under 100ms per file

### Nice to Have
- [ ] Incremental TypeScript checking
- [ ] Validator result caching
- [ ] Progress indicators

## Key References

### Primary Documentation
- Implementation Guide: `docs/implementation/phase-2-validators.md`
- Biome Feature: `docs/features/02-biome-validator.md`
- TypeScript Feature: `docs/features/03-typescript-validator.md`

### Version Detection
- Detection Strategy: `docs/features/02-biome-validator.md#L28-L43`
- Version Differences: `docs/features/02-biome-validator.md#L19-L26`
- Adapter Pattern: `docs/features/02-biome-validator.md#L56-L97`

### Library Usage
- Execa for Commands: `docs/DEVELOPMENT-SETUP.md#L96-L109`
- TypeScript API: `docs/api/interfaces.md#L120-L128`

## Implementation Notes for Agent

1. **Create Your TODO List**
   - Track each validator separately
   - Include adapter implementations
   - Monitor version detection accuracy

2. **Critical Features**
   - Version detection MUST handle both 1.x and 2.x
   - MUST NOT block on validation failures
   - MUST parse JSON output correctly

3. **Testing Focus**
   - Test with both Biome versions
   - Test parallel execution
   - Test error scenarios
   - Mock subprocess calls

4. **Performance**
   - Cache version detection result
   - Run validators in parallel
   - Stream large outputs

## Phase Completion Checklist

- [ ] All 4 tasks completed
- [ ] Biome 1.x validation working
- [ ] Biome 2.x validation working
- [ ] TypeScript validation working
- [ ] Parallel execution verified
- [ ] Error handling tested
- [ ] Performance targets met
- [ ] Ready for Phase 3 auto-fix

## Handoff to Phase 3

When complete, Phase 3 can begin with:
- Working validators returning issues
- Parsed validation results
- Issue severity levels
- File modification detection