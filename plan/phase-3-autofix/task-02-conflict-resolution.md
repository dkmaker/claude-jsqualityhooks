# Task 2: Conflict Resolution

## Task Overview
Implement conflict detection and resolution for scenarios where multiple fixes might interfere with each other.

## References
- Primary: `docs/implementation/phase-3-auto-fix.md`
- Fix Order: `docs/features/01-hook-system.md#L55`
- Sequential: `docs/features/05-auto-fix-engine.md`

## Prerequisites
- [ ] Task 1 (Fix Engine) completed
- [ ] Fix application working
- [ ] File I/O operational

## Implementation TODOs

### 1. Create Conflict Resolver
- [ ] Create src/fixers/ConflictResolver.ts
- [ ] Add detectConflicts method
- [ ] Add resolvePriority method
- [ ] Return ordered fix list
- Reference: `docs/implementation/phase-3-auto-fix.md`

### 2. Define Fix Priority Order
- [ ] Priority 1: Formatting fixes
- [ ] Priority 2: Import organization
- [ ] Priority 3: Safe lint fixes
- [ ] Priority 4: Other fixes
- [ ] Never: Unsafe fixes
- Reference: `docs/features/01-hook-system.md#L55`

### 3. Detect Overlapping Fixes
- [ ] Check line number ranges
- [ ] Identify overlapping regions
- [ ] Flag potential conflicts
- [ ] Group related fixes
- [ ] Mark conflict pairs

### 4. Implement Sequential Strategy
- [ ] Apply fixes one at a time
- [ ] Re-read file after each fix
- [ ] Update line numbers if needed
- [ ] Prevent parallel application
- [ ] Track application order
- Reference: `docs/features/05-auto-fix-engine.md`

### 5. Handle Line Number Shifts
- [ ] Track line changes after fixes
- [ ] Adjust subsequent fix positions
- [ ] Account for added/removed lines
- [ ] Maintain fix accuracy
- [ ] Log position adjustments

### 6. Create Fix Groups
- [ ] Group formatting fixes together
- [ ] Group import fixes together
- [ ] Group lint fixes by rule
- [ ] Apply groups sequentially
- [ ] Verify after each group

### 7. Add Rollback Capability
- [ ] Store original content
- [ ] Create restore method
- [ ] Rollback on critical failure
- [ ] Log rollback events
- [ ] Preserve file integrity

### 8. Implement Safe Mode
- [ ] Skip conflicting fixes
- [ ] Apply only guaranteed safe
- [ ] Log skipped fixes
- [ ] Report to user
- [ ] Prefer safety over coverage

### 9. Build Conflict Report
- [ ] List detected conflicts
- [ ] Show resolution decisions
- [ ] Include skipped fixes
- [ ] Add reasoning
- [ ] Format for logging

## Success Criteria
- [ ] Conflicts detected accurately
- [ ] Priority order respected
- [ ] Sequential application works
- [ ] No fix corruption
- [ ] Rollback functional
- [ ] Clear conflict reporting

## Testing Requirements
- [ ] Test overlapping fixes
- [ ] Test line number shifts
- [ ] Test rollback scenario
- [ ] Test fix groups
- [ ] Test priority ordering
- [ ] Mock complex conflicts

## Notes for Implementation Agent
1. Sequential is safer than parallel
2. Always have rollback ready
3. Priority order is critical
4. Test with real conflict scenarios
5. Log all conflict decisions
6. Prefer skipping over corruption
7. Keep original content safe