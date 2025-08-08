# Phase 3: Auto-Fix Implementation

## Overview

Phase 3 implements the auto-fix engine for Claude JS Quality Hooks that applies corrections from validators and manages fix conflicts.

## Goals

1. Build fix engine with priority system
2. Implement safe vs unsafe fix logic
3. Create conflict resolver
4. Add rollback capability
5. Test fix application

## Key Implementation Files

- `src/fixers/autoFix.ts`
- `src/fixers/conflictResolver.ts`
- `src/fixers/fixPriority.ts`
- `src/fixers/fileBackup.ts`

## Fix Priority System

```typescript
// src/fixers/fixPriority.ts
export enum FixPriority {
  CRITICAL = 1,    // Syntax errors, type errors
  HIGH = 2,        // Formatting issues
  MEDIUM = 3,      // Style preferences
  LOW = 4          // Suggestions
}

export class FixPriorityManager {
  sortByPriority(fixes: Fix[]): Fix[] {
    return fixes.sort((a, b) => a.priority - b.priority);
  }
  
  groupByPriority(fixes: Fix[]): Map<FixPriority, Fix[]> {
    // Group fixes by their priority level
  }
}
```

## Auto-Fix Engine

```typescript
// src/fixers/autoFix.ts
export class AutoFixEngine {
  private conflictResolver = new ConflictResolver();
  private backup = new FileBackup();
  
  async applyFixes(
    file: FileInfo,
    issues: ValidationIssue[]
  ): Promise<FixResult> {
    // Create backup of original file
    const backupPath = await this.backup.create(file.path);
    
    try {
      // Extract fixable issues
      const fixes = this.extractFixes(issues);
      
      // Sort by priority (critical first)
      const sortedFixes = this.priorityManager.sortByPriority(fixes);
      
      // Detect and resolve conflicts
      const resolvedFixes = await this.conflictResolver.resolve(sortedFixes);
      
      // Apply fixes sequentially
      const results = await this.applySequentially(file, resolvedFixes);
      
      // Verify fixes didn't break anything
      const verificationResult = await this.verifyFixes(file);
      
      if (!verificationResult.success) {
        await this.rollback(file.path, backupPath);
        return { success: false, error: verificationResult.error };
      }
      
      return { success: true, appliedFixes: results };
    } catch (error) {
      // Rollback on any failure
      await this.rollback(file.path, backupPath);
      throw error;
    } finally {
      // Clean up backup
      await this.backup.cleanup(backupPath);
    }
  }
  
  private extractFixes(issues: ValidationIssue[]): Fix[] {
    return issues
      .filter(issue => issue.fix && this.isSafeFix(issue.fix))
      .map(issue => issue.fix!);
  }
  
  private isSafeFix(fix: Fix): boolean {
    // Determine if fix is safe to apply automatically
    return fix.safetyLevel === 'safe' && !fix.requiresUserInput;
  }
  
  private async applySequentially(file: FileInfo, fixes: Fix[]): Promise<AppliedFix[]> {
    const applied: AppliedFix[] = [];
    let content = await readFile(file.path, 'utf-8');
    
    for (const fix of fixes) {
      try {
        content = this.applyFix(content, fix);
        applied.push({ fix, success: true });
      } catch (error) {
        applied.push({ fix, success: false, error });
      }
    }
    
    await writeFile(file.path, content);
    return applied;
  }
}
```

## Conflict Resolution

```typescript
// src/fixers/conflictResolver.ts
export class ConflictResolver {
  async resolve(fixes: Fix[]): Promise<Fix[]> {
    const conflicts = this.detectConflicts(fixes);
    
    if (conflicts.length === 0) {
      return fixes;
    }
    
    return this.resolveConflicts(fixes, conflicts);
  }
  
  private detectConflicts(fixes: Fix[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    for (let i = 0; i < fixes.length; i++) {
      for (let j = i + 1; j < fixes.length; j++) {
        if (this.hasOverlap(fixes[i], fixes[j])) {
          conflicts.push({ fix1: fixes[i], fix2: fixes[j] });
        }
      }
    }
    
    return conflicts;
  }
  
  private hasOverlap(fix1: Fix, fix2: Fix): boolean {
    // Check if two fixes affect overlapping ranges
    return fix1.range.start < fix2.range.end && 
           fix2.range.start < fix1.range.end;
  }
  
  private resolveConflicts(fixes: Fix[], conflicts: Conflict[]): Fix[] {
    // Resolution strategy: keep higher priority fix
    const toRemove = new Set<Fix>();
    
    for (const conflict of conflicts) {
      if (conflict.fix1.priority < conflict.fix2.priority) {
        toRemove.add(conflict.fix2);
      } else {
        toRemove.add(conflict.fix1);
      }
    }
    
    return fixes.filter(fix => !toRemove.has(fix));
  }
}
```

## File Backup System

```typescript
// src/fixers/fileBackup.ts
export class FileBackup {
  async create(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await copyFile(filePath, backupPath);
    return backupPath;
  }
  
  async restore(originalPath: string, backupPath: string): Promise<void> {
    await copyFile(backupPath, originalPath);
  }
  
  async cleanup(backupPath: string): Promise<void> {
    try {
      await unlink(backupPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
```

## Implementation Steps

### Step 1: Create Fix Data Structures

Define the Fix interface and related types.

### Step 2: Implement Priority System

Build the fix prioritization and grouping logic.

### Step 3: Build Conflict Detection

Implement logic to detect overlapping fixes.

### Step 4: Create Backup System

Implement file backup and restore functionality.

### Step 5: Build Fix Engine

Create the main orchestration logic for applying fixes.

### Step 6: Add Verification

Implement post-fix verification to ensure fixes didn't break anything.

## Success Criteria

- [ ] Fixes apply in priority order
- [ ] Conflicts are detected and resolved correctly
- [ ] Rollback works reliably on any failure
- [ ] File updates are atomic operations
- [ ] Fix reporting provides detailed results
- [ ] Performance is acceptable for multiple fixes

## Testing

Create comprehensive tests for the fix engine:

```typescript
// tests/fixers/autoFix.test.ts
describe('AutoFixEngine', () => {
  it('should apply fixes in priority order', async () => {
    // Test fix prioritization
  });
  
  it('should detect and resolve conflicts', async () => {
    // Test conflict resolution
  });
  
  it('should rollback on verification failure', async () => {
    // Test rollback functionality
  });
});
```

## Next Steps

Proceed to [Phase 4: AI Output](./phase-4-ai-output.md) to implement AI-optimized output formatting.