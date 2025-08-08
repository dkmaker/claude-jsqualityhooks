---
description: Validate phase implementation against success criteria and requirements
argument-hint: [phase-folder]
allowed-tools: Read, Grep, Glob, Bash
---

# Phase Validation

You are validating the implementation of phase: `$ARGUMENTS` for claude-jsqualityhooks.

## Validation Process

### 1. Load Success Criteria

Use **knowledge-navigator** agent to:
- Read @plan/$ARGUMENTS/PLAN.md#success-criteria
- Extract Must Have, Should Have, Nice to Have items
- Load task-specific criteria from each task file

### 2. Code Quality Review

Use **quality-guardian** agent to perform comprehensive review:

#### A. Structural Validation
```bash
# Verify project structure
!`ls -la src/`
!`ls -la tests/`

# Check TypeScript compilation
!`pnpm typecheck`

# Run linting
!`pnpm lint`

# Run formatting check
!`pnpm format:check`
```

#### B. Requirements Checklist

##### Phase 1 Validation
- [ ] pnpm setup with Corepack working
- [ ] Config file required at root
- [ ] Graceful exit if config missing
- [ ] CLI commands functional
- [ ] Base hook structure extensible

##### Phase 2 Validation
- [ ] Biome version detection working
- [ ] Both 1.x and 2.x commands correct
- [ ] TypeScript validator integrated
- [ ] Validators run in parallel
- [ ] Promise.allSettled used

##### Phase 3 Validation
- [ ] Only safe fixes applied
- [ ] Sequential fix order
- [ ] Fix verification implemented
- [ ] No data loss scenarios
- [ ] Rollback capability

##### Phase 4 Validation
- [ ] No ANSI codes in output
- [ ] Valid JSON structure
- [ ] Messages simplified
- [ ] Relative paths only
- [ ] Claude integration working

##### Phase 5 Validation
- [ ] >80% test coverage
- [ ] All tests passing
- [ ] Performance <100ms
- [ ] No memory leaks
- [ ] Benchmarks complete

### 3. Pattern Compliance

Verify critical patterns implemented correctly:

#### Configuration Pattern
```bash
# Check for required warning format
!`grep -n "showWarningAndExit" src/config/`
```

#### Error Handling Pattern
```bash
# Verify non-blocking errors
!`grep -n "catch.*{" src/ -A 3 | grep -v "throw"`
```

#### Version Detection Pattern
```bash
# Check detection order
!`grep -n "packageJson.*CLI.*default" src/validators/biome/`
```

### 4. Dependency Verification

Check correct library versions:
```bash
!`grep '"commander".*"14.0.0"' package.json`
!`grep '"yaml".*"2.8.1"' package.json`
!`grep '"zod".*"4.0.15"' package.json`
!`grep '"execa".*"9.6.0"' package.json`
!`grep '"fast-glob".*"3.3.3"' package.json`
```

### 5. Scope Validation

Use **quality-guardian** agent to ensure:
- No features beyond current phase
- No unnecessary additions
- Stays within requirements
- No premature optimization

### 6. Generate Validation Report

```markdown
# Phase $ARGUMENTS Validation Report

## Success Criteria Results

### Must Have ✅
- [✅/❌] [Criteria and status]

### Should Have ⚠️
- [✅/❌] [Criteria and status]

### Nice to Have 💡
- [✅/❌] [Criteria and status]

## Code Quality Metrics
- TypeScript: [PASS/FAIL]
- Linting: [PASS/FAIL]
- Formatting: [PASS/FAIL]
- Build: [PASS/FAIL]

## Issues Found
[List any validation failures]

## Recommendations
[Suggestions for fixes]

## Overall Status: [PASS/FAIL]
```

## Validation Rules

### PASS Criteria
- All "Must Have" items completed
- TypeScript compiles without errors
- Linting passes
- No scope creep detected
- Correct patterns followed

### FAIL Criteria
- Missing "Must Have" items
- Compilation errors
- Wrong library versions
- Features from future phases
- Pattern violations

## Next Steps

### If PASS:
User should run: `/phases:4-test $ARGUMENTS`

### If FAIL:
1. Fix identified issues
2. Re-run: `/phases:3-validate $ARGUMENTS`
3. Do not proceed until validation passes

## Important Notes

- **NEVER** pass validation with missing requirements
- **ALWAYS** check pattern compliance
- **VERIFY** no future phase work included
- **ENSURE** all TODOs from tasks completed