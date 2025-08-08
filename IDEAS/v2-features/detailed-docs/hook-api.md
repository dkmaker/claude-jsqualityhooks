# Claude JS Quality Hooks - Hook API Reference

Hook system API for the `claude-jsqualityhooks` package.

## Hook Manager

The main entry point for managing hooks in Claude JS Quality Hooks.

### Class: HookManager

```typescript
import { HookManager, Config } from 'claude-jsqualityhooks';

class HookManager {
  constructor(config: Config);
  
  // Hook registration
  register(hook: Hook): void;
  unregister(hookName: string): void;
  
  // Hook execution
  async executePostWrite(file: FileInfo): Promise<HookResult>;
  async executePreRead(file: FileInfo): Promise<HookResult>;
  async executeBatch(files: FileInfo[]): Promise<BatchResult>;
  
  // Lifecycle
  async initialize(): Promise<void>;
  async dispose(): Promise<void>;
}
```

## Hook Implementation

### Creating a Custom Hook

```typescript
import { Hook, FileInfo, HookResult } from 'claude-jsqualityhooks';

export class CustomHook implements Hook {
  name = 'custom-hook';
  enabled = true;
  timeout = 5000;
  failureStrategy = 'warn' as const;
  
  async execute(file: FileInfo): Promise<HookResult> {
    const startTime = Date.now();
    
    try {
      // Your hook logic here
      const validation = await this.validate(file);
      
      return {
        success: true,
        modified: false,
        validation,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        modified: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }
  
  private async validate(file: FileInfo) {
    // Implementation
  }
}
```

## Post-Write Hook

### Usage

```typescript
const postWriteHook = new PostWriteHook(config);

// Execute on file write
const result = await postWriteHook.execute({
  path: '/path/to/file.ts',
  relativePath: 'src/file.ts',
  content: 'file content...'
});

if (result.modified) {
  console.log('File was modified by hooks');
}
```

## Pre-Read Hook

### Usage

```typescript
const preReadHook = new PreReadHook(config);

// Execute before file read
const result = await preReadHook.execute(file);

// Use cleaned content
const content = result.modified 
  ? result.validation?.fixes[0].content 
  : file.content;
```

## Batch Operation Hook

### Usage

```typescript
const batchHook = new BatchOperationHook(config);

// Process multiple files
const results = await batchHook.executeBatch(files);

console.log(`Processed ${results.processed} files`);
console.log(`Modified ${results.modified} files`);
```

## Hook Events

### Event Subscription

```typescript
hookManager.on('hook:executed', (event: HookExecutedEvent) => {
  console.log(`Hook ${event.hookName} executed in ${event.duration}ms`);
});

hookManager.on('hook:error', (event: HookErrorEvent) => {
  console.error(`Hook ${event.hookName} failed:`, event.error);
});
```

## Error Handling

### Timeout Handling

```typescript
async function executeWithTimeout(
  hook: Hook,
  file: FileInfo
): Promise<HookResult> {
  return Promise.race([
    hook.execute(file),
    timeout(hook.timeout).then(() => ({
      success: false,
      modified: false,
      error: new Error(`Hook timeout after ${hook.timeout}ms`),
      duration: hook.timeout
    }))
  ]);
}
```

## Testing Hooks

### Mock Hook for Testing

```typescript
class MockHook implements Hook {
  name = 'mock-hook';
  enabled = true;
  timeout = 1000;
  failureStrategy = 'warn' as const;
  
  constructor(
    private mockResult: HookResult
  ) {}
  
  async execute(file: FileInfo): Promise<HookResult> {
    return this.mockResult;
  }
}

// Usage in tests
const mockHook = new MockHook({
  success: true,
  modified: true,
  duration: 100
});
```