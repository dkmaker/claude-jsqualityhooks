---
description: Prepare for phase implementation by reviewing plan and creating feature branch
argument-hint: [phase-folder]
allowed-tools: Read, Bash, TodoWrite
---

# Phase Preparation

You are preparing to implement a phase of the claude-jsqualityhooks project. The phase folder is: `$ARGUMENTS`

## Preparation Steps

### 1. Load Phase Context

Use the **knowledge-navigator** agent to:
- Read the master plan at @plan/PLAN-OVERVIEW.md
- Read the phase plan at @plan/$ARGUMENTS/PLAN.md
- Identify all task files in @plan/$ARGUMENTS/task-*.md

### 2. Validate Prerequisites

Use the **phase-orchestrator** agent to:
- Check phase dependencies from @plan/review/DEPENDENCIES.md
- Verify previous phases completed (if not Phase 1)
- Look for handover documents from previous phase
- Confirm all prerequisites met

### 3. Create Feature Branch

Execute these commands:
```bash
# Ensure on main branch
!`git checkout main`

# Pull latest changes
!`git pull origin main`

# Create phase branch
!`git checkout -b feature/$ARGUMENTS`
```

### 4. Review Implementation Plan

Present to the user:

```markdown
## Phase Implementation Plan: $ARGUMENTS

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
Ready to begin implementation of $ARGUMENTS?

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
/phases:2-implement $ARGUMENTS
```

This will begin the actual implementation using the typescript-implementer agent.