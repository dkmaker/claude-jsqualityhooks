# Phase 3: Auto-Fix Implementation

## Overview

Phase 3 implements the auto-fix engine that applies corrections from validators and manages fix conflicts.

## Goals

1. Build fix engine with priority system
2. Implement safe vs unsafe fix logic
3. Create conflict resolver
4. Add rollback capability
5. Test fix application

## Key Implementation Files

- `src/fixers/autoFix.ts`
- `src/fixers/conflictResolver.ts`

## Auto-Fix Engine

```typescript
// src/fixers/autoFix.ts
export class AutoFixEngine {
  async applyFixes(
    file: FileInfo,
    issues: ValidationIssue[]
  ): Promise<FixResult> {
    // Group by priority
    // Apply sequentially
    // Handle conflicts
    // Write results
  }
}
```

## Success Criteria

- [ ] Fixes apply in priority order
- [ ] Conflicts are detected and resolved
- [ ] Rollback works on failure
- [ ] File updates are atomic
- [ ] Fix reporting is accurate

## Next: [Phase 4: AI Output](./phase-4-ai-output.md)