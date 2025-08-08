# Inter-Phase Dependencies

## Overview
This document maps dependencies between phases and tasks to ensure correct implementation order and prevent circular dependencies.

## Phase Dependencies Graph

```
Phase 1: Infrastructure
    ├── Phase 2: Validators
    │   ├── Phase 3: Auto-Fix
    │   └── Phase 4: AI Output
    └── Phase 5: Testing (requires all)
```

## Detailed Task Dependencies

### Phase 1: Infrastructure
**No external dependencies - Foundation phase**

#### Internal Dependencies
- Task 1 (Project Setup) → None
- Task 2 (Config Loader) → Task 1
- Task 3 (Hook System) → Task 1, Task 2
- Task 4 (CLI Foundation) → Task 1, Task 2

**Provides to other phases:**
- Config types and loader (all phases)
- Hook base classes (Phase 2)
- CLI framework (all phases)
- Type definitions (all phases)

### Phase 2: Validators
**Depends on Phase 1 completion**

#### Internal Dependencies
- Task 1 (Biome Detector) → Phase 1
- Task 2 (Biome Adapters) → Task 1
- Task 3 (TypeScript Validator) → Phase 1 (parallel with Task 1, 2)
- Task 4 (Parallel Execution) → Task 2, Task 3

**Provides to other phases:**
- Validation results (Phase 3, 4)
- Issue detection (Phase 3)
- Biome adapter (Phase 3)
- Validator interfaces (Phase 5)

### Phase 3: Auto-Fix
**Depends on Phase 2 completion**

#### Internal Dependencies
- Task 1 (Fix Engine) → Phase 2
- Task 2 (Conflict Resolution) → Task 1
- Task 3 (Verification) → Task 1

**Provides to other phases:**
- Fixed content (Phase 4)
- Fix statistics (Phase 4)
- Fix results (Phase 5)

### Phase 4: AI Output
**Depends on Phase 2 completion**
**Can run parallel with Phase 3**

#### Internal Dependencies
- Task 1 (Output Parser) → Phase 2
- Task 2 (AI Formatter) → Task 1
- Task 3 (Claude Notifier) → Task 2

**Provides to other phases:**
- Formatted output (Phase 5)
- Claude integration (Phase 5)

### Phase 5: Testing
**Depends on all phases (1-4) completion**

#### Internal Dependencies
- Task 1 (Unit Tests) → Phases 1-4
- Task 2 (Integration Tests) → Task 1
- Task 3 (Performance Tests) → Task 1, Task 2

**Provides:**
- Quality assurance
- Performance validation
- Coverage reports

## Critical Path

The critical path for project completion:
1. Phase 1 (all tasks) - 12-14 hours
2. Phase 2, Task 1-2 (Biome setup) - 5-7 hours
3. Phase 3 or 4 (parallel) - 7-9 hours
4. Phase 5 (testing) - 8-11 hours

**Total critical path: 32-41 hours**

## Shared Components

### Used by Multiple Phases

#### Config System
- Used by: All phases
- Defined in: Phase 1, Task 2
- Interface: `docs/api/interfaces.md#L10-L34`

#### File Types
- Used by: Phase 1, 2, 3, 4
- Defined in: Phase 1, Task 2
- Interface: `docs/api/interfaces.md#L36-L41`

#### Validation Results
- Used by: Phase 2, 3, 4, 5
- Defined in: Phase 2
- Interface: `docs/api/interfaces.md#L48-L72`

#### Error Handling Pattern
- Used by: All phases
- Defined in: Phase 1
- Reference: `docs/ARCHITECTURE.md#L149-L162`

## Potential Conflicts

### Resource Conflicts
- File I/O: Phase 3 writes, Phase 2 reads
- Solution: Sequential processing

### Type Conflicts
- Validator results format must be consistent
- Solution: Shared interfaces in Phase 1

### Version Conflicts
- Biome 1.x vs 2.x commands
- Solution: Adapter pattern in Phase 2

## Dependency Validation Rules

### Before Starting a Phase
1. Verify all prerequisite phases complete
2. Check required interfaces available
3. Confirm shared components ready
4. Validate no circular dependencies

### During Implementation
1. Use only declared dependencies
2. Don't create backward dependencies
3. Maintain interface contracts
4. Document new dependencies

### After Completing a Phase
1. Verify all provided interfaces implemented
2. Check downstream phases unblocked
3. Update dependency graph if needed
4. Validate no broken contracts

## Notes for Implementation Agents

### Dependency Rules
1. Never create circular dependencies
2. Always check prerequisites
3. Use interfaces for loose coupling
4. Document any new dependencies
5. Verify contracts before using

### Parallel Work
- Phase 3 and 4 can work in parallel after Phase 2
- Within phases, some tasks can parallelize
- Always verify dependencies first

### Interface Stability
- Phase 1 interfaces are frozen after completion
- Changes require updating all dependent phases
- Prefer extending over modifying

## Review Checkpoint

Before marking a phase complete:
- [ ] All dependencies satisfied
- [ ] No circular references created
- [ ] Interfaces match documentation
- [ ] Downstream phases can proceed
- [ ] Shared components working
- [ ] No version conflicts