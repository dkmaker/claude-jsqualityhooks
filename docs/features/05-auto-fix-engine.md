# Auto-Fix Engine

> Part of **Claude JS Quality Hooks** (`claude-jsqualityhooks`)

## Overview

The Auto-Fix Engine applies safe fixes from validators when enabled. It uses smart defaults with minimal configuration.

## Configuration

```yaml
autoFix: true  # Enable automatic fixing
```

## How It Works

### 1. Check Configuration
```typescript
if (!config.autoFix) {
  return; // Don't apply any fixes
}
```

### 2. Collect Fixable Issues
```typescript
const fixableIssues = issues.filter(issue => issue.fixable);
if (fixableIssues.length === 0) {
  return; // Nothing to fix
}
```

### 3. Apply Fixes Sequentially
```typescript
// Default order: Format → Imports → Lint
let content = file.content;

// 1. Apply Biome fixes
if (biomeHasFixableIssues) {
  content = await applyBiomeFixes(content);
}

// 2. Apply TypeScript quick fixes
if (tsHasFixableIssues) {
  content = await applyTypeScriptFixes(content);
}

return content;
```

### 4. Write Fixed Content
```typescript
if (content !== file.content) {
  await writeFile(file.path, content);
  return { modified: true, fixes: countFixes(content, file.content) };
}
```

## Fix Order

The engine uses this fixed order:
1. **Format** - Prevents conflicts with other fixes
2. **Imports** - Organizes after formatting
3. **Lint** - Applies remaining safe fixes

## Safe Fixes Only

Only safe fixes are applied automatically:

### ✅ Applied Automatically
- Formatting (indentation, spacing)
- Import sorting
- Semicolon insertion
- Quote style normalization
- Trailing comma addition
- Unused import removal

### ❌ Not Applied Automatically
- Code refactoring
- Variable renaming
- Type changes
- Logic modifications
- Breaking changes

## Biome Fix Integration

```typescript
async function applyBiomeFixes(filePath: string): Promise<string> {
  const version = await detectBiomeVersion();
  const command = version === '1.x'
    ? ['check', filePath, '--apply', '--reporter=json']
    : ['check', filePath, '--write', '--reporter=json'];
    
  await exec(`biome ${command.join(' ')}`);
  return await readFile(filePath); // Read fixed content
}
```

## TypeScript Fix Integration

Simple TypeScript fixes are applied:

```typescript
async function applyTypeScriptFixes(content: string): Promise<string> {
  // Only simple, safe fixes
  const fixes = [
    removeMissingImports,
    addMissingSemicolons,
    removeUnusedVariables
  ];
  
  let result = content;
  for (const fix of fixes) {
    result = await fix(result);
  }
  return result;
}
```

## Notification After Fixes

Claude is always notified when fixes are applied:

```typescript
const notification = {
  filesModified: true,
  summary: `Auto-fixed ${fixCount} issue${fixCount > 1 ? 's' : ''}`,
  issues: remainingIssues,
  statistics: {
    totalIssues: originalCount,
    fixedIssues: fixCount,
    remainingIssues: originalCount - fixCount
  }
};
```

## Error Handling

- Fix failures don't block operations
- Partial fixes are kept
- Original file preserved on catastrophic failure
- All outcomes reported to Claude

## Design Principles

1. **Reliability**: Sequential application prevents conflicts
2. **Predictability**: Same order every time
3. **Safety**: Only safe fixes applied
4. **Simplicity**: Minimal configuration required