# AI-Optimized Output Formatter

## Overview

The AI Output Formatter transforms raw validation results from various tools into a standardized, Claude-friendly format that is easy to parse and understand.

## Core Principles

1. **Clarity**: Remove technical jargon and terminal formatting
2. **Structure**: Consistent format across all validators
3. **Context**: Include relevant code context
4. **Actionability**: Clear instructions for fixing issues
5. **Brevity**: Concise messages without losing information

## Standard Response Format

### ValidationResponse Interface

```typescript
interface ValidationResponse {
  // Overall status
  status: 'success' | 'warning' | 'error';
  filesModified: boolean;
  summary: string;  // One-line summary for Claude
  
  // Detailed issues
  issues: ValidationIssue[];
  
  // Applied fixes
  fixes: FixDetail[];
  
  // Statistics
  statistics: ValidationStatistics;
  
  // Optional context
  context?: CodeContext[];
}

interface ValidationIssue {
  file: string;           // Relative path
  line: number;           // 1-based line number
  column: number;         // 1-based column number
  severity: 'error' | 'warning' | 'info';
  type: 'format' | 'lint' | 'type' | 'syntax';
  message: string;        // Simplified message
  rule?: string;          // Rule ID (e.g., TS2322)
  autoFixed: boolean;     // Was this auto-fixed?
  suggestion?: string;    // How to fix it
}

interface FixDetail {
  file: string;
  fixCount: number;
  changes: {
    line: number;
    before: string;
    after: string;
  }[];
}

interface ValidationStatistics {
  totalIssues: number;
  fixedIssues: number;
  remainingIssues: number;
  filesChecked: number;
  filesModified: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}
```

## Message Simplification

### Technical to Human-Readable

```typescript
class MessageSimplifier {
  private patterns = [
    // TypeScript errors
    {
      pattern: /Type '(.+?)' is not assignable to type '(.+?)'/,
      replacement: 'Cannot use $1 where $2 is expected'
    },
    {
      pattern: /Property '(.+?)' does not exist on type '(.+?)'/,
      replacement: '$1 is not a valid property of $2'
    },
    {
      pattern: /Cannot find name '(.+?)'/,
      replacement: '$1 is not defined'
    },
    
    // Biome messages
    {
      pattern: /This (.+?) is unused/,
      replacement: 'Unused $1 should be removed'
    },
    {
      pattern: /Expected (.+?) but found (.+?)/,
      replacement: 'Replace $2 with $1'
    },
    
    // General patterns
    {
      pattern: /\bAST\b/g,
      replacement: 'syntax tree'
    },
    {
      pattern: /\btoken\b/gi,
      replacement: 'element'
    }
  ];
  
  simplify(message: string): string {
    let simplified = message;
    
    for (const { pattern, replacement } of this.patterns) {
      simplified = simplified.replace(pattern, replacement);
    }
    
    // Remove file paths from messages
    simplified = simplified.replace(/[\/\\]?([\w-]+[\/\\])+/g, '');
    
    // Trim and clean up
    return simplified.trim();
  }
}
```

## Formatting Pipeline

### Processing Flow

```typescript
class AIOutputFormatter {
  private simplifier = new MessageSimplifier();
  private contextProvider = new CodeContextProvider();
  
  async format(
    results: RawValidationResult,
    options: FormatterOptions
  ): Promise<ValidationResponse> {
    // 1. Parse raw output
    const parsed = this.parseRawOutput(results);
    
    // 2. Simplify messages
    const simplified = this.simplifyMessages(parsed);
    
    // 3. Add code context if requested
    const withContext = options.includeContext
      ? await this.addContext(simplified)
      : simplified;
    
    // 4. Group and sort
    const organized = this.organizeResults(withContext, options);
    
    // 5. Generate summary
    const summary = this.generateSummary(organized);
    
    // 6. Build response
    return this.buildResponse(organized, summary);
  }
}
```

## Output Cleaning

### Removing Terminal Formatting

```typescript
class TerminalCleaner {
  cleanOutput(text: string): string {
    return text
      // Remove ANSI color codes
      .replace(/\x1b\[[0-9;]*m/g, '')
      // Remove cursor movements
      .replace(/\x1b\[[0-9]*[A-Z]/g, '')
      // Remove Unicode box drawing
      .replace(/[│├└─┌┐┘┴┬┤]/g, '')
      // Remove emoji (optional)
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

### Path Simplification

```typescript
function simplifyPath(fullPath: string): string {
  // Convert to relative path
  const relative = path.relative(process.cwd(), fullPath);
  
  // Normalize separators
  const normalized = relative.replace(/\\/g, '/');
  
  // Remove redundant parts
  return normalized
    .replace(/^\.\//g, '')
    .replace(/\/index\.(ts|js)$/, '');
}
```

## Context Addition

### Code Context Provider

```typescript
class CodeContextProvider {
  async getContext(
    issue: ValidationIssue,
    lines: number = 3
  ): Promise<CodeContext> {
    const fileContent = await fs.readFile(issue.file, 'utf-8');
    const fileLines = fileContent.split('\n');
    
    const startLine = Math.max(0, issue.line - lines - 1);
    const endLine = Math.min(fileLines.length, issue.line + lines);
    
    return {
      issue,
      context: fileLines
        .slice(startLine, endLine)
        .map((line, idx) => ({
          lineNumber: startLine + idx + 1,
          content: line,
          isErrorLine: startLine + idx + 1 === issue.line
        }))
    };
  }
}
```

## Notification Templates

### Success Template

```typescript
function formatSuccess(stats: ValidationStatistics): string {
  return `✅ VALIDATION SUCCESSFUL

All ${stats.filesChecked} files passed validation.
No issues found.`;
}
```

### Warning Template

```typescript
function formatWarning(response: ValidationResponse): string {
  const { fixes, issues, statistics } = response;
  
  return `⚠️ VALIDATION COMPLETE: ${statistics.totalIssues} issues found, ${statistics.fixedIssues} auto-fixed

FILES MODIFIED BY HOOKS:
${fixes.map(f => `• ${f.file} - ${f.fixCount} issues fixed`).join('\n')}

REMAINING ISSUES (require manual fix):
${issues.filter(i => !i.autoFixed)
  .map(i => `• ${i.file}:${i.line}:${i.column} - ${i.message} (${i.rule || i.type})`)
  .join('\n')}

${response.summary}`;
}
```

### Error Template

```typescript
function formatError(response: ValidationResponse): string {
  const errors = response.issues.filter(i => i.severity === 'error');
  
  return `❌ VALIDATION FAILED: ${errors.length} errors found

ERRORS:
${errors.map(e => 
  `• ${e.file}:${e.line}:${e.column} - ${e.message} (${e.rule || e.type})`
).join('\n')}

${response.summary}

These errors must be fixed before proceeding.`;
}
```

## Biome JSON Parsing

### Parser Implementation

```typescript
class BiomeJsonParser {
  parse(jsonOutput: string): ParsedBiomeResult {
    const data = JSON.parse(jsonOutput);
    
    return {
      issues: this.extractIssues(data.diagnostics),
      summary: this.extractSummary(data.summary),
      metadata: this.extractMetadata(data)
    };
  }
  
  private extractIssues(diagnostics: any[]): ValidationIssue[] {
    return diagnostics.map(d => ({
      file: simplifyPath(d.file_path),
      line: d.location.span.start.line,
      column: d.location.span.start.column,
      severity: this.mapSeverity(d.severity),
      type: d.category,
      message: this.extractMessage(d.message),
      rule: d.tags?.[0] || undefined,
      autoFixed: false
    }));
  }
  
  private extractMessage(messageObj: any): string {
    if (typeof messageObj === 'string') return messageObj;
    if (messageObj.content) return messageObj.content;
    if (messageObj.elements) {
      return messageObj.elements
        .map((e: any) => e.content || '')
        .join(' ');
    }
    return 'Unknown issue';
  }
}
```

## TypeScript Error Formatting

### Diagnostic Formatter

```typescript
class TypeScriptFormatter {
  format(diagnostic: ts.Diagnostic): ValidationIssue {
    const { file, start } = diagnostic;
    const position = file && start !== undefined
      ? file.getLineAndCharacterOfPosition(start)
      : { line: 0, character: 0 };
    
    return {
      file: file ? simplifyPath(file.fileName) : 'unknown',
      line: position.line + 1,
      column: position.character + 1,
      severity: this.mapCategory(diagnostic.category),
      type: 'type',
      message: this.simplifyTsMessage(diagnostic.messageText),
      rule: `TS${diagnostic.code}`,
      autoFixed: false,
      suggestion: this.getSuggestion(diagnostic.code)
    };
  }
  
  private simplifyTsMessage(messageText: string | ts.DiagnosticMessageChain): string {
    const text = typeof messageText === 'string' 
      ? messageText 
      : this.flattenMessageChain(messageText);
    
    return this.simplifier.simplify(text);
  }
  
  private getSuggestion(code: number): string | undefined {
    const suggestions: Record<number, string> = {
      2322: 'Check the variable types match the expected type',
      2339: 'Check if the property name is spelled correctly',
      2304: 'Import or declare the variable before using it',
      2345: 'Ensure function arguments match the expected types'
    };
    
    return suggestions[code];
  }
}
```

## Configuration

### Formatter Options

```yaml
notifications:
  # Output format
  format: structured  # structured | plain | verbose
  
  # Content options
  includeContext: true
  maxContextLines: 3
  showDiffs: true
  maxDiffLines: 30
  
  # Simplification
  simplifyMessages: true
  removeColors: true
  removeDecorations: true
  useRelativePaths: true
  
  # Organization
  groupByFile: true
  sortBy: severity  # severity | file | type
  collapseFixed: true
  highlightUnfixed: true
  
  # Limits
  maxIssuesShown: 50
  truncateLongMessages: true
  maxMessageLength: 200
```

## Testing

### Unit Tests

```typescript
describe('AIOutputFormatter', () => {
  it('should remove ANSI codes', () => {
    const input = '\x1b[31mError\x1b[0m: failed';
    const output = cleaner.cleanOutput(input);
    expect(output).toBe('Error: failed');
  });
  
  it('should simplify TypeScript messages', () => {
    const input = "Type 'string' is not assignable to type 'number'";
    const output = simplifier.simplify(input);
    expect(output).toBe('Cannot use string where number is expected');
  });
  
  it('should format for Claude', () => {
    const result = formatter.format(mockValidationResult);
    expect(result.summary).toBeDefined();
    expect(result.issues).toBeInstanceOf(Array);
  });
});
```

## Performance Considerations

### Caching Formatted Output

```typescript
class FormatterCache {
  private cache = new Map<string, ValidationResponse>();
  
  get(key: string): ValidationResponse | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, response: ValidationResponse): void {
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, response);
  }
}
```

## Best Practices

1. **Keep messages concise** - AI works better with brief, clear messages
2. **Use consistent terminology** - Don't mix "error", "issue", "problem"
3. **Provide actionable information** - Include how to fix, not just what's wrong
4. **Group related issues** - Makes it easier for AI to understand patterns
5. **Avoid technical details** - Focus on what needs to be done