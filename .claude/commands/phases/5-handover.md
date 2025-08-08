---
description: Complete current phase and create handover documentation for next phase
argument-hint: [phase-folder]
allowed-tools: Read, Write, Bash, TodoWrite
---

# Phase Handover

## ARGUMENTS Section

The provided argument is: `$ARGUMENTS`

### Validation and Extraction
Validate that the argument matches one of:
- `phase-1-infrastructure`
- `phase-2-validators`
- `phase-3-autofix`
- `phase-4-ai-output`
- `phase-5-testing`

If invalid, stop and report an error.

### Extract Values
- **PHASE_FOLDER**: The full folder name (same as the argument)
- **PHASE_NUMBER**: Just the phase number (e.g., `phase-1`)
- **PHASE_NAME**: The descriptive part (e.g., `infrastructure`)
- **BRANCH_NAME**: The git branch (e.g., `feature/phase-1`)

### Usage Note
Throughout this command, replace the bracketed placeholders with the extracted values:
- `[PHASE_FOLDER]` → use the full folder name
- `[PHASE_NUMBER]` → use just the phase number
- `[BRANCH_NAME]` → use the branch name
- `[PHASE_NAME]` → use the descriptive name

For bash commands, use the actual extracted values, not variables.

## Handover Process

### 1. Verify Phase Completion

Use **phase-orchestrator** agent to check:
- All tasks in TodoWrite marked complete
- Success criteria from @plan/[PHASE_FOLDER]/PLAN.md met
- Validation passed (`/phases:3-validate` succeeded)
- Tests documented (`/phases:4-test` completed)

### 2. Identify Next Phase

Determine the next phase based on dependencies:
```
Phase 1 → Phase 2
Phase 2 → Phase 3 and/or Phase 4 (parallel possible)
Phase 3 → Phase 5 (if Phase 4 complete)
Phase 4 → Phase 5 (if Phase 3 complete)
Phase 5 → Project Complete
```

### 3. Create Handover Document

Use **phase-orchestrator** agent to create:

File: `plan/handovers/[PHASE_NUMBER]-to-[next-phase].md`

```markdown
# Phase [PHASE_FOLDER] to [Next Phase] Handover

## Phase Summary
**Phase**: [PHASE_FOLDER]
**Completed**: [Date]
**Duration**: [Actual time taken]
**Status**: COMPLETE

## Completed Items

### Task Implementations
- ✅ [Task 1 name] - [Brief description]
- ✅ [Task 2 name] - [Brief description]
- ✅ [Task 3 name] - [Brief description]

### Key Files Created/Modified
- `src/[file]` - [Purpose]
- `tests/[file]` - [Purpose]

### Success Criteria Achieved
**Must Have:**
- ✅ [Criteria met]

**Should Have:**
- ✅ [Criteria met]
- ⚠️ [Criteria partial] - [Note]

## Deferred Items

### For Next Phase
- [ ] [Item description] - Blocked by [reason]
- [ ] [Test description] - Requires [component]

### For Future Phases
- [ ] [Item] - Target: Phase [X]

## Known Issues

### Non-Blocking Issues
- [Issue description] - Workaround: [solution]

### Technical Debt
- [Debt item] - Suggested fix: [approach]

## Integration Points

### APIs/Interfaces Ready
- [Interface name] - Location: src/[path]
- [Type definition] - Location: src/types/[file]

### Required by Next Phase
- [Component/Interface needed]
- [Configuration available]
- [Test fixtures prepared]

## Testing Status

### Tests Created
- Unit tests: [count]
- Integration tests: [count]
- Coverage: [percentage if available]

### Tests Deferred
- [Test type] - Waiting for [dependency]

## Configuration Changes
- [Any config options added/modified]

## Dependencies Installed
```json
{
  "dependencies": {
    // Any new production deps
  },
  "devDependencies": {
    // Any new dev deps
  }
}
```

## Build/Runtime Changes
- [Any changes to build process]
- [Any changes to runtime behavior]

## Next Phase Prerequisites

### Ready for Phase [X]
- ✅ [Prerequisite met]
- ✅ [Dependency available]

### Action Items for Next Phase
1. [Specific action needed]
2. [Configuration to update]
3. [Test to implement]

## Notes for Next Phase Implementation

### Key Patterns Established
- [Pattern name] - Usage: [description]

### Gotchas/Warnings
- [Warning about specific issue]
- [Compatibility note]

### Suggested Approach
[Recommendations for next phase]
```

### 4. Validate Phase Quality

Use **quality-guardian** agent to verify all success criteria:

```bash
# Run quality validation
# The quality-guardian agent will check:
# - All TODOs completed
# - Success criteria met  
# - Code standards followed
# - No scope creep
# - Performance targets achieved
```

Use **test-engineer** agent to verify test coverage:

```bash
# Run test validation
# The test-engineer agent will check:
# - Coverage requirements met (>80%)
# - All test categories covered
# - No failing tests
# - Performance benchmarks pass
```

### 5. Request Merge Approval

Present validation results and request user approval:

```markdown
## Phase [PHASE_FOLDER] Validation Complete

### Quality Check Results
[Quality guardian output showing success criteria status]

### Test Coverage Results  
[Test engineer output showing coverage metrics]

### What Will Be Merged
- Branch: [BRANCH_NAME]
- Target: main
- Files changed: [count]
- Tests added: [count]
- Coverage: [percentage]

### Impact Summary
- New features: [list key additions]
- Configuration: [any config changes]
- Dependencies: [any new dependencies]

## Ready to merge to main?

This will:
1. Commit all pending changes
2. Merge [BRANCH_NAME] into main
3. Push to origin/main
4. Optionally delete the feature branch

**Approve merge to main? [Y/N]:**
```

If user rejects:
- Continue with feature branch
- Document reason in handover
- Provide manual merge instructions

### 6. Execute Merge (if approved)

If user approves the merge:

```bash
# Commit phase changes first
`git add -A`
`git commit -m "feat([PHASE_FOLDER]): Complete phase implementation

- All success criteria met
- Quality validation passed
- Test coverage achieved
- Ready for production"`

# Fetch latest main
`git fetch origin main`

# Switch to main and merge
`git checkout main`
`git merge --no-ff [BRANCH_NAME] -m "merge: Complete [PHASE_FOLDER] phase

Quality validated by quality-guardian
Tests validated by test-engineer
Approved by user"`

# Push to origin
`git push origin main`

# Optionally delete feature branch
# Ask user: "Delete feature branch? [Y/N]"
# If yes:
`git branch -d [BRANCH_NAME]`
`git push origin --delete [BRANCH_NAME]`
```

### 7. Commit Phase Changes (if merge rejected)

If merge was rejected, commit to feature branch only:

```bash
# Stage all changes
`git add -A`

# Create commit
`git commit -m "feat([PHASE_FOLDER]): Complete phase implementation

- Implemented all tasks from plan/[PHASE_FOLDER]/
- Met success criteria
- Created handover documentation
- Ready for next phase"`

# Show commit
`git log -1 --stat`
```

### 8. Update Main TODO Status

Mark phase complete in any tracking:
```typescript
TodoWrite({
  todos: [
    { id: "[PHASE_FOLDER]", content: "Phase [PHASE_FOLDER] implementation", status: "completed" }
  ]
});
```

### 9. Generate Completion Summary

```markdown
# Phase [PHASE_FOLDER] Complete! 🎉

## Achievements
- ✅ All tasks implemented
- ✅ Success criteria met
- ✅ Tests documented
- ✅ Handover created

## Key Deliverables
[List main accomplishments]

## Metrics
- Tasks completed: [count]
- Files created: [count]
- Files modified: [count]
- Tests written: [count]

## Next Steps

### Merge Status
✅ **Code has been merged to main** (if approved)
- Quality validation passed
- Test coverage verified
- Changes pushed to origin/main

OR

⚠️ **Code remains in feature branch** (if merge was rejected)
- Branch: [BRANCH_NAME]
- Manual merge required when ready

### Option 1: Continue to Next Phase
Run: `/phases:1-prepare [next-phase-folder]`

### Option 2: Manual Merge (if not auto-merged)
```bash
# Only needed if automatic merge was rejected
git checkout main
git merge [BRANCH_NAME]
git push origin main
```

### Option 3: Create Pull Request (alternative to direct merge)
```bash
# Only if you prefer PR workflow instead of direct merge
gh pr create --title "feat: Complete [PHASE_FOLDER] phase" --body "$(cat plan/handovers/[PHASE_NUMBER]-to-*.md)"
```

## Phase Dependencies Unlocked
[Which phases can now proceed]
```

## Handover Rules

### MUST Include
1. All completed items
2. All deferred items with reasons
3. Known issues and workarounds
4. Clear next steps
5. Integration points defined

### MUST NOT Include
1. Incomplete work without documentation
2. Untested critical paths
3. Breaking changes without notice
4. Missing dependencies

## Validation Checklist

Before completing handover:
- [ ] All TODOs from tasks addressed
- [ ] Handover document complete
- [ ] Code committed
- [ ] No uncommitted changes
- [ ] Build passing
- [ ] Next phase can proceed

## Special Cases

### If Phase 5 (Final Phase)
Create project completion document instead:
- Summary of all phases
- Final metrics
- Deployment instructions
- Maintenance notes

### If Parallel Phases (3 and 4)
Note in handover:
- Which parallel phase complete
- What's needed from other parallel phase
- How Phase 5 depends on both

## Error Prevention

If handover cannot complete:
1. List blocking issues
2. Create action plan
3. Do NOT mark phase complete
4. Request user intervention