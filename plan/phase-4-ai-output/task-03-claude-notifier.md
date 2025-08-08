# Task 3: Claude Notifier

## Task Overview
Implement the notification system that sends formatted results back to Claude via stdout in the expected format.

## References
- Primary: `docs/ARCHITECTURE.md#L66-L70`
- Hook Mode: `docs/CLI.md#L114-L145`
- Output Format: `docs/CLI.md#L141-L144`
- Architecture: `docs/ARCHITECTURE.md#L37-L39`

## Prerequisites
- [ ] Task 2 (AI Formatter) completed
- [ ] Formatted output ready
- [ ] stdout access available

## Implementation TODOs

### 1. Create Claude Notifier
- [ ] Create src/notifications/ClaudeNotifier.ts
- [ ] Add notify method
- [ ] Accept formatted output
- [ ] Write to stdout
- [ ] Set exit codes
- Reference: `docs/ARCHITECTURE.md#L66-L70`

### 2. Detect Hook Mode
- [ ] Check if stdin is piped
- [ ] Verify JSON input received
- [ ] Confirm hook context
- [ ] Set appropriate mode
- [ ] Log mode detection
- Reference: `docs/CLI.md#L114-L118`

### 3. Format Response Structure
- [ ] Build response object
- [ ] Include validation results
- [ ] Add execution metadata
- [ ] Include timing info
- [ ] Ensure expected format
- Reference: `docs/CLI.md#L141-L144`

### 4. Write to Stdout
- [ ] Use console.log for output
- [ ] Stringify JSON properly
- [ ] No extra output
- [ ] Clean JSON only
- [ ] Single line if needed
- Reference: `docs/CLI.md#L143-L144`

### 5. Set Exit Codes
- [ ] 0 for success/warning
- [ ] 1 for errors
- [ ] 2 for tool failure
- [ ] Consistent with docs
- [ ] Never crash unexpectedly
- Reference: `docs/CLI.md#L114-L136`

### 6. Add Execution Metadata
- [ ] Include timestamp
- [ ] Add duration in ms
- [ ] Include tool version
- [ ] Add session ID if available
- [ ] Keep metadata minimal

### 7. Handle Output Errors
- [ ] Catch write failures
- [ ] Handle stdout errors
- [ ] Fallback to stderr
- [ ] Log output issues
- [ ] Exit gracefully
- Reference: `docs/ARCHITECTURE.md#L149-L162`

### 8. Implement Quiet Mode
- [ ] Check for debug flag
- [ ] Suppress verbose output
- [ ] Only JSON to stdout
- [ ] Errors to stderr only
- [ ] Clean output for Claude

### 9. Final Output Validation
- [ ] Validate JSON structure
- [ ] Check required fields
- [ ] Ensure no undefined
- [ ] Test Claude compatibility
- [ ] Verify format matches spec

## Success Criteria
- [ ] Claude receives output
- [ ] JSON format correct
- [ ] Exit codes appropriate
- [ ] No extra output
- [ ] Errors handled
- [ ] Mode detection works

## Testing Requirements
- [ ] Test hook mode output
- [ ] Test CLI mode difference
- [ ] Test exit codes
- [ ] Test stdout writing
- [ ] Test error scenarios
- [ ] Mock Claude environment

## Notes for Implementation Agent
1. Output format is critical
2. Claude expects clean JSON
3. No debug output to stdout
4. Exit codes matter
5. Test with actual Claude
6. Keep output minimal
7. Handle pipe errors