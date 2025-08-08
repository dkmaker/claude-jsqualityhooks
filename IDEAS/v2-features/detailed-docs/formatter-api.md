# Claude JS Quality Hooks - Formatter API Reference

Output formatting API for the `claude-jsqualityhooks` package.

## Main Formatter

The primary output formatter for Claude JS Quality Hooks validation results.

### Class: AIOutputFormatter

```typescript
import { AIOutputFormatter, Formatter, FormatterOptions } from 'claude-jsqualityhooks';

class AIOutputFormatter implements Formatter {
  constructor(options: FormatterOptions);
  
  // Main formatting method
  async format(
    results: ValidationResult[],
    options?: Partial<FormatterOptions>
  ): Promise<ValidationResponse>;
  
  // Utility methods
  simplifyMessage(message: string): string;
  cleanTerminalOutput(text: string): string;
  addCodeContext(issue: ValidationIssue): Promise<CodeContext>;
}
```

## Biome JSON Parser

### Class: BiomeJsonParser

```typescript
class BiomeJsonParser {
  parse(jsonOutput: string): ParsedBiomeResult;
  
  extractIssues(diagnostics: BiomeDiagnostic[]): ValidationIssue[];
  extractSummary(summary: BiomeSummary): ValidationStatistics;
  
  mapSeverity(biomeSeverity: string): Severity;
  extractMessage(messageObj: any): string;
}
```

## TypeScript Formatter

### Class: TypeScriptFormatter

```typescript
class TypeScriptFormatter {
  format(diagnostic: ts.Diagnostic): ValidationIssue;
  
  formatMultiple(diagnostics: ts.Diagnostic[]): ValidationIssue[];
  
  simplifyMessage(messageText: string | ts.DiagnosticMessageChain): string;
  getSuggestion(errorCode: number): string | undefined;
}
```

## Message Simplifier

### Class: MessageSimplifier

```typescript
class MessageSimplifier {
  private patterns: SimplificationPattern[];
  
  simplify(message: string): string;
  addPattern(pattern: RegExp, replacement: string): void;
  removeJargon(text: string): string;
}

interface SimplificationPattern {
  pattern: RegExp;
  replacement: string;
  priority?: number;
}
```

## Usage Examples

### Basic Formatting

Configuration is loaded from `claude-jsqualityhooks.config.yaml` by default.

```typescript
import { AIOutputFormatter } from 'claude-jsqualityhooks';

const formatter = new AIOutputFormatter({
  format: 'structured',
  simplifyMessages: true,
  removeColors: true
});

const response = await formatter.format(validationResults);
console.log(response.summary);
```

### Custom Message Simplification

```typescript
const simplifier = new MessageSimplifier();

simplifier.addPattern(
  /Cannot find module '(.+?)'/,
  'Module $1 is not installed'
);

const simple = simplifier.simplify(technicalMessage);
```

### Parsing Biome Output

```typescript
const parser = new BiomeJsonParser();

const biomeOutput = await exec('biome check --reporter=json file.ts');
const parsed = parser.parse(biomeOutput.stdout);

console.log(`Found ${parsed.issues.length} issues`);
```

## Output Templates

### Creating Custom Templates

```typescript
class CustomTemplate {
  static success(stats: ValidationStatistics): string {
    return `✓ All ${stats.filesChecked} files are valid`;
  }
  
  static warning(response: ValidationResponse): string {
    return `⚠ ${response.statistics.totalIssues} issues found`;
  }
  
  static error(response: ValidationResponse): string {
    return `✗ ${response.statistics.remainingIssues} errors need fixing`;
  }
}
```

## Context Provider

### Adding Code Context

```typescript
const contextProvider = new CodeContextProvider();

const context = await contextProvider.getContext(issue, {
  lines: 3,          // Lines before/after
  highlight: true,   // Highlight error position
  syntax: 'typescript' // Syntax highlighting
});

console.log(context.context.map(line => 
  `${line.lineNumber}: ${line.content}`
).join('\n'));
```

## Testing Formatters

### Mock Formatter

```typescript
class MockFormatter implements Formatter {
  async format(
    results: ValidationResult[]
  ): Promise<ValidationResponse> {
    return {
      status: 'success',
      filesModified: false,
      summary: 'Mock validation complete',
      issues: [],
      fixes: [],
      statistics: {
        totalIssues: 0,
        fixedIssues: 0,
        remainingIssues: 0,
        filesChecked: 1,
        filesModified: 0,
        byType: {},
        bySeverity: {}
      }
    };
  }
}
```