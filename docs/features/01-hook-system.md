# Hook System

> Part of **Claude JS Quality Hooks** (`claude-jsqualityhooks`)

## Overview

The hook system intercepts post-write operations from Claude Code and triggers validation and fixing workflows. The system uses smart defaults with minimal configuration required.

## Post-Write Hook

**Purpose**: Primary validation and fixing mechanism that runs after Claude writes or modifies files.

**Trigger Events**:
- File creation
- File modification
- Any write operation from Claude

**Workflow**:
```typescript
async function onPostWrite(file: FileInfo): Promise<void> {
  // 1. Check if file should be validated (based on include/exclude)
  if (!shouldValidate(file)) return;
  
  // 2. Run validators in parallel
  const results = await Promise.all([
    biomeValidator.validate(file),
    typescriptValidator.validate(file)
  ]);
  
  // 3. Apply auto-fixes if enabled
  if (config.autoFix && hasFixableIssues(results)) {
    const fixed = await applyFixes(file, results);
    await writeFile(file.path, fixed.content);
  }
  
  // 4. Notify Claude with AI-optimized format
  await notifyClaude(formatForAI(results));
}
```

**Key Features**:
- Validates complete file content
- Applies automatic fixes when enabled
- Biome version auto-detection
- AI-optimized output format
- Non-blocking operation (warns but doesn't block)

## Smart Defaults

The hook system uses these defaults:
- **Timeout**: 5 seconds
- **Failure Strategy**: Warn but don't block
- **Execution**: Parallel validators
- **Output**: AI-optimized format
- **Fix Order**: Format → Imports → Lint

## File Pattern Matching

Files are validated based on the optional `include` and `exclude` patterns:

```yaml
# Optional - has smart defaults
include:
  - "src/**/*.{ts,tsx,js,jsx}"
exclude:
  - "node_modules/**"
  - "dist/**"
```

If not specified:
- **Default Include**: All `.ts`, `.tsx`, `.js`, `.jsx` files
- **Default Exclude**: `node_modules/`, `dist/`, `build/`

## Biome Version Handling

Automatic Biome version detection ensures compatibility:

```typescript
// Automatic version detection
const biomeVersion = await detectBiomeVersion(); // Returns '1.x' or '2.x'

// Adapter pattern for version differences
const adapter = biomeVersion === '1.x' 
  ? new BiomeV1Adapter()  // Uses --apply
  : new BiomeV2Adapter(); // Uses --write
```

## Error Handling

Robust error handling ensures reliability:
- Validation failures don't block file operations
- Partial results are reported if one validator fails
- All errors are logged but operations continue
- Claude is always notified of the outcome

## Performance

Performance optimizations are built-in:
- Validators run in parallel
- Biome version is cached per session
- Results are debounced for rapid changes
- Automatic optimization without configuration