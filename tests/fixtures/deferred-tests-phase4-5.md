# Deferred Tests for Phase 4/5

## Tests Requiring Phase 4 (AI Output)

### 1. ANSI Code Stripping Tests
**Requirement**: Phase 4 AI output formatter
**Description**: Test that AI-optimized output properly strips ANSI codes from validation results
**Test File**: `tests/ai-output/ANSIStripper.test.ts`
**Manual Test**: 
```bash
# Will be available after Phase 4 implementation
npx claude-jsqualityhooks test-ai-output --file tests/fixtures/sample.ts
```

### 2. Claude Integration Tests
**Requirement**: Phase 4 Claude notifier
**Description**: Test that auto-fix results are properly formatted for Claude consumption
**Test File**: `tests/ai-output/ClaudeNotifier.test.ts` 
**Manual Test**:
```bash
# Requires Phase 4 implementation
echo '{"hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"test.ts","content":"const x=1"}}' | npx claude-jsqualityhooks hook
```

### 3. JSON Output Format Tests
**Requirement**: Phase 4 JSON formatter
**Description**: Verify that auto-fix results are serialized properly for AI consumption
**Expected**: JSON output with fix statistics, effectiveness ratings, and structured validation results

## Tests Requiring Phase 5 (Full Integration)

### 1. End-to-End Hook Flow Tests
**Requirement**: Complete Phase 5 integration
**Description**: Test complete hook flow from Claude input to auto-fixed output
**Manual Test**:
```bash
# Full hook integration test
npx claude-jsqualityhooks install
# Then test with actual Claude Code file operations
```

### 2. Performance Integration Tests
**Requirement**: Phase 5 performance optimization
**Description**: Test that auto-fix operations complete within <100ms target
**Expected**: Benchmarks for full validation + auto-fix + verification pipeline

### 3. Configuration Integration Tests
**Requirement**: Phase 5 final configuration
**Description**: Test all configuration options work with auto-fix enabled
**Test Scenarios**:
- `autoFix.enabled: false` - should skip all auto-fix operations
- `autoFix.maxAttempts: 1` - should limit fix attempts
- Different validator combinations with auto-fix

### 4. Cross-Platform Tests
**Requirement**: Phase 5 deployment testing
**Description**: Verify auto-fix works across Windows/macOS/Linux
**Current Status**: Only tested on Windows (win32)

## Current Test Coverage Gaps (Phase 3)

### 1. Sequential Fix Application
**Status**: Partially tested in AutoFixEngine.test.ts
**Gap**: Real-world sequential fix scenarios with multiple issue types

### 2. Large File Performance
**Status**: Not tested
**Gap**: Auto-fix performance on files >1000 lines

### 3. Binary File Handling
**Status**: Not tested  
**Gap**: Proper rejection of binary files in auto-fix pipeline

### 4. Concurrent Fix Operations
**Status**: Not tested
**Gap**: Multiple files being auto-fixed simultaneously

## Recommended Test Order for Phase 4/5

1. **Phase 4a**: Implement ANSI stripping and test with existing auto-fix output
2. **Phase 4b**: Add Claude notification format tests
3. **Phase 4c**: JSON serialization tests for auto-fix results
4. **Phase 5a**: End-to-end integration tests
5. **Phase 5b**: Performance and stress tests
6. **Phase 5c**: Cross-platform validation

## Mock Requirements for Deferred Tests

### Phase 4 Mocks Needed
- Claude input simulator
- ANSI code output generator  
- JSON schema validators for AI output

### Phase 5 Mocks Needed
- File system watchers
- Process spawning simulators
- Cross-platform environment simulators