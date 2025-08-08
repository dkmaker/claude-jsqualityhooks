# Phase 4: AI Output Formatting

## Overview

Phase 4 implements the AI-optimized output formatter for Claude JS Quality Hooks that converts raw validation results into Claude-friendly format.

## Goals

1. Parse JSON from Biome
2. Format TypeScript diagnostics
3. Simplify technical messages
4. Remove terminal formatting
5. Create structured responses

## Key Implementation Files

- `src/formatters/aiOutputFormatter.ts`
- `src/formatters/biomeJsonParser.ts`
- `src/formatters/typescriptFormatter.ts`
- `src/formatters/messageSimplifier.ts`
- `src/notifications/claudeNotifier.ts`

## Message Simplifier

```typescript
// src/formatters/messageSimplifier.ts
export class MessageSimplifier {
  simplify(message: string, context: ValidationContext): string {
    // Remove ANSI escape codes
    const cleanMessage = this.removeAnsiCodes(message);
    
    // Simplify technical jargon
    const simplified = this.simplifyTechnicalTerms(cleanMessage);
    
    // Add helpful context
    return this.addContext(simplified, context);
  }
  
  private removeAnsiCodes(message: string): string {
    return message.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
  }
  
  private simplifyTechnicalTerms(message: string): string {
    const replacements = {
      'Type \'.*\' is not assignable': 'Type mismatch',
      'Argument of type \'.*\' is not assignable': 'Wrong argument type',
      'Property \'.*\' does not exist': 'Property not found'
    };
    
    let result = message;
    for (const [pattern, replacement] of Object.entries(replacements)) {
      result = result.replace(new RegExp(pattern, 'g'), replacement);
    }
    
    return result;
  }
}
```

## Biome JSON Parser

```typescript
// src/formatters/biomeJsonParser.ts
export class BiomeJsonParser {
  parse(jsonOutput: string): ParsedBiomeResult {
    try {
      const data = JSON.parse(jsonOutput);
      return this.transformToStandardFormat(data);
    } catch (error) {
      // Fall back to text parsing if JSON parsing fails
      return this.parseTextOutput(jsonOutput);
    }
  }
  
  private transformToStandardFormat(data: any): ParsedBiomeResult {
    const issues: ValidationIssue[] = [];
    
    // Handle diagnostics array
    if (data.diagnostics) {
      for (const diagnostic of data.diagnostics) {
        issues.push({
          file: diagnostic.location?.path || '',
          line: diagnostic.location?.span?.start || 0,
          column: diagnostic.location?.span?.start || 0,
          message: diagnostic.description || '',
          severity: this.mapSeverity(diagnostic.severity),
          rule: diagnostic.category || '',
          fix: diagnostic.fixes?.[0] ? this.parseFix(diagnostic.fixes[0]) : undefined
        });
      }
    }
    
    return { issues, summary: this.createSummary(issues) };
  }
  
  private mapSeverity(biomeSeverity: string): 'error' | 'warning' | 'info' {
    switch (biomeSeverity?.toLowerCase()) {
      case 'error': return 'error';
      case 'warn': 
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}
```

## TypeScript Formatter

```typescript
// src/formatters/typescriptFormatter.ts
export class TypeScriptFormatter {
  format(diagnostics: ts.Diagnostic[]): FormattedDiagnostic[] {
    return diagnostics.map(diagnostic => {
      const file = diagnostic.file;
      const position = file ? file.getLineAndCharacterOfPosition(diagnostic.start!) : { line: 0, character: 0 };
      
      return {
        file: file?.fileName || '',
        line: position.line + 1,
        column: position.character + 1,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        severity: this.mapSeverity(diagnostic.category),
        code: diagnostic.code,
        source: 'typescript'
      };
    });
  }
  
  private mapSeverity(category: ts.DiagnosticCategory): 'error' | 'warning' | 'info' {
    switch (category) {
      case ts.DiagnosticCategory.Error: return 'error';
      case ts.DiagnosticCategory.Warning: return 'warning';
      default: return 'info';
    }
  }
}
```

## AI Output Formatter

```typescript
// src/formatters/aiOutputFormatter.ts
export class AIOutputFormatter {
  private simplifier = new MessageSimplifier();
  private biomeParser = new BiomeJsonParser();
  private tsFormatter = new TypeScriptFormatter();
  
  format(results: ValidationResult[]): ValidationResponse {
    const formattedResults = results.map(result => this.formatResult(result));
    
    return {
      summary: this.createSummary(formattedResults),
      issues: this.groupIssues(formattedResults),
      suggestions: this.extractSuggestions(formattedResults),
      autoFixApplied: this.getAutoFixInfo(formattedResults)
    };
  }
  
  private formatResult(result: ValidationResult): FormattedResult {
    return {
      validator: result.validator,
      success: result.success,
      issues: result.issues.map(issue => ({
        ...issue,
        message: this.simplifier.simplify(issue.message, {
          file: issue.file,
          validator: result.validator
        })
      })),
      duration: result.duration
    };
  }
  
  private createSummary(results: FormattedResult[]): ValidationSummary {
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    const errorCount = results.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.severity === 'error').length, 0);
    const warningCount = results.reduce((sum, result) => 
      sum + result.issues.filter(issue => issue.severity === 'warning').length, 0);
    
    return {
      totalValidators: results.length,
      totalIssues,
      errorCount,
      warningCount,
      overallSuccess: errorCount === 0
    };
  }
  
  private groupIssues(results: FormattedResult[]): GroupedIssues {
    const byFile = new Map<string, ValidationIssue[]>();
    const bySeverity = new Map<string, ValidationIssue[]>();
    
    for (const result of results) {
      for (const issue of result.issues) {
        // Group by file
        if (!byFile.has(issue.file)) {
          byFile.set(issue.file, []);
        }
        byFile.get(issue.file)!.push(issue);
        
        // Group by severity
        if (!bySeverity.has(issue.severity)) {
          bySeverity.set(issue.severity, []);
        }
        bySeverity.get(issue.severity)!.push(issue);
      }
    }
    
    return { byFile, bySeverity };
  }
}
```

## Claude Notifier

```typescript
// src/notifications/claudeNotifier.ts
export class ClaudeNotifier {
  async notify(response: ValidationResponse): Promise<void> {
    const output = this.formatForClaude(response);
    
    // Output to Claude Code interface
    console.log('=== Claude JS Quality Hooks Report ===');
    console.log(output);
  }
  
  private formatForClaude(response: ValidationResponse): string {
    const lines: string[] = [];
    
    // Summary
    lines.push(`Found ${response.summary.totalIssues} issues across ${response.summary.totalValidators} validators`);
    if (response.summary.errorCount > 0) {
      lines.push(`${response.summary.errorCount} errors need immediate attention`);
    }
    if (response.summary.warningCount > 0) {
      lines.push(`${response.summary.warningCount} warnings can be addressed later`);
    }
    
    // Issues by file
    for (const [file, issues] of response.issues.byFile) {
      lines.push(`\n📄 ${file}:`);
      for (const issue of issues) {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        lines.push(`  ${icon} Line ${issue.line}: ${issue.message}`);
        if (issue.fix) {
          lines.push(`     💡 Auto-fix available`);
        }
      }
    }
    
    return lines.join('\n');
  }
}
```

## Implementation Steps

### Step 1: Create Message Simplifier

Implement logic to clean and simplify technical messages for better AI understanding.

### Step 2: Build Format-Specific Parsers

Create parsers for Biome JSON output and TypeScript diagnostics.

### Step 3: Implement AI Output Formatter

Build the main formatter that combines all validation results into a structured response.

### Step 4: Create Claude Notifier

Implement the notification system that outputs results to Claude Code interface.

### Step 5: Add Context Enhancement

Enhance messages with helpful context and suggestions.

## Success Criteria

- [ ] Output is completely free of terminal formatting codes
- [ ] Technical messages are simplified for AI understanding
- [ ] Output structure is consistent across all validators
- [ ] Context and suggestions are included when helpful
- [ ] Claude can easily parse and understand the output
- [ ] Performance impact is minimal

## Testing

Create tests for output formatting:

```typescript
// tests/formatters/aiOutputFormatter.test.ts
describe('AIOutputFormatter', () => {
  it('should remove ANSI codes from messages', () => {
    // Test ANSI code removal
  });
  
  it('should simplify technical messages', () => {
    // Test message simplification
  });
  
  it('should group issues correctly', () => {
    // Test issue grouping
  });
});
```

## Next Steps

Proceed to [Phase 5: Testing](./phase-5-testing.md) to implement comprehensive testing and optimization.