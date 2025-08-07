# TypeScript Interfaces

## Core Interfaces

### File Information

```typescript
interface FileInfo {
  path: string;              // Absolute file path
  relativePath: string;      // Relative to project root
  content: string;          // File content
  hash?: string;            // Content hash for caching
  encoding?: string;        // File encoding (default: utf-8)
  stats?: FileStats;        // File metadata
}

interface FileStats {
  size: number;             // File size in bytes
  modified: Date;           // Last modified time
  created: Date;            // Creation time
}
```

### Validation Results

```typescript
interface ValidationResponse {
  status: 'success' | 'warning' | 'error';
  filesModified: boolean;
  summary: string;
  issues: ValidationIssue[];
  fixes: FixDetail[];
  statistics: ValidationStatistics;
  context?: CodeContext[];
}

interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: Severity;
  type: IssueType;
  message: string;
  rule?: string;
  autoFixed: boolean;
  fixable?: boolean;
  suggestion?: string;
}

type Severity = 'error' | 'warning' | 'info';
type IssueType = 'format' | 'lint' | 'type' | 'syntax' | 'import' | 'complexity';
```

### Fix Details

```typescript
interface FixDetail {
  file: string;
  fixCount: number;
  changes: Change[];
  appliedAt?: Date;
}

interface Change {
  line: number;
  column?: number;
  before: string;
  after: string;
  description?: string;
}

interface FixResult {
  success: boolean;
  modified: boolean;
  fixes: AppliedFix[];
  content: string;
  error?: Error;
}

interface AppliedFix {
  type: FixCategory;
  line: number;
  description: string;
  safe: boolean;
}

enum FixCategory {
  FORMAT = 'format',
  IMPORT = 'import',
  LINT_SAFE = 'lint_safe',
  LINT_UNSAFE = 'lint_unsafe',
  TYPE = 'type'
}
```

### Statistics

```typescript
interface ValidationStatistics {
  totalIssues: number;
  fixedIssues: number;
  remainingIssues: number;
  filesChecked: number;
  filesModified: number;
  duration?: number;        // Validation time in ms
  
  byType: Record<IssueType, number>;
  bySeverity: Record<Severity, number>;
  byFile?: Record<string, number>;
}
```

### Configuration

```typescript
interface Config {
  enabled: boolean;
  autoFix: boolean;
  blockOnErrors: boolean;
  validators: ValidatorConfig;
  include: string[];
  exclude: string[];
  hooks: HookConfig;
  notifications: NotificationConfig;
  performance: PerformanceConfig;
  severity: SeverityConfig;
  fixPriority: Record<string, number>;
}

interface ValidatorConfig {
  biome?: BiomeConfig;
  typescript?: TypeScriptConfig;
}

interface BiomeConfig {
  enabled: boolean;
  configPath: string;
  autoFix: boolean;
  version: 'auto' | '1.x' | '2.x';
  outputFormat: 'json' | 'text';
  rules: BiomeRules;
  fixUnsafe: boolean;
  v1Settings?: BiomeV1Settings;
  v2Settings?: BiomeV2Settings;
}

interface TypeScriptConfig {
  enabled: boolean;
  configPath: string;
  strict: boolean;
  checkJs: boolean;
  incremental: boolean;
  noEmitOnError: boolean;
  diagnosticOptions?: DiagnosticOptions;
}
```

### Hooks

```typescript
interface Hook {
  name: string;
  enabled: boolean;
  timeout: number;
  failureStrategy: FailureStrategy;
  execute(file: FileInfo): Promise<HookResult>;
}

type FailureStrategy = 'block' | 'warn' | 'ignore';

interface HookResult {
  success: boolean;
  modified: boolean;
  validation?: ValidationResponse;
  error?: Error;
  duration: number;
}

interface HookConfig {
  postWrite?: PostWriteConfig;
  preRead?: PreReadConfig;
  batchOperation?: BatchConfig;
}

interface PostWriteConfig {
  enabled: boolean;
  timeout: number;
  failureStrategy: FailureStrategy;
  autoFix: boolean;
  reportToUser: boolean;
  runValidators: string[];
}
```

### Validators

```typescript
interface Validator {
  name: string;
  enabled: boolean;
  
  initialize(config: any): Promise<void>;
  validate(file: FileInfo): Promise<ValidationResult>;
  fix?(file: FileInfo, issues: ValidationIssue[]): Promise<FixResult>;
  dispose?(): Promise<void>;
}

interface ValidationResult {
  validator: string;
  status: 'success' | 'warning' | 'error';
  issues: ValidationIssue[];
  statistics?: Partial<ValidationStatistics>;
  raw?: any;               // Raw output from tool
}
```

### Formatters

```typescript
interface Formatter {
  format(
    results: ValidationResult[],
    options: FormatterOptions
  ): Promise<ValidationResponse>;
}

interface FormatterOptions {
  format: 'structured' | 'plain' | 'verbose';
  includeContext: boolean;
  maxContextLines: number;
  showDiffs: boolean;
  maxDiffLines: number;
  removeColors: boolean;
  removeDecorations: boolean;
  useRelativePaths: boolean;
  simplifyMessages: boolean;
  groupByFile: boolean;
  sortBy: 'severity' | 'file' | 'type';
  collapseFixed: boolean;
  highlightUnfixed: boolean;
}
```

### Code Context

```typescript
interface CodeContext {
  issue: ValidationIssue;
  context: ContextLine[];
}

interface ContextLine {
  lineNumber: number;
  content: string;
  isErrorLine: boolean;
  highlight?: {
    start: number;
    end: number;
  };
}
```

### Biome Specific

```typescript
interface BiomeOutput {
  diagnostics: BiomeDiagnostic[];
  summary: {
    errors: number;
    warnings: number;
    information: number;
  };
}

interface BiomeDiagnostic {
  file_path: string;
  severity: 'error' | 'warning' | 'information';
  category: string;
  message: {
    content: string;
    elements: MessageElement[];
  };
  location: {
    path: string;
    span: {
      start: Position;
      end: Position;
    };
  };
  tags?: string[];
}

interface Position {
  line: number;
  column: number;
}
```

### TypeScript Specific

```typescript
interface TypeScriptDiagnostic {
  file?: string;
  start?: number;
  length?: number;
  messageText: string | DiagnosticMessageChain;
  category: DiagnosticCategory;
  code: number;
}

enum DiagnosticCategory {
  Warning = 0,
  Error = 1,
  Suggestion = 2,
  Message = 3
}

interface DiagnosticMessageChain {
  messageText: string;
  category: DiagnosticCategory;
  code: number;
  next?: DiagnosticMessageChain[];
}
```

### Cache

```typescript
interface CacheEntry<T> {
  value: T;
  hash: string;
  timestamp: number;
  ttl: number;
}

interface Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  isExpired(key: string): boolean;
}
```

### Events

```typescript
interface HookEvent {
  type: 'pre-write' | 'post-write' | 'pre-read' | 'batch';
  file?: FileInfo;
  files?: FileInfo[];
  timestamp: Date;
}

interface ValidationEvent {
  type: 'validation-start' | 'validation-complete' | 'validation-error';
  validator: string;
  file: string;
  result?: ValidationResult;
  error?: Error;
  duration?: number;
}

interface FixEvent {
  type: 'fix-start' | 'fix-complete' | 'fix-error';
  file: string;
  fixes?: AppliedFix[];
  error?: Error;
}
```

### Errors

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public validator: string,
    public file: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class FixError extends Error {
  constructor(
    message: string,
    public file: string,
    public fixes: AppliedFix[],
    public cause?: Error
  ) {
    super(message);
    this.name = 'FixError';
  }
}

class ConfigError extends Error {
  constructor(
    message: string,
    public configPath: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}
```