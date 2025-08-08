# Hook Configuration (v2 Feature)

> **Status**: Candidate for v2.0  
> **Current v1**: Uses smart defaults only

## Overview

In v2, hooks will be configurable to control timing, failure handling, and behavior. This is NOT available in v1.

## Proposed Configuration

```yaml
# v2 ONLY - Not available in v1
hooks:
  postWrite:
    enabled: true
    timeout: 5000              # Milliseconds
    failureStrategy: warn      # warn | block | ignore
    autoFix: true
    reportToUser: true
    runValidators:
      - biome
      - typescript
  
  preRead:
    enabled: false
    timeout: 2000
    failureStrategy: ignore
    autoFix: false
  
  batchOperation:
    enabled: true
    timeout: 10000
    failureStrategy: warn
    parallelProcessing: true
    maxBatchSize: 50
```

## v1 Behavior (Current)

In v1, these are handled automatically:
- Post-write hook: Always enabled with 5s timeout
- Failure strategy: Always warn (never blocks)
- Auto-fix: Controlled by global `autoFix` setting
- Report to user: Always true
- Validators: All enabled validators run
- Pre-read: Not implemented
- Batch: Automatic optimization

## Benefits of Deferring to v2

- Keeps v1 configuration simple (10 options vs 25+)
- Reduces chance of misconfiguration
- Smart defaults work for 95% of use cases
- Can gather user feedback before implementing

## Use Cases for v2

1. **Timeout Control**: Large files may need longer validation
2. **Failure Strategy**: Some teams want to block on errors
3. **Selective Validators**: Run only specific validators per hook
4. **Pre-read Hook**: Clean files before Claude reads them
5. **Batch Optimization**: Control batch size for performance

## Migration Path

When upgrading from v1 to v2:
```yaml
# v1 config (simple)
enabled: true
autoFix: true

# v2 config (with hooks)
enabled: true
autoFix: true
hooks:          # New in v2
  postWrite:
    timeout: 5000
```

## Implementation Notes

- Hook configuration should be optional with v1 defaults
- Maintain backward compatibility
- Document performance implications
- Provide presets for common scenarios