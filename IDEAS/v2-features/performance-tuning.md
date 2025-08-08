# Performance Tuning (v2 Feature)

> **Status**: Candidate for v2.0  
> **Current v1**: Uses optimized defaults

## Overview

In v2, performance can be fine-tuned for different environments and workloads. This is NOT available in v1.

## Proposed Configuration

```yaml
# v2 ONLY - Not available in v1
performance:
  parallel: true            # Run validators concurrently
  maxWorkers: 4            # Number of parallel workers
  cache: true              # Cache validation results
  cacheTimeout: 300000     # Cache for 5 minutes (ms)
  debounceDelay: 500       # Wait for rapid changes
  incrementalValidation: true
  batchSize: 10
  memoryLimit: 512         # MB
```

## v1 Behavior (Current)

In v1, performance is automatically optimized:
- Parallel execution: Enabled
- Workers: Auto-scaled to CPU cores
- Caching: Enabled with 5-minute TTL
- Debouncing: 500ms default
- Batch processing: Automatic

## Benefits of Deferring to v2

- Premature optimization is avoided
- Works well for 95% of projects
- Reduces configuration complexity
- Can gather performance data from v1 users

## Use Cases for v2

1. **Large Monorepos**: Need more workers and memory
2. **CI/CD Environments**: Different optimization strategy
3. **Resource-Constrained**: Limit workers and memory
4. **Real-time Validation**: Adjust debounce delay
5. **Network Filesystems**: Tune cache strategy

## Performance Profiles (v2)

```yaml
# Fast mode
performance: fast     # Preset

# Balanced mode (default)
performance: balanced

# Thorough mode
performance: thorough

# Custom mode
performance:
  maxWorkers: 8
  cache: false
```

## Metrics to Track

- Validation time per file
- Cache hit rate
- Memory usage
- CPU utilization
- Queue depth

## Implementation Notes

- Profile common scenarios first
- Provide clear performance impact documentation
- Monitor resource usage
- Implement progressive enhancement