# Phase 1: Core Infrastructure

## Overview

Phase 1 establishes the foundational infrastructure for the Claude JS Quality Hooks system, including configuration loading, basic hook structure, and Claude Code API integration.

## Goals

1. Set up TypeScript project structure
2. Implement YAML configuration loader
3. Create base hook classes
4. Establish Claude Code API integration
5. Set up logging and error handling

## Implementation Steps

### Step 1: Project Setup

#### Enable pnpm with Corepack

```bash
# Enable corepack (included with Node.js 18+)
corepack enable

# Prepare pnpm
corepack prepare pnpm@latest --activate

# Verify pnpm is available
pnpm --version
```

#### Initialize Project

```bash
# Initialize Claude JS Quality Hooks project
pnpm init

# Install core dependencies (production)
pnpm add commander yaml zod execa fast-glob

# Install dev dependencies
pnpm add -D typescript @types/node tsup vitest @biomejs/biome

# Initialize TypeScript
pnpm exec tsc --init
```

**Key Libraries**:
- `commander` - CLI framework for init/install commands
- `yaml` - YAML configuration file parsing
- `zod` - Runtime type validation with TS inference
- `execa` - Modern subprocess execution for Biome/TS
- `fast-glob` - Fast file pattern matching
- `tsup` - Zero-config TypeScript bundler

### Step 2: TypeScript Configuration

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
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

### Step 3: Build Configuration with tsup

Create `tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  shims: true,
  external: [],
  target: 'node18',
  splitting: false,
  treeshake: true,
});
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "dev": "tsup --watch --onSuccess 'node dist/cli.js'",
    "typecheck": "tsc --noEmit"
  }
}
```

### Step 4: Create Type Definitions

Create `src/types/index.ts` - See [interfaces.md](../api/interfaces.md) for complete types.

### Step 5: Configuration Loader

Create `src/config/yamlConfigLoader.ts`:
```typescript
import { readFile, access } from 'node:fs/promises';
import { parse } from 'yaml';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { Config } from '../types';

export class YamlConfigLoader {
  private config: Config | null = null;
  private readonly CONFIG_FILE = 'claude-jsqualityhooks.config.yaml';
  
  async load(): Promise<Config> {
    const configPath = resolve(process.cwd(), this.CONFIG_FILE);
    
    // Check if config file exists
    try {
      await access(configPath);
    } catch {
      this.showWarningAndExit();
    }
    
    // Load and parse config
    const content = await readFile(configPath, 'utf-8');
    this.config = parse(content) as Config;
    return this.validateConfig(this.config);
  }
  
  private showWarningAndExit(): never {
    console.warn(`
⚠️  Configuration file not found: ${this.CONFIG_FILE}

To get started:
1. Run: npx claude-jsqualityhooks init
   This will create ${this.CONFIG_FILE} in your project root

2. Or manually create ${this.CONFIG_FILE} with basic config:
   ---
   enabled: true
   validators:
     biome:
       enabled: true

Without this configuration file, the hook will not run.
For details, see: https://github.com/dkmaker/claude-jsqualityhooks#configuration
`);
    process.exit(0); // Exit gracefully, not an error
  }
  
  private validateConfig(config: Config): Config {
    // Add validation logic
    if (!config.enabled) {
      console.warn('⚠️  Hooks are disabled in configuration');
    }
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
  
  constructor(protected config: any) {}
  
  abstract execute(file: FileInfo): Promise<HookResult>;
  
  // Default configuration
  protected readonly timeout = 5000;
  protected readonly failureStrategy = 'warn';
  
  protected withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Hook timeout after ${this.timeout}ms`));
        }, this.timeout);
      })
    ]);
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
  
  // Will exit with warning if config doesn't exist
  const config = await configLoader.load();
  
  // Only initialize if config exists and is valid
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