# Development Debug System

## Overview

The claude-jsqualityhooks debug system provides comprehensive logging and analysis capabilities for development. It captures the complete hook processing pipeline, allowing developers to debug Claude Code integration and understand how validation and fixing works.

**Important**: This system is development-only with zero production overhead and is completely excluded from npm distribution through multiple protection layers.

## Quick Start

### Enable Debug Mode

```bash
# Set environment variable and run
export CLAUDE_HOOKS_DEBUG=true
npx claude-jsqualityhooks

# Or inline for single command
CLAUDE_HOOKS_DEBUG=true npx claude-jsqualityhooks
```

### View Debug Output

```bash
# View latest session logs
pnpm debug:latest

# Watch logs in real-time
pnpm debug:tail

# Clear all debug data
pnpm debug:clear
```

## Debug Data Structure

When debug mode is enabled, data is captured in `.debug/` directory:

```
.debug/
├── session-001-input.json      # Hook input from Claude Code
├── session-001-processing.log  # Internal processing logs
├── session-001-output.json     # Response sent to Claude
├── session-002-input.json
├── session-002-processing.log
├── session-002-output.json
├── ...
├── session-010-input.json      # Auto-rotates, keeps last 10
├── session-010-processing.log
├── session-010-output.json
├── metadata.json               # Session tracking
└── README.md                   # Debug folder documentation
```

## File Contents

### session-XXX-input.json
Complete JSON payload received from Claude Code via stdin:
```json
{
  "session_id": "abc123...",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "const x = 1;"
  },
  "tool_response": {
    "success": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### session-XXX-processing.log
Detailed processing logs from all validators and fixers:
```
[2024-01-15T10:30:00.123Z] DEBUG Hook processing started
[2024-01-15T10:30:00.124Z] DEBUG Config loaded: enabled=true, autoFix=true
[2024-01-15T10:30:00.125Z] DEBUG File detected: /path/to/file.ts (TypeScript)
[2024-01-15T10:30:00.130Z] DEBUG Biome validation started
[2024-01-15T10:30:00.145Z] DEBUG Biome found 2 issues: formatting, lint
[2024-01-15T10:30:00.146Z] DEBUG TypeScript validation started
[2024-01-15T10:30:00.160Z] DEBUG TypeScript found 0 errors
[2024-01-15T10:30:00.161Z] DEBUG Auto-fix started (2 issues)
[2024-01-15T10:30:00.175Z] DEBUG Applied Biome formatting fix
[2024-01-15T10:30:00.180Z] DEBUG Applied Biome lint fix
[2024-01-15T10:30:00.181Z] DEBUG Verification: all issues resolved
[2024-01-15T10:30:00.182Z] DEBUG AI formatting started
[2024-01-15T10:30:00.185Z] DEBUG Response prepared
```

### session-XXX-output.json
Final response sent back to Claude Code via stdout:
```json
{
  "success": true,
  "modified": true,
  "issues_found": 2,
  "issues_fixed": 2,
  "messages": [
    "✅ Applied formatting fixes",
    "✅ Applied lint fixes",
    "File has been updated with fixes"
  ],
  "execution_time_ms": 62
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_HOOKS_DEBUG` | Enable/disable debug mode | `false` |
| `CLAUDE_HOOKS_DEBUG_SESSIONS` | Max sessions to keep | `10` |
| `CLAUDE_HOOKS_DEBUG_VERBOSE` | Extra detailed logging | `false` |


## Auto-Rotation

The debug system automatically manages storage:

- **Session Limit**: Keeps last 10 sessions by default
- **Automatic Cleanup**: When session 11 is created, session 1 is deleted
- **Atomic Operations**: Safe for concurrent access
- **Metadata Tracking**: Timestamps and session info in `metadata.json`

## Development Scripts

Add these to your development workflow:

```bash
# View latest processing log
pnpm debug:latest

# Watch logs in real-time
pnpm debug:tail

# Clear all debug data
pnpm debug:clear

# Show debug status
pnpm debug:status

# Archive current debug data
pnpm debug:archive
```

## Integration Points

### Hook Manager Integration
The debug system captures data at key points:

1. **Input Capture**: When hook receives Claude input
2. **Configuration Loading**: Config parsing and validation
3. **File Detection**: File type and pattern matching
4. **Validator Execution**: Each validator's processing
5. **Auto-Fix Processing**: Fix application and verification
6. **AI Formatting**: Output formatting for Claude
7. **Response Generation**: Final response preparation

### Performance Impact
- **Production**: Zero overhead (completely disabled)
- **Development**: Minimal impact (~1-2ms per hook execution)
- **Storage**: ~1-50KB per session depending on log verbosity

## Production Protection Strategy

The debug system uses **conditional inclusion** - debug code is built into the development version but protected from production use:

### Development vs Production Builds

#### Development Build (includes debug code)
- **Full source build**: `src/debug/` folder included in build
- **Debug modules available**: Can be imported when `CLAUDE_HOOKS_DEBUG=true`
- **Runtime conditional**: Debug code executes only when enabled
- **Used for**: Local development, testing, debugging

#### Production Build (excludes debug code) 
- **Stripped build**: Debug imports removed during production build
- **Dead code elimination**: Bundler removes unreachable debug code
- **Smaller bundle**: No debug overhead in final package
- **Used for**: NPM distribution to end users

### Build Configuration Strategy

```typescript
// tsup.config.ts - Different builds for dev vs prod
export default defineConfig([
  // Development build (includes debug)
  {
    entry: ['src/index.ts', 'src/cli.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: [], // Include all dependencies
  },
  // Production build (excludes debug)
  {
    entry: ['src/index.ts', 'src/cli.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [
      // Strip debug imports in production
      stripDebugPlugin()
    ]
  }
]);

// Custom plugin to strip debug imports and code
function stripDebugPlugin() {
  return {
    name: 'strip-debug',
    setup(build) {
      // Remove debug imports during build
      build.onResolve({ filter: /.*\/debug\/.*/ }, args => {
        return { path: args.path, external: true }
      })
      
      // Transform code to remove debug blocks
      build.onLoad({ filter: /\.(ts|js)$/ }, async (args) => {
        const fs = await import('fs')
        let contents = await fs.promises.readFile(args.path, 'utf8')
        
        // Remove debug import statements
        contents = contents.replace(
          /import.*from.*['"']\.\/debug\/.*['"'];?\n?/g, 
          ''
        )
        
        // Remove debug conditional blocks
        contents = contents.replace(
          /if\s*\(\s*process\.env\.CLAUDE_HOOKS_DEBUG.*?\)\s*\{[\s\S]*?\n\s*\}/g,
          ''
        )
        
        // Remove dynamic debug imports
        contents = contents.replace(
          /await\s+import\(['"`]\.\/debug\/.*['"`]\);?\n?/g,
          ''
        )
        
        return {
          contents,
          loader: args.path.endsWith('.ts') ? 'ts' : 'js'
        }
      })
    }
  }
}
```

### Runtime Conditional Pattern

```typescript
// Debug code is included in dev build, but only runs when enabled
export async function processHook(input: any) {
  // This import exists in dev build, stripped in prod build
  if (process.env.CLAUDE_HOOKS_DEBUG === 'true') {
    try {
      const { DebugCapture } = await import('./debug/DebugCapture.js');
      await DebugCapture.logInput(input);
    } catch {
      // Debug module not available (production build) - silently continue
    }
  }
  
  return processHookCore(input);
}
```

### NPM Distribution Protection

#### Published Package Contents
- **Only production build**: Debug-stripped version published to NPM
- **package.json "files"**: Specifies only `dist/` (production build)
- **No source code**: `src/` folder never published
- **End users get**: Clean, minimal package without debug code

#### Development Usage  
- **Run from source**: `pnpm dev` uses full source with debug
- **Local build**: Development build includes debug capabilities
- **Environment control**: `CLAUDE_HOOKS_DEBUG=true` activates debug features

### Verification Commands

```bash
# Development: Debug available
pnpm dev  # Uses source code with debug
CLAUDE_HOOKS_DEBUG=true pnpm dev  # Debug active

# Production: Debug stripped  
pnpm build  # Creates production build without debug
npm pack --dry-run  # Shows what users get (no debug code)
```

### Example Protection Implementation

```typescript
// Early return pattern - zero overhead
export async function processHook(input: any) {
  // Debug code never executes in production
  if (process.env.CLAUDE_HOOKS_DEBUG === 'true') {
    const { DebugCapture } = await import('./debug/DebugCapture.js');
    // ... debug logic
  }
  
  // Production code continues normally
  return processHookCore(input);
}
```

### Verification Methods
```bash
# Verify debug code exclusion in built package
npm pack --dry-run  # Shows exactly what files would be published
tar -tf package.tgz # Inspect actual package contents
npx bundle-analyzer dist/  # Analyze bundle for debug references
```

### Security Considerations

#### Data Sanitization (Development Only)
- Potential secrets are masked in debug logs
- File content is truncated if too large
- Personal paths are shortened for privacy

#### File Permissions (Development Only)
- Debug files created with restrictive permissions
- `.debug/` folder excluded from version control
- No sensitive data in debug output

## Troubleshooting Debug System

### Debug Mode Not Working

1. **Check Environment**:
   ```bash
   echo $CLAUDE_HOOKS_DEBUG
   ```

2. **Verify File Permissions**:
   ```bash
   ls -la .debug/
   ```

3. **Verify Hook Execution**:
   ```bash
   # Make sure the hook is actually being called by Claude
   CLAUDE_HOOKS_DEBUG=true npx claude-jsqualityhooks --help
   ```

### No Debug Files Created

- Ensure you have write permissions in the project directory
- Check that debug mode is actually enabled
- Verify the hook is actually being executed by Claude

### Debug Files Too Large

```bash
# Reduce log verbosity and session count
export CLAUDE_HOOKS_DEBUG_VERBOSE=false
export CLAUDE_HOOKS_DEBUG_SESSIONS=5
```

### Clearing Old Debug Data

```bash
# Manual cleanup
rm -rf .debug/

# Or use the script
pnpm debug:clear
```

## Development Patterns

### Testing Specific Scenarios

1. **Create test files** with known issues:
   ```typescript
   // test-file.ts
   const x=1;let y="hello"    // Formatting issues
   function unused() { }      // Lint issue
   const z: string = 123;     // Type error
   ```

2. **Run Claude Code** to trigger hooks
3. **Analyze debug output** to understand processing
4. **Iterate on implementation** based on debug data

### Debugging Validator Issues

1. Check `session-XXX-processing.log` for validator execution
2. Verify file detection is working
3. Look for error patterns in logs
4. Test with minimal config to isolate issues

### Performance Analysis

1. Review `execution_time_ms` in output files
2. Look for slow validators in processing logs
3. Identify bottlenecks in the pipeline
4. Compare performance across different file types

## VS Code Integration

Add to `.vscode/settings.json`:
```json
{
  "files.watcherExclude": {
    ".debug/**": true
  },
  "explorer.autoReveal": false,
  "files.associations": {
    ".debug/session-*-processing.log": "log"
  }
}
```

## Advanced Usage

### Custom Debug Capture

For specific development needs, you can temporarily add debug capture points:

```typescript
// In development only
if (process.env.CLAUDE_HOOKS_DEBUG) {
  await debugCapture.log('Custom debug point', { data: someData });
}
```

### Debug Data Analysis

Write scripts to analyze debug data:
```bash
# Count issue types
find .debug -name "session-*-output.json" -exec jq '.issues_found' {} \; | awk '{sum+=$1} END {print sum}'

# Average execution time
find .debug -name "session-*-output.json" -exec jq '.execution_time_ms' {} \; | awk '{sum+=$1; count++} END {print sum/count}'
```

## Future Enhancements

Planned debug system improvements:
- Web UI for browsing debug sessions
- Performance profiling and bottleneck detection
- Integration with VS Code debug panels
- Automated issue pattern detection
- Debug data export for analysis

## Best Practices

1. **Enable debug mode** during all development
2. **Clear debug data** periodically to save disk space
3. **Review processing logs** when issues occur
4. **Use verbose logging** only when needed
5. **Archive interesting debug sessions** before clearing
6. **Never commit** debug files to version control
7. **Test production builds** to ensure debug code is excluded