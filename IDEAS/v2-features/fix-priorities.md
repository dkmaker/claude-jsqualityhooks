# Fix Priorities (v2 Feature)

> **Status**: Candidate for v2.0  
> **Current v1**: Uses logical default order

## Overview

In v2, the order of fix application can be customized. This is NOT available in v1.

## Proposed Configuration

```yaml
# v2 ONLY - Not available in v1
fixPriority:
  format: 100             # Fix formatting first
  imports: 90             # Then organize imports
  lint: 80               # Then apply lint fixes
  complexity: 50         # Complex fixes last
  custom: 40             # Custom rules
  experimental: 10       # Experimental fixes
```

## v1 Behavior (Current)

In v1, fixes are applied in this logical order:
1. **Format** - Prevents conflicts with other fixes
2. **Imports** - Organizes after formatting
3. **Lint** - Safe fixes after structure is correct
4. **Other** - Any remaining fixes

This order prevents conflicts and ensures clean results.

## Benefits of Deferring to v2

- Default order works well
- Prevents fix conflicts
- No configuration needed
- Consistent behavior

## Use Cases for v2

1. **Custom Workflows**: Team-specific fix order
2. **Performance**: Prioritize expensive fixes
3. **Safety**: Apply safe fixes first
4. **Incremental**: Fix in stages
5. **Tool Conflicts**: Handle tool-specific ordering

## Fix Categories

### Safe Fixes (High Priority)
- Formatting
- Import sorting
- Whitespace
- Quotes

### Potentially Breaking (Low Priority)
- Code refactoring
- Type changes
- API updates
- Structure changes

## Priority Ranges

- **100-80**: Critical, always first
- **79-50**: Standard fixes
- **49-20**: Optional fixes
- **19-0**: Experimental

## Conflict Resolution

When fixes conflict:
1. Higher priority wins
2. Safe fixes preferred
3. User prompted if unclear
4. Rollback if needed

## Implementation Notes

- Document fix ordering impact
- Detect potential conflicts
- Support priority presets
- Allow per-file overrides