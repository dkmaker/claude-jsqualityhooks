# Phase 1: Core Infrastructure

## Overview

Phase 1 establishes the foundational infrastructure for the hooks system, including configuration loading, basic hook structure, and Claude Code API integration.

## Goals

1. Set up TypeScript project structure
2. Implement YAML configuration loader
3. Create base hook classes
4. Establish Claude Code API integration
5. Set up logging and error handling

## Implementation Steps

### Step 1: Project Setup

```bash
# Initialize project
npm init -y
npm install typescript @types/node
npx tsc --init

# Install core dependencies
npm install yaml
npm install --save-dev @types/yaml
```

### Step 2: TypeScript Configuration

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Step 3: Create Type Definitions

Create `src/types/index.ts` - See [interfaces.md](../api/interfaces.md) for complete types.

### Step 4: Configuration Loader

Create `src/config/yamlConfigLoader.ts`:
```typescript
import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import * as path from 'path';
import { Config } from '../types';

export class YamlConfigLoader {
  private config: Config | null = null;
  
  async load(configPath?: string): Promise<Config> {
    const resolvedPath = await this.resolveConfigPath(configPath);
    const content = await fs.readFile(resolvedPath, 'utf-8');
    this.config = yaml.parse(content) as Config;
    return this.validateConfig(this.config);
  }
  
  private async resolveConfigPath(configPath?: string): Promise<string> {
    const paths = [
      configPath,
      './claude-hooks.config.yaml',
      './config/claude-hooks.yaml',
      path.join(process.env.HOME || '', '.claude-hooks/config.yaml')
    ].filter(Boolean) as string[];
    
    for (const p of paths) {
      try {
        await fs.access(p);
        return p;
      } catch {}
    }
    
    throw new Error('Configuration file not found');
  }
  
  private validateConfig(config: Config): Config {
    // Add validation logic
    return config;
  }
}
```

### Step 5: Base Hook Class

Create `src/hooks/baseHook.ts`:
```typescript
import { Hook, FileInfo, HookResult } from '../types';

export abstract class BaseHook implements Hook {
  abstract name: string;
  
  constructor(
    protected config: any,
    public enabled: boolean = true,
    public timeout: number = 5000,
    public failureStrategy: 'block' | 'warn' | 'ignore' = 'warn'
  ) {}
  
  abstract execute(file: FileInfo): Promise<HookResult>;
  
  protected async executeWithTimeout(
    operation: () => Promise<HookResult>
  ): Promise<HookResult> {
    return Promise.race([
      operation(),
      this.createTimeout()
    ]);
  }
  
  private createTimeout(): Promise<HookResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          modified: false,
          error: new Error(`Hook timeout after ${this.timeout}ms`),
          duration: this.timeout
        });
      }, this.timeout);
    });
  }
}
```

### Step 6: Hook Manager

Create `src/hooks/hookManager.ts`:
```typescript
import { Config, FileInfo, HookResult } from '../types';
import { PostWriteHook } from './postWrite';

export class HookManager {
  private hooks = new Map<string, Hook>();
  
  constructor(private config: Config) {
    this.initializeHooks();
  }
  
  private initializeHooks() {
    if (this.config.hooks.postWrite?.enabled) {
      this.hooks.set('postWrite', new PostWriteHook(this.config));
    }
  }
  
  async executePostWrite(file: FileInfo): Promise<HookResult> {
    const hook = this.hooks.get('postWrite');
    if (!hook) {
      return { success: true, modified: false, duration: 0 };
    }
    
    return hook.execute(file);
  }
}
```

### Step 7: Main Entry Point

Create `src/index.ts`:
```typescript
import { YamlConfigLoader } from './config/yamlConfigLoader';
import { HookManager } from './hooks/hookManager';

export async function initialize() {
  const configLoader = new YamlConfigLoader();
  const config = await configLoader.load();
  
  const hookManager = new HookManager(config);
  
  // Register with Claude Code API
  // This will be implementation-specific
  
  return hookManager;
}

export * from './types';
```

## Testing

Create basic tests for each component:

```typescript
// tests/config.test.ts
import { YamlConfigLoader } from '../src/config/yamlConfigLoader';

describe('YamlConfigLoader', () => {
  it('should load valid YAML config', async () => {
    const loader = new YamlConfigLoader();
    const config = await loader.load('./test-config.yaml');
    expect(config.enabled).toBeDefined();
  });
});
```

## Success Criteria

- [ ] TypeScript project compiles without errors
- [ ] Configuration loads from YAML file
- [ ] Base hook structure is extensible
- [ ] Error handling is robust
- [ ] Tests pass for all components

## Next Steps

Proceed to [Phase 2: Validators](./phase-2-validators.md) to implement Biome and TypeScript validators.