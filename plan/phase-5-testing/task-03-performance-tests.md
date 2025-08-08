# Task 3: Performance Tests

## Task Overview
Create performance benchmarks to ensure validation completes within target time (<100ms per file) and identify bottlenecks.

## References
- Primary: `docs/implementation/phase-5-testing.md`
- Performance Goals: `docs/features/01-hook-system.md#L95-L101`
- Architecture: `docs/ARCHITECTURE.md#L140-L147`
- Targets: `docs/plan/PLAN-OVERVIEW.md` (performance metrics)

## Prerequisites
- [ ] Task 1, 2 completed
- [ ] Benchmarking tools ready
- [ ] Test files prepared

## Implementation TODOs

### 1. Create Benchmark Suite
- [ ] Create tests/performance/benchmark.test.ts
- [ ] Set up timing utilities
- [ ] Create performance assertions
- [ ] Add memory tracking
- [ ] Configure thresholds
- Reference: `docs/features/01-hook-system.md#L95-L101`

### 2. Test Single File Performance
- [ ] Measure small file (<100 lines)
- [ ] Measure medium file (500 lines)
- [ ] Measure large file (2000+ lines)
- [ ] Target: <100ms for typical files
- [ ] Track validation time
- [ ] Track fix time

### 3. Test Parallel Execution
- [ ] Measure parallel vs sequential
- [ ] Verify parallel is faster
- [ ] Check CPU utilization
- [ ] Monitor thread usage
- [ ] Confirm no race conditions
- Reference: `docs/ARCHITECTURE.md#L140-L147`

### 4. Test Version Detection Cache
- [ ] Measure first detection time
- [ ] Measure cached lookup time
- [ ] Verify cache effectiveness
- [ ] Check cache invalidation
- [ ] Monitor cache size

### 5. Memory Usage Tests
- [ ] Create tests/performance/memory.test.ts
- [ ] Test with large files
- [ ] Check for memory leaks
- [ ] Monitor heap usage
- [ ] Test garbage collection
- [ ] Verify cleanup

### 6. Stress Testing
- [ ] Test many files sequentially
- [ ] Test rapid file changes
- [ ] Test concurrent operations
- [ ] Monitor resource usage
- [ ] Check stability

### 7. Benchmark Biome Operations
- [ ] Time Biome validation
- [ ] Time Biome fixes
- [ ] Compare v1 vs v2 performance
- [ ] Identify bottlenecks
- [ ] Optimize if needed

### 8. Benchmark TypeScript
- [ ] Time TS compilation
- [ ] Test incremental checks
- [ ] Monitor program creation
- [ ] Check disposal timing
- [ ] Optimize if slow

### 9. Output Formatting Performance
- [ ] Time ANSI stripping
- [ ] Time JSON formatting
- [ ] Test with many issues
- [ ] Check string operations
- [ ] Ensure fast formatting

## Success Criteria
- [ ] <100ms for typical files
- [ ] <500ms for large files
- [ ] No memory leaks
- [ ] Parallel faster than sequential
- [ ] Cache improves performance
- [ ] Stable under stress

## Testing Requirements
- [ ] Consistent timing method
- [ ] Multiple test runs
- [ ] Statistical analysis
- [ ] Memory profiling
- [ ] CPU profiling
- [ ] Clear benchmarks

## Notes for Implementation Agent
1. Performance is critical
2. Target 100ms per file
3. Profile to find bottlenecks
4. Test with realistic files
5. Monitor memory closely
6. Optimize hot paths
7. Document performance characteristics