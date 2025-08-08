# AI Output Formatter

> Part of **Claude JS Quality Hooks** (`claude-jsqualityhooks`)

## Overview

The AI Output Formatter creates consistent, AI-optimized output for Claude. It uses smart defaults optimized for AI consumption with no configuration required.

## Output Format

The formatter produces this structured format:

```typescript
interface AIFormattedOutput {
  status: 'success' | 'warning' | 'error';
  filesModified: boolean;
  summary: string;
  issues: {
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    fixed: boolean;
  }[];
  statistics: {
    totalIssues: number;
    fixedIssues: number;
    remainingIssues: number;
  };
}
```

## Formatting Rules

### 1. Terminal Cleanup
- ANSI color codes removed
- Unicode decorations stripped
- Control characters eliminated
- Plain text output only

### 2. Path Simplification
- Absolute paths → relative paths
- Home directory → `~`
- Backslashes → forward slashes
- Redundant segments removed

### 3. Message Simplification
- Technical jargon translated
- Error codes explained
- Context preserved
- Actionable information highlighted

## Example Transformations

### Before (Raw Biome Output)
```
\x1b[31m/Users/dev/project/src/index.ts:10:5\x1b[0m
  \x1b[33mwarning\x1b[0m: Missing semicolon
  \x1b[90m│\x1b[0m const value = 42
                     \x1b[31m^\x1b[0m
```

### After (AI-Formatted)
```json
{
  "file": "src/index.ts",
  "line": 10,
  "column": 5,
  "severity": "warning",
  "message": "Missing semicolon after statement",
  "fixed": true
}
```

## Integration Points

### From Biome
```typescript
function formatBiomeOutput(raw: BiomeOutput): FormattedIssue[] {
  return raw.diagnostics.map(d => ({
    file: makeRelative(d.file_path),
    line: d.location.span.start.line,
    column: d.location.span.start.column,
    severity: mapSeverity(d.severity),
    message: simplifyMessage(d.message.content),
    fixed: false  // Set later if auto-fix applied
  }));
}
```

### From TypeScript
```typescript
function formatTypeScriptOutput(diagnostics: ts.Diagnostic[]): FormattedIssue[] {
  return diagnostics.map(d => ({
    file: makeRelative(d.file?.fileName || ''),
    line: getLine(d),
    column: getColumn(d),
    severity: mapTsSeverity(d.category),
    message: simplifyTsMessage(d.messageText),
    fixed: false
  }));
}
```

## Summary Generation

The formatter automatically generates summaries:

```typescript
function generateSummary(issues: Issue[], fixed: number): string {
  if (issues.length === 0) {
    return "✓ All checks passed - no issues found";
  }
  
  if (fixed === issues.length) {
    return `✓ Fixed all ${fixed} issue${fixed > 1 ? 's' : ''}`;
  }
  
  if (fixed > 0) {
    return `Fixed ${fixed} issue${fixed > 1 ? 's' : ''}, ${issues.length - fixed} remaining`;
  }
  
  return `Found ${issues.length} issue${issues.length > 1 ? 's' : ''} to review`;
}
```

## Smart Defaults

All formatting is automatic:
- **Colors**: Always removed
- **Paths**: Always relative
- **Messages**: Always simplified
- **Format**: Always JSON structure
- **Grouping**: By file
- **Sorting**: By severity (errors first)
- **Context**: Minimal (line/column only)

## Design Principles

The formatter uses a consistent format to ensure:
1. **Consistency**: Same format every time
2. **Reliability**: No configuration errors
3. **Optimization**: Tuned for AI parsing
4. **Simplicity**: No options to misconfigure
5. **Clarity**: Focus on actionable information