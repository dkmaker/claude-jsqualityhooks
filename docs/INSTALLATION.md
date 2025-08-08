# Installation Guide

## Overview

Claude JS Quality Hooks is designed to be used as a **CLI tool** that integrates with Claude Code as a hook. It does **NOT** need to be installed as a project dependency.

## Installation Methods

### Method 1: NPX (Recommended) ✨

**No installation required!** Run directly with `npx`:

```bash
npx claude-jsqualityhooks [command]
```

**When to use:**
- ✅ First-time setup
- ✅ One-time configuration
- ✅ You want the latest version
- ✅ You don't want to pollute your system or project
- ✅ Standard use case for most users

**Benefits:**
- Zero installation friction
- Always uses the latest published version
- No global or local package pollution
- Works immediately on any system with npm

**Example workflow:**
```bash
# Initialize configuration
npx claude-jsqualityhooks init

# Register with Claude
npx claude-jsqualityhooks install

# Check version
npx claude-jsqualityhooks version
```

### Method 2: Global Installation (Optional)

Install globally for frequent CLI usage:

```bash
npm install -g claude-jsqualityhooks
```

**When to use:**
- ✅ You use the CLI commands frequently
- ✅ You want faster execution (no download)
- ✅ You work offline often
- ✅ You manage multiple projects
- ✅ You're developing/testing the hooks

**Benefits:**
- Faster execution (no npx overhead)
- Works offline after installation
- Shorter commands (no `npx` prefix)
- Consistent version across projects

**Example workflow:**
```bash
# After global installation
claude-jsqualityhooks init
claude-jsqualityhooks install
claude-jsqualityhooks version
```

### Method 3: Project Dependency (NOT Recommended) ❌

**Do NOT install as a project dependency:**
```bash
# DON'T DO THIS
npm install --save-dev claude-jsqualityhooks  # ❌ Wrong approach
```

**Why not:**
- This is a CLI tool, not a library you import
- It runs as an external process via Claude hooks
- It doesn't belong in your project's dependencies
- Creates confusion about the tool's purpose

## Complete Setup Guide

### Step 1: Create Configuration File (REQUIRED)

```bash
# Navigate to your project
cd my-project

# Initialize configuration (no installation needed!)
npx claude-jsqualityhooks init
```

This will:
- Create `claude-jsqualityhooks.config.yaml` in your project root
- Detect installed Biome version
- Verify TypeScript availability
- Test validators

**⚠️ IMPORTANT:** The configuration file `claude-jsqualityhooks.config.yaml` MUST exist in your project root. Without it, the tool will not run and will show a warning:

```
⚠️  Configuration file not found: claude-jsqualityhooks.config.yaml

To get started:
1. Run: npx claude-jsqualityhooks init
   This will create claude-jsqualityhooks.config.yaml in your project root

Without this configuration file, the hook will not run.
```

### Step 2: Install Biome (Required)

Biome needs to be installed in your project:

```bash
# Install latest Biome (auto-detection handles both v1 and v2)
npm install --save-dev @biomejs/biome

# Or using yarn
yarn add -D @biomejs/biome

# Initialize Biome
npx @biomejs/biome init
```

### Step 3: Register with Claude

```bash
# Register the hooks
npx claude-jsqualityhooks install
```

This will:
- Find Claude's settings file
- Add PostToolUse hooks
- Configure for Write/Edit/MultiEdit operations

### Step 4: Verify Installation

```bash
# Check everything is working
npx claude-jsqualityhooks version
```

Expected output:
```
Claude JS Quality Hooks: [current version]
Biome: [detected version] (auto-detected)
TypeScript: [detected version]
Node: [current version]
```

## How the Hook Works

When Claude modifies a file:

1. **Claude writes/edits a file** using Write, Edit, or MultiEdit tools
2. **Claude triggers the hook** with JSON input via stdin
3. **The hook runs** using the command in Claude's settings:
   ```json
   {
     "command": "npx claude-jsqualityhooks"
   }
   ```
4. **Validation occurs** on the modified file
5. **Auto-fixes are applied** if configured
6. **Results return to Claude** in AI-optimized format

## Troubleshooting

### "Command not found"

If `npx` can't find the package:
```bash
# Clear npm cache
npm cache clean --force

# Try with explicit version
npx claude-jsqualityhooks@latest version
```

### "Biome not detected"

Ensure Biome is installed in your project:
```bash
# Check if Biome is installed
npm list @biomejs/biome

# If not, install it
npm install --save-dev @biomejs/biome
```

### "Hook not running"

Verify hook registration:
```bash
# Check Claude settings
cat ~/.claude/settings.json | grep claude-jsqualityhooks

# Re-register if needed
npx claude-jsqualityhooks install
```

### Global vs NPX Performance

If npx is slow, consider global installation:
```bash
# Install globally for better performance
npm install -g claude-jsqualityhooks

# Now runs instantly
claude-jsqualityhooks version
```

## Uninstalling

### Remove from Claude
```bash
npx claude-jsqualityhooks uninstall
```

### Remove global installation (if installed)
```bash
npm uninstall -g claude-jsqualityhooks
```

### Clean up configuration
```bash
rm claude-jsqualityhooks.config.yaml
```

## Advanced Configuration

### Custom config location
```bash
CLAUDE_HOOKS_CONFIG=./custom-config.yaml npx claude-jsqualityhooks init
```

### Debug mode
```bash
DEBUG=claude-jsqualityhooks:* npx claude-jsqualityhooks init
```

### Project-specific command
Add to `package.json` scripts:
```json
{
  "scripts": {
    "claude-init": "npx claude-jsqualityhooks init",
    "claude-install": "npx claude-jsqualityhooks install"
  }
}
```

Then run:
```bash
npm run claude-init
npm run claude-install
```

## Summary

- **Use `npx`** for standard usage (recommended)
- **Install globally** only if you need offline/frequent access
- **Never install** as a project dependency
- The tool runs as a **CLI/hook**, not as an imported module

For more details, see the [CLI Usage Guide](./CLI.md).