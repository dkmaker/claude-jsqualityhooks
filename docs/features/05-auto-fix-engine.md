# Auto-Fix Engine

## Overview

The Auto-Fix Engine intelligently applies corrections to code issues detected by validators, prioritizing safe fixes and managing conflicts between different fixers.

## Fix Strategy

### Fix Categories

```typescript
enum FixCategory {
  FORMAT = 'format',      // Whitespace, indentation, line breaks
  IMPORT = 'import',      // Import sorting and organization
  LINT_SAFE = 'lint_safe',    // Safe lint fixes (e.g., remove unused)
  LINT_UNSAFE = 'lint_unsafe', // Potentially breaking fixes
  TYPE = 'type',          // Type-related fixes (usually manual)
}

interface FixStrategy {
  category: FixCategory;
  priority: number;  // Higher = fixed first
  autoApply: boolean;
  requiresConfirmation: boolean;
}
```

### Default Fix Priorities

```yaml
fixPriority:
  format: 100      # Always fix formatting first
  imports: 90      # Then organize imports
  lint_safe: 80    # Safe lint fixes
  lint_unsafe: 50  # Risky fixes last
  type: 0          # Type errors not auto-fixable
```

## Fix Implementation

### Main Fix Engine

```typescript
class AutoFixEngine {
  private fixers: Map<string, Fixer> = new Map();
  private conflictResolver: ConflictResolver;
  
  async applyFixes(
    file: FileInfo,
    issues: ValidationIssue[],
    options: FixOptions
  ): Promise<FixResult> {
    // 1. Group issues by fixer
    const grouped = this.groupByFixer(issues);
    
    // 2. Sort by priority
    const sorted = this.sortByPriority(grouped);
    
    // 3. Apply fixes sequentially
    let content = file.content;
    const applied: AppliedFix[] = [];
    
    for (const [fixerName, fixerIssues] of sorted) {
      const fixer = this.fixers.get(fixerName);
      if (!fixer) continue;
      
      // Check if safe to apply
      if (!options.unsafe && fixer.category === FixCategory.LINT_UNSAFE) {
        continue;
      }
      
      // Apply fixer
      const result = await fixer.fix(content, fixerIssues);
      if (result.success) {
        content = result.content;
        applied.push(...result.fixes);
      }
    }
    
    // 4. Write back if changed
    if (content !== file.content) {
      await this.writeFile(file.path, content);
      return {
        success: true,
        modified: true,
        fixes: applied,
        content
      };
    }
    
    return {
      success: true,
      modified: false,
      fixes: [],
      content: file.content
    };
  }
}
```

### Biome Fixer

```typescript
class BiomeFixer implements Fixer {
  category = FixCategory.FORMAT;
  
  async fix(
    content: string,
    issues: ValidationIssue[]
  ): Promise<FixerResult> {
    // Use Biome's built-in fix capability
    const tempFile = await this.writeTempFile(content);
    
    try {
      // Build fix command based on version
      const command = this.adapter.buildFixCommand(tempFile, {
        fix: true,
        unsafe: this.options.fixUnsafe
      });
      
      // Execute Biome fix
      await exec(`biome ${command.join(' ')}`);
      
      // Read fixed content
      const fixed = await this.readFile(tempFile);
      
      // Detect what changed
      const changes = this.detectChanges(content, fixed);
      
      return {
        success: true,
        content: fixed,
        fixes: changes.map(c => ({
          type: this.categorizeChange(c),
          line: c.line,
          description: c.description
        }))
      };
    } finally {
      await this.cleanup(tempFile);
    }
  }
  
  private categorizeChange(change: Change): FixCategory {
    if (change.description.includes('import')) return FixCategory.IMPORT;
    if (change.description.includes('unused')) return FixCategory.LINT_SAFE;
    return FixCategory.FORMAT;
  }
}
```

## Conflict Resolution

### Conflict Detector

```typescript
class ConflictResolver {
  detectConflicts(fixes: PlannedFix[]): ConflictGroup[] {
    const conflicts: ConflictGroup[] = [];
    
    // Group fixes by location
    const byLocation = this.groupByLocation(fixes);
    
    for (const [location, locationFixes] of byLocation) {
      if (locationFixes.length > 1) {
        // Multiple fixes at same location = conflict
        conflicts.push({
          location,
          fixes: locationFixes,
          resolution: this.suggestResolution(locationFixes)
        });
      }
    }
    
    return conflicts;
  }
  
  suggestResolution(fixes: PlannedFix[]): PlannedFix {
    // Prefer fixes in priority order
    return fixes.sort((a, b) => b.priority - a.priority)[0];
  }
}
```

### Merge Strategy

```typescript
class FixMerger {
  merge(fixes: PlannedFix[]): MergedFix[] {
    // Sort by position (bottom to top to preserve line numbers)
    const sorted = fixes.sort((a, b) => b.line - a.line);
    
    const merged: MergedFix[] = [];
    let currentLine = -1;
    let currentFixes: PlannedFix[] = [];
    
    for (const fix of sorted) {
      if (fix.line !== currentLine) {
        // New line, flush current
        if (currentFixes.length > 0) {
          merged.push(this.mergeLine(currentFixes));
        }
        currentLine = fix.line;
        currentFixes = [fix];
      } else {
        // Same line, accumulate
        currentFixes.push(fix);
      }
    }
    
    // Flush remaining
    if (currentFixes.length > 0) {
      merged.push(this.mergeLine(currentFixes));
    }
    
    return merged;
  }
}
```

## Safe vs Unsafe Fixes

### Safe Fixes

```typescript
const SAFE_FIX_PATTERNS = [
  // Formatting
  /^Add missing semicolon$/,
  /^Fix indentation$/,
  /^Remove trailing whitespace$/,
  /^Add newline at end of file$/,
  
  // Imports
  /^Sort imports$/,
  /^Remove unused import$/,
  
  // Simple corrections
  /^Remove unused variable$/,
  /^Add missing comma$/,
  /^Fix quote style$/
];

function isSafeFix(description: string): boolean {
  return SAFE_FIX_PATTERNS.some(pattern => 
    pattern.test(description)
  );
}
```

### Unsafe Fixes

```typescript
const UNSAFE_FIX_PATTERNS = [
  // Potentially breaking
  /^Change .* to .*/,
  /^Convert .* to .*/,
  /^Replace .* with .*/,
  
  // Logic changes
  /^Add missing return statement$/,
  /^Change comparison operator$/,
  
  // Type changes
  /^Add type annotation$/,
  /^Change type to .*/
];

function requiresConfirmation(fix: PlannedFix): boolean {
  return UNSAFE_FIX_PATTERNS.some(pattern => 
    pattern.test(fix.description)
  );
}
```

## Rollback Mechanism

### Transaction-Based Fixing

```typescript
class TransactionalFixer {
  private backups = new Map<string, string>();
  
  async beginTransaction(files: string[]): Promise<void> {
    for (const file of files) {
      const content = await this.readFile(file);
      this.backups.set(file, content);
    }
  }
  
  async commit(): Promise<void> {
    this.backups.clear();
  }
  
  async rollback(): Promise<void> {
    for (const [file, content] of this.backups) {
      await this.writeFile(file, content);
    }
    this.backups.clear();
  }
  
  async applyFixesTransactionally(
    fixes: FixPlan
  ): Promise<FixResult> {
    await this.beginTransaction(fixes.files);
    
    try {
      const result = await this.applyFixes(fixes);
      
      if (result.success) {
        await this.commit();
        return result;
      } else {
        await this.rollback();
        throw new Error('Fix application failed');
      }
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
```

## Incremental Fixing

### Progressive Fix Application

```typescript
class IncrementalFixer {
  async fixIncrementally(
    file: FileInfo,
    issues: ValidationIssue[]
  ): Promise<IncrementalResult> {
    const results: FixIteration[] = [];
    let currentContent = file.content;
    let remainingIssues = [...issues];
    let iteration = 0;
    
    while (remainingIssues.length > 0 && iteration < 5) {
      // Apply one round of fixes
      const result = await this.applyOneRound(
        currentContent,
        remainingIssues
      );
      
      results.push({
        iteration,
        fixed: result.fixed,
        remaining: result.remaining
      });
      
      if (result.fixed.length === 0) {
        // No more fixable issues
        break;
      }
      
      currentContent = result.content;
      remainingIssues = result.remaining;
      iteration++;
    }
    
    return {
      finalContent: currentContent,
      iterations: results,
      totalFixed: results.reduce((sum, r) => sum + r.fixed.length, 0),
      unfixable: remainingIssues
    };
  }
}
```

## Performance Optimization

### Batch Fixing

```typescript
class BatchFixer {
  async fixBatch(
    files: FileInfo[],
    issues: Map<string, ValidationIssue[]>
  ): Promise<BatchFixResult> {
    // Group files that can be fixed together
    const batches = this.createBatches(files);
    const results: FixResult[] = [];
    
    for (const batch of batches) {
      // Fix files in parallel within batch
      const batchResults = await Promise.all(
        batch.map(file => 
          this.fixFile(file, issues.get(file.path) || [])
        )
      );
      results.push(...batchResults);
    }
    
    return {
      total: files.length,
      fixed: results.filter(r => r.modified).length,
      results
    };
  }
  
  private createBatches(files: FileInfo[]): FileInfo[][] {
    // Batch by directory for better cache usage
    const byDir = new Map<string, FileInfo[]>();
    
    for (const file of files) {
      const dir = path.dirname(file.path);
      const batch = byDir.get(dir) || [];
      batch.push(file);
      byDir.set(dir, batch);
    }
    
    return Array.from(byDir.values());
  }
}
```

## Testing

### Unit Tests

```typescript
describe('AutoFixEngine', () => {
  it('should apply fixes in priority order', async () => {
    const issues = [
      mockIssue('lint', 80),
      mockIssue('format', 100),
      mockIssue('import', 90)
    ];
    
    const result = await engine.applyFixes(mockFile, issues);
    
    expect(result.fixes[0].type).toBe('format');
    expect(result.fixes[1].type).toBe('import');
    expect(result.fixes[2].type).toBe('lint');
  });
  
  it('should detect conflicts', () => {
    const fixes = [
      { line: 10, column: 5, change: 'add semicolon' },
      { line: 10, column: 5, change: 'remove semicolon' }
    ];
    
    const conflicts = resolver.detectConflicts(fixes);
    expect(conflicts).toHaveLength(1);
  });
  
  it('should rollback on failure', async () => {
    const fixer = new TransactionalFixer();
    const original = 'original content';
    
    try {
      await fixer.applyFixesTransactionally(failingFixes);
    } catch (error) {
      // Should rollback
    }
    
    const content = await readFile('test.ts');
    expect(content).toBe(original);
  });
});
```

## Configuration

```yaml
autoFix:
  enabled: true
  categories:
    format: true
    imports: true
    safeLint: true
    unsafeLint: false
    
  strategy:
    priority: sequential  # sequential | parallel
    conflictResolution: priority  # priority | interactive | skip
    rollbackOnError: true
    maxIterations: 5
    
  safety:
    requireConfirmation: false
    preserveLogic: true
    testAfterFix: false
```

## Best Practices

1. **Always fix formatting first** - Prevents conflicts with other fixes
2. **Group related fixes** - Apply all import fixes together
3. **Test after fixing** - Verify fixes didn't break anything
4. **Keep backup** - Always able to rollback
5. **Clear reporting** - Tell user exactly what was changed