# Cross-Phase Review Checklist

## Purpose
This checklist ensures consistency, completeness, and quality across all implementation phases. The review agent should use this to validate the entire implementation.

## Phase Alignment Review

### Phase Dependencies Met
- [ ] Phase 1 completed before Phase 2-5 start
- [ ] Phase 2 completed before Phase 3 starts
- [ ] Phase 2 completed before Phase 4 starts
- [ ] Phase 3 and 4 can run independently
- [ ] Phase 5 runs after all others complete

### Interface Consistency
- [ ] All phases use same Config interface (`docs/api/interfaces.md#L10-L34`)
- [ ] ValidationResult format consistent (`docs/api/interfaces.md#L48-L72`)
- [ ] FileInfo structure shared (`docs/api/interfaces.md#L36-L41`)
- [ ] Hook interfaces aligned (`docs/api/interfaces.md#L130-L144`)

## Implementation Completeness

### Phase 1: Infrastructure
- [ ] Config file required in project root
- [ ] Graceful exit when config missing (ref: `docs/implementation/phase-1-infrastructure.md#L147-L167`)
- [ ] All 3 CLI commands implemented
- [ ] Hook system extensible for validators
- [ ] Error handling follows warn-don't-block

### Phase 2: Validators
- [ ] Biome version auto-detection working
- [ ] Both Biome 1.x and 2.x supported
- [ ] TypeScript validator integrated
- [ ] Validators run in parallel
- [ ] Partial failure handling implemented

### Phase 3: Auto-Fix
- [ ] Only safe fixes applied
- [ ] Sequential fix application
- [ ] Fix verification after application
- [ ] No data loss scenarios
- [ ] Conflict resolution working

### Phase 4: AI Output
- [ ] No ANSI codes in output
- [ ] Messages simplified for AI
- [ ] Valid JSON structure always
- [ ] Claude integration tested
- [ ] Statistics accurate

### Phase 5: Testing
- [ ] >80% code coverage achieved
- [ ] Performance <100ms verified
- [ ] No memory leaks detected
- [ ] All error scenarios tested
- [ ] Integration tests passing

## Cross-Cutting Concerns

### Error Handling Consistency
- [ ] All components use try-catch
- [ ] Errors logged but don't block
- [ ] Partial results returned
- [ ] Graceful degradation
- [ ] No unhandled exceptions
- Reference: `docs/ARCHITECTURE.md#L149-L162`

### Performance Requirements
- [ ] Validators run in parallel
- [ ] Biome version cached
- [ ] <100ms for typical files
- [ ] Memory efficient
- [ ] No blocking operations
- Reference: `docs/features/01-hook-system.md#L95-L101`

### Configuration Handling
- [ ] All 10 options implemented
- [ ] Smart defaults working
- [ ] Config validation with Zod
- [ ] Config file required
- [ ] Override support functional
- Reference: `docs/config/configuration-guide.md`

## Code Quality Review

### TypeScript Standards
- [ ] Strict mode enabled
- [ ] All types defined
- [ ] No any types
- [ ] Interfaces documented
- [ ] Generics used appropriately

### Testing Coverage
- [ ] Unit tests for all components
- [ ] Integration tests for workflows
- [ ] Performance benchmarks
- [ ] Error scenarios covered
- [ ] Mocks properly isolated

### Documentation Alignment
- [ ] Code matches documentation
- [ ] No undocumented features
- [ ] Examples work as shown
- [ ] References accurate
- [ ] Line numbers correct

## Security & Safety

### Data Integrity
- [ ] No data loss possible
- [ ] File backups before changes
- [ ] Rollback capability
- [ ] Atomic operations
- [ ] Content verification

### Input Validation
- [ ] Claude input validated
- [ ] Config validated with Zod
- [ ] File paths sanitized
- [ ] Command injection prevented
- [ ] JSON parsing safe

## Final Verification

### Build & Bundle
- [ ] TypeScript compiles clean
- [ ] Bundle size <500KB
- [ ] Both ESM and CJS output
- [ ] Types exported correctly
- [ ] Package.json correct

### Claude Integration
- [ ] Hook mode detection works
- [ ] JSON input parsed correctly
- [ ] Output format matches spec
- [ ] Exit codes appropriate
- [ ] No extra stdout output

### User Experience
- [ ] Clear error messages
- [ ] Helpful warnings
- [ ] Fast execution
- [ ] Predictable behavior
- [ ] Good defaults

## Review Sign-Off

### Phase Reviews
- [ ] Phase 1 reviewed and approved
- [ ] Phase 2 reviewed and approved
- [ ] Phase 3 reviewed and approved
- [ ] Phase 4 reviewed and approved
- [ ] Phase 5 reviewed and approved

### Overall Assessment
- [ ] All success criteria met
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Quality standards met
- [ ] Ready for release

## Notes for Review Agent

1. Check each item systematically
2. Verify references are accurate
3. Test cross-phase integration
4. Ensure no gaps in coverage
5. Validate against documentation
6. Confirm no duplicate work
7. Sign off only when complete