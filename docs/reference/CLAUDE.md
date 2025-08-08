# External Documentation References

## Claude Code Hooks
- **Official Docs**: https://docs.anthropic.com/en/docs/claude-code/hooks
- **Hook Events**: PreToolUse, PostToolUse, UserPromptSubmit, Stop
- **Configuration**: Settings file structure and matchers
- **Security**: Best practices for safe hook implementation

## Biome Documentation
- **Official Site**: https://biomejs.dev/
- **CLI Reference**: https://biomejs.dev/reference/cli/
- **Configuration**: https://biomejs.dev/reference/configuration/

## TypeScript Compiler API
- **Official Docs**: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- **API Reference**: https://www.typescriptlang.org/docs/handbook/compiler-api.html
- **tsconfig Reference**: https://www.typescriptlang.org/tsconfig

## Node.js APIs
- **File System**: https://nodejs.org/api/fs.html
- **Child Process**: https://nodejs.org/api/child_process.html
- **Path**: https://nodejs.org/api/path.html
- **Process**: https://nodejs.org/api/process.html

## Library Documentation

### Core Dependencies
- **commander**: https://github.com/tj/commander.js#readme
- **yaml**: https://github.com/eemeli/yaml#readme
- **zod**: https://zod.dev/
- **execa**: https://github.com/sindresorhus/execa#readme
- **fast-glob**: https://github.com/mrmlnc/fast-glob#readme

### Build Tools
- **tsup**: https://tsup.egoist.dev/
- **vitest**: https://vitest.dev/
- **pnpm**: https://pnpm.io/

## Common Patterns

### Hook Input Format
Claude Code sends JSON via stdin:
```json
{
  "hook_event_name": "PostToolUse",
  "tool_name": "Write|Edit|MultiEdit",
  "tool_input": { "file_path": "...", "content": "..." },
  "tool_response": { "success": true }
}
```

### TypeScript API Usage
- Create Program from tsconfig
- Get semantic diagnostics
- Format diagnostic messages
- Handle incremental compilation

### Exit Codes
- `0`: Success
- `1`: General error
- `2`: Blocking error (for hooks)

### File Patterns
Standard glob patterns:
- `**/*.ts` - All TypeScript files
- `src/**/*.{ts,tsx}` - Source TypeScript/TSX
- `!**/*.test.ts` - Exclude test files