---
description: Prepare for phase implementation by reviewing plan and creating feature branch
argument-hint: [phase-folder]
allowed-tools: Read, Bash, TodoWrite
---

# Phase Preparation

## ARGUMENTS Section

The provided argument is: `$ARGUMENTS`

### Validation and Extraction
You must validate that the argument is one of these exact phase folder names:
- `phase-1-infrastructure`
- `phase-2-validators`
- `phase-3-autofix`
- `phase-4-ai-output`
- `phase-5-testing`

If the argument doesn't match one of these exactly, stop and report an error.

### Extract Values
From the validated argument, extract:
- **PHASE_FOLDER**: The full folder name (same as the argument)
- **PHASE_NUMBER**: Just the phase number part (e.g., `phase-1` from `phase-1-infrastructure`)
- **PHASE_NAME**: The descriptive part after the number (e.g., `infrastructure` from `phase-1-infrastructure`)
- **BRANCH_NAME**: The git branch name to use (e.g., `feature/phase-1`)

### Example
If argument is `phase-1-infrastructure`:
- PHASE_FOLDER = `phase-1-infrastructure`
- PHASE_NUMBER = `phase-1`
- PHASE_NAME = `infrastructure`
- BRANCH_NAME = `feature/phase-1`

## Preparation Steps

### 1. Load Phase Context

Use the **knowledge-navigator** agent to:
- Read the master plan at @plan/PLAN-OVERVIEW.md
- Read the phase plan at @plan/[PHASE_FOLDER]/PLAN.md
- Identify all task files in @plan/[PHASE_FOLDER]/task-*.md

### 2. Validate Prerequisites

Use the **phase-orchestrator** agent to:
- Check phase dependencies from @plan/review/DEPENDENCIES.md
- Verify previous phases completed (if not Phase 1)
- Look for handover documents from previous phase
- Confirm all prerequisites met

### 3. Create Feature Branch

Using the extracted BRANCH_NAME value, execute these commands:
```bash
# Ensure on main branch
!`git checkout main`

# Pull latest changes
!`git pull origin main`
```

Then create the feature branch using [BRANCH_NAME] (e.g., `feature/phase-1`).

### 4. Review Implementation Plan

Present to the user:

```markdown
## Phase Implementation Plan: [PHASE_FOLDER]

### Overview
[Summary from phase PLAN.md]

### Tasks to Complete
1. [Task 1 name and duration]
2. [Task 2 name and duration]
3. [Task 3 name and duration]
...

### Success Criteria
**Must Have:**
- [ ] [Criteria from PLAN.md]

**Should Have:**
- [ ] [Criteria from PLAN.md]

### Dependencies
- Previous phases: [List]
- Required tools: [List]
- Key libraries: [List]

### Estimated Duration
[Total hours from PLAN.md]
```

### 5. Request User Approval

Ask the user:
```
Ready to begin implementation of [PHASE_FOLDER]?

This phase will:
- [Key deliverable 1]
- [Key deliverable 2]
- [Key deliverable 3]

Please confirm to proceed with implementation [Y/N]:
```

## Important Rules

1. **DO NOT** write any code during preparation
2. **DO NOT** proceed without user approval
3. **ALWAYS** check prerequisites first
4. **ALWAYS** create feature branch
5. **DEFER** any issues from past phases to user

## Stack Context

This project uses:
- Node.js 18+ with pnpm@10.14.0
- TypeScript in strict mode
- tsup for building
- vitest for testing
- Biome for code quality

## Next Steps

After user approval, they should run:
```
/phases:2-implement [PHASE_FOLDER]
```

This will begin the actual implementation using the typescript-implementer agent.