# Notification Customization (v2 Feature)

> **Status**: Candidate for v2.0  
> **Current v1**: AI-optimized output only

## Overview

In v2, output format and content can be customized. This is NOT available in v1.

## Proposed Configuration

```yaml
# v2 ONLY - Not available in v1
notifications:
  format: structured          # structured | plain | verbose
  
  # Content settings
  showDiffs: true            # Show before/after for fixes
  showFixSuggestions: true   # Suggest how to fix issues
  includeContext: true       # Include surrounding code
  maxContextLines: 3         # Lines of context
  maxDiffLines: 30          # Limit diff size
  
  # AI optimization
  removeColors: true         # Strip ANSI codes
  removeDecorations: true    # Remove Unicode
  useRelativePaths: true    # Relative vs absolute
  simplifyMessages: true     # Rewrite for clarity
  
  # Organization
  groupByFile: true         # Group by file
  sortBy: severity          # severity | file | type
  collapseFixed: true       # Summarize fixes
  highlightUnfixed: true    # Emphasize remaining
```

## v1 Behavior (Current)

In v1, output is automatically optimized for Claude:
- Format: Always AI-friendly structured JSON
- Colors: Always stripped
- Paths: Always relative
- Messages: Always simplified
- Grouping: Always by file
- Sorting: Always by severity

## Benefits of Deferring to v2

- One less thing to configure
- Consistent output format
- Optimized for AI consumption
- No conflicting settings

## Use Cases for v2

1. **Human Review**: Different format for human vs AI
2. **CI/CD Output**: Plain text for logs
3. **IDE Integration**: Structured for parsing
4. **Debugging**: Verbose mode with full context
5. **Custom Reporting**: Specific format requirements

## Output Formats (v2)

### Structured (Default)
```json
{
  "status": "warning",
  "filesModified": true,
  "summary": "Fixed 3 issues, 2 remaining",
  "issues": [...]
}
```

### Plain
```
✓ Fixed 3 formatting issues
⚠ 2 type errors remaining
  src/index.ts:10 - Missing type annotation
  src/utils.ts:25 - Type mismatch
```

### Verbose
Full details with context, diffs, and suggestions.

## Implementation Notes

- Default to AI-optimized format
- Provide format presets
- Consider output size limits
- Support multiple output targets