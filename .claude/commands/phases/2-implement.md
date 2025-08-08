---
description: Execute phase implementation following the plan and using specialized agents
argument-hint: [phase-folder]
allowed-tools: Read, Write, Edit, MultiEdit, Bash, TodoWrite
---

# Phase Implementation

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

## Implementation Process

### 1. Initialize Task Tracking

Use **phase-orchestrator** agent to create TODO list from @plan/[PHASE_FOLDER]/PLAN.md tasks:

```typescript
// Create aligned TODO list
TodoWrite({
  todos: [
    // One item per task file in plan/[PHASE_FOLDER]/
  ]
});
```

### 2. Execute Each Task

For each task file in @plan/[PHASE_FOLDER]/:

#### A. Load Task Requirements
Use **knowledge-navigator** agent to:
- Read task file (e.g., @plan/[PHASE_FOLDER]/task-01-*.md)
- Extract implementation TODOs
- Identify references to docs/
- Note success criteria

#### B. Implement Code
Use **typescript-implementer** agent to:
- Follow EVERY implementation TODO
- Create/modify files as specified
- Use exact patterns from references
- Apply TypeScript strict mode
- Follow project conventions

#### C. Update Progress
- Mark current task as "in_progress" in TodoWrite
- Complete each TODO item in task file
- Mark task as "completed" when done
- Document any deferred items

### 3. Phase-Specific Implementation

#### Phase 1: Infrastructure
Focus on:
- pnpm setup with Corepack
- YAML config loader with Zod
- Base hook classes
- CLI commands (init, install, version)

#### Phase 2: Validators
Focus on:
- Biome version auto-detection
- Adapter pattern (1.x vs 2.x)
- TypeScript Compiler API
- Parallel execution with Promise.allSettled

#### Phase 3: Auto-Fix
Focus on:
- Sequential fix application
- Only safe fixes
- Fix verification
- No data loss

#### Phase 4: AI Output
Focus on:
- ANSI code removal
- Message simplification
- Valid JSON output
- Claude integration

#### Phase 5: Testing
Focus on:
- Unit test creation
- >80% coverage
- Performance benchmarks
- Mock strategies

### 4. Continuous Validation

After each task completion:
```bash
# Verify TypeScript compilation
`pnpm typecheck`

# Check code quality
`pnpm lint`

# Run tests if available
`pnpm test`
```

### 5. Handle Dependencies

If a task depends on future phase:
1. Document in handover notes
2. Create placeholder if needed
3. Add TODO comment with phase reference
4. Continue with next task

## Critical Implementation Rules

### MUST Follow
1. **Every TODO** in task files must be implemented
2. **Line number references** must be checked and followed
3. **Config file** must be required at root only
4. **Biome versions** both 1.x and 2.x must work
5. **Error handling** must be non-blocking

### MUST NOT Do
1. **Copy code** from documentation
2. **Add features** not in requirements
3. **Skip TODOs** without documenting
4. **Implement future** phase features
5. **Use different** library versions

## Stack Reminders

```json
{
  "packageManager": "pnpm@10.14.0",
  "dependencies": {
    "commander": "14.0.0",
    "yaml": "2.8.1",
    "zod": "4.0.15",
    "execa": "9.6.0",
    "fast-glob": "3.3.3"
  }
}
```

## Progress Reporting

Regularly update user with:
```markdown
## Phase [PHASE_FOLDER] Progress

### Completed Tasks
- ✅ [Task name]

### Current Task
- 🔄 [Task name] - [% complete]

### Remaining Tasks
- ⏳ [Task name]

### Issues/Deferrals
- [Any problems encountered]
```

## Completion

When all tasks done:
1. Verify all success criteria met
2. Run final validation
3. Commit changes
4. Inform user to run: `/phases:3-validate [PHASE_FOLDER]`