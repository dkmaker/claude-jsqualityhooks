# Task 3: Fix Verification

## Task Overview
Implement verification system to ensure fixes were applied successfully and no new issues were introduced.

## References
- Primary: `docs/features/05-auto-fix-engine.md`
- Validation: `docs/features/01-hook-system.md#L24-L39`
- Architecture: `docs/ARCHITECTURE.md#L61-L65`

## Prerequisites
- [ ] Task 1 (Fix Engine) completed
- [ ] Validators available for re-check
- [ ] File reading working

## Implementation TODOs

### 1. Create Fix Verifier
- [ ] Create src/fixers/FixVerifier.ts
- [ ] Add verifyFixes method
- [ ] Return verification result
- [ ] Compare before/after states
- Reference: `docs/features/05-auto-fix-engine.md`

### 2. Re-run Validation
- [ ] Run validators on fixed content
- [ ] Use same validator config
- [ ] Get new issue list
- [ ] Compare with original issues
- [ ] Calculate issues resolved
- Reference: `docs/features/01-hook-system.md#L24-L29`

### 3. Compare Issue Counts
- [ ] Count original issues
- [ ] Count remaining issues
- [ ] Calculate fixed count
- [ ] Identify new issues
- [ ] Build comparison report
- Reference: `docs/api/interfaces.md#L67-L72`

### 4. Verify File Integrity
- [ ] Check file still exists
- [ ] Verify file readable
- [ ] Confirm valid syntax
- [ ] Check file size reasonable
- [ ] Detect corruption

### 5. Check Fix Effectiveness
- [ ] Verify targeted issues fixed
- [ ] Check for regression
- [ ] Ensure no new errors
- [ ] Validate fix quality
- [ ] Rate fix success

### 6. Handle Partial Success
- [ ] Some fixes may fail
- [ ] Track which succeeded
- [ ] Report partial results
- [ ] Continue despite failures
- [ ] Never claim full success falsely
- Reference: `docs/ARCHITECTURE.md#L149-L162`

### 7. Create Verification Report
- [ ] List fixes attempted
- [ ] Show fixes successful
- [ ] Include remaining issues
- [ ] Add verification status
- [ ] Format for output
- Reference: `docs/api/interfaces.md#L48-L55`

### 8. Add Performance Metrics
- [ ] Time verification process
- [ ] Compare with fix time
- [ ] Track total duration
- [ ] Log if too slow
- [ ] Include in report

### 9. Final Safety Check
- [ ] Ensure content not empty
- [ ] Verify encoding preserved
- [ ] Check line endings
- [ ] Confirm no data loss
- [ ] Log any anomalies

## Success Criteria
- [ ] Verification runs after fixes
- [ ] Issue counts accurate
- [ ] Regressions detected
- [ ] Partial success handled
- [ ] Reports generated
- [ ] No false positives

## Testing Requirements
- [ ] Test successful fixes
- [ ] Test failed fixes
- [ ] Test partial fixes
- [ ] Test regression detection
- [ ] Test with corrupted content
- [ ] Mock validation results

## Notes for Implementation Agent
1. Always verify after fixing
2. Re-run same validators
3. Compare issue counts carefully
4. Watch for new issues
5. Report honestly about success
6. Performance matters here
7. Safety checks are critical