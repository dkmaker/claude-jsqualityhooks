---
description: Test phase implementation with appropriate test strategies
argument-hint: [phase-folder]
allowed-tools: Read, Write, Edit, Bash, TodoWrite
---

# Phase Testing

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

## Testing Strategy

### 1. Determine Test Availability

Use **test-engineer** agent to check:
- Is this Phase 5? (Full test suite available)
- Are there testable components in current phase?
- What can be tested vs what needs deferral?

### 2. Phase-Specific Testing

#### Phase 1: Infrastructure Testing
```bash
# Test configuration loading
`pnpm test tests/config/ 2>/dev/null || echo "Tests pending Phase 5"`

# Test CLI commands manually
`npx . init --help`
`npx . version`

# Verify build
`pnpm build`
`ls -la dist/`
```

#### Phase 2: Validators Testing
```bash
# Test version detection
`node -e "console.log(require('./package.json').devDependencies['@biomejs/biome'])"`

# Test with sample file
`echo "const x=1;let y=2" > test-sample.js`
`npx @biomejs/biome check test-sample.js --reporter=json`
`rm test-sample.js`
```

#### Phase 3: Auto-Fix Testing
```bash
# Create test file with issues
`echo "const x=1;let y='hello'" > test-fix.js`

# Test fix application (if Biome available)
`npx @biomejs/biome check test-fix.js --write`

# Verify changes
`cat test-fix.js`
`rm test-fix.js`
```

#### Phase 4: AI Output Testing
```bash
# Test ANSI stripping
`node -e "console.log('\\x1b[31mRed\\x1b[0m'.replace(/\\x1b\\[[0-9;]*m/g, ''))"`

# Test JSON output
`echo '{"test": true}' | node -e "process.stdin.on('data', d => console.log(JSON.parse(d)))"`
```

#### Phase 5: Complete Testing
Use **test-engineer** agent to:
```bash
# Run full test suite
`pnpm test`

# Check coverage
`pnpm test:coverage`

# Run performance tests
`pnpm test tests/performance/`
```

### 3. Create Test Placeholders

For untestable items (dependencies on future phases):

```typescript
// tests/[component]/[feature].test.ts
import { describe, it, expect } from 'vitest';

describe('[Component]', () => {
  it.todo('should [behavior] - Requires Phase X');
  it.todo('should [behavior] - Blocked by [dependency]');
});
```

### 4. Manual Testing Instructions

When automated testing not available:

```markdown
## Manual Test Required: [PHASE_FOLDER]

### Test 1: [Feature Name]
**Setup:**
1. Create file: `test-example.ts`
2. Add content:
   ```typescript
   [test content]
   ```

**Steps:**
1. Run: `[command]`
2. Observe: [expected behavior]
3. Verify: [success criteria]

**Expected Result:**
[Description]

**Actual Result:** [User to fill]
**Pass/Fail:** [User to confirm]
```

### 5. Debug System Testing

If Phase 1 complete and debug system available:
```bash
# Enable debug mode
`export CLAUDE_HOOKS_DEBUG=true`

# Run hook simulation
`echo '{"hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"test.ts"}}' | node dist/cli.js`

# Check debug output
`ls -la .debug/`
```

### 6. Generate Test Report

```markdown
# Phase [PHASE_FOLDER] Test Report

## Automated Tests
- Tests Run: [count]
- Tests Passed: [count]
- Tests Failed: [count]
- Tests Skipped: [count]
- Coverage: [percentage]

## Manual Tests
- [Test name]: [PASS/FAIL/PENDING]

## Deferred Tests
Tests requiring future phases:
- [Test description] - Requires Phase [X]

## Performance Metrics
- Single file validation: [time]ms
- Memory usage: [amount]MB
- Build time: [time]s

## Test Issues
[Any failures or problems]

## Overall Status: [PASS/FAIL/PARTIAL]
```

## Testing Rules

### What to Test Now
- Components completed in current phase
- Build and compilation
- Basic functionality
- Error handling
- Configuration

### What to Defer
- Integration with future components
- Full pipeline tests (until Phase 5)
- Performance benchmarks (until Phase 5)
- Coverage requirements (until Phase 5)

### Test Creation Guidelines

Use **test-engineer** agent to:
1. Create test files even if not runnable
2. Use `.todo()` for future tests
3. Document why tests are deferred
4. Prepare fixtures for later use

## Handover Notes

Document for next phase:
```markdown
## Testing Handover from [PHASE_FOLDER]

### Tests Created
- [List of test files]

### Tests Deferred
- [Test]: Blocked by [reason]

### Test Data
- Fixtures created: [list]
- Mocks prepared: [list]

### Known Issues
- [Any test-related problems]
```

## Next Steps

### If tests available and passing:
User should run: `/phases:5-handover [PHASE_FOLDER]`

### If tests deferred:
1. Document deferrals
2. Create placeholders
3. Proceed to: `/phases:5-handover [PHASE_FOLDER]`

### If tests failing:
1. Fix issues
2. Re-run: `/phases:4-test [PHASE_FOLDER]`
3. Do not proceed until resolved or documented