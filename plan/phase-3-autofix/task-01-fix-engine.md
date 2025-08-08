# Task 1: Fix Engine Core

## Task Overview
Implement the core auto-fix engine that applies Biome fixes to files using the appropriate adapter commands.

## References
- Primary: `docs/features/05-auto-fix-engine.md`
- Biome Commands: `docs/features/02-biome-validator.md#L19-L26`
- Architecture: `docs/ARCHITECTURE.md#L57-L65`
- Config: `docs/config/configuration-guide.md#L32-L33`

## Prerequisites
- [ ] Phase 2 completed
- [ ] Biome adapters working
- [ ] File I/O available

## Implementation TODOs

### 1. Create Fix Engine Class
- [ ] Create src/fixers/AutoFixEngine.ts
- [ ] Accept config in constructor
- [ ] Add applyFixes method
- [ ] Return fix results
- [ ] Track fixes applied
- Reference: `docs/features/05-auto-fix-engine.md`

### 2. Check Auto-Fix Config
- [ ] Read config.autoFix setting
- [ ] Return early if disabled
- [ ] Log when auto-fix skipped
- [ ] Respect user preference
- Reference: `docs/config/configuration-guide.md#L32-L33`

### 3. Filter Fixable Issues
- [ ] Check issue.fixable property
- [ ] Group issues by validator
- [ ] Count fixable vs unfixable
- [ ] Prioritize safe fixes
- [ ] Skip unsafe fixes
- Reference: `docs/api/interfaces.md#L64-L65`

### 4. Apply Biome Fixes
- [ ] Get Biome adapter instance
- [ ] Build fix command with adapter
- [ ] Use --write (v2) or --apply (v1)
- [ ] Execute with execa
- [ ] Capture fixed content
- Reference: `docs/features/02-biome-validator.md#L74-L97`

### 5. Sequential Fix Order
- [ ] Apply formatting fixes first
- [ ] Apply import organization second
- [ ] Apply lint fixes last
- [ ] Wait for each to complete
- [ ] Don't parallelize fixes
- Reference: `docs/features/01-hook-system.md#L55`

### 6. Read Fixed Content
- [ ] Read file after Biome fix
- [ ] Compare with original
- [ ] Detect if changes made
- [ ] Update file content
- [ ] Return new content
- Reference: `docs/ARCHITECTURE.md#L61-L62`

### 7. Track Fix Statistics
- [ ] Count total fixes attempted
- [ ] Count successful fixes
- [ ] Count failed fixes
- [ ] Track fix duration
- [ ] Build statistics object
- Reference: `docs/api/interfaces.md#L67-L72`

### 8. Handle Fix Failures
- [ ] Catch command errors
- [ ] Log fix failures
- [ ] Continue with next fix
- [ ] Return partial success
- [ ] Never lose original content
- Reference: `docs/ARCHITECTURE.md#L149-L162`

### 9. Build Fix Result
- [ ] Create FixResult object
- [ ] Include modified content
- [ ] List fixes applied
- [ ] Add statistics
- [ ] Include any errors
- Reference: `docs/api/interfaces.md#L142-L144`

## Success Criteria
- [ ] Biome fixes apply correctly
- [ ] Version-specific commands used
- [ ] File content updated
- [ ] Sequential order maintained
- [ ] Statistics accurate
- [ ] Errors handled gracefully
- [ ] No content loss

## Testing Requirements
- [ ] Test with Biome 1.x
- [ ] Test with Biome 2.x
- [ ] Test format fixes
- [ ] Test lint fixes
- [ ] Test with no fixable issues
- [ ] Test with fix failures
- [ ] Mock file operations

## Notes for Implementation Agent
1. Safety is paramount - no data loss
2. Sequential fixes avoid conflicts
3. Always read file after fix
4. Biome modifies file directly
5. Track every fix attempt
6. Handle partial success
7. Version detection critical