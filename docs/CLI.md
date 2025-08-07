# CLI Usage Guide

## Overview

The Claude Hooks Format & Lint Validator can be used via `npx` without installation. It operates in two modes:
- **CLI Mode**: Direct command execution for setup and configuration
- **Hook Mode**: Automatic detection when receiving JSON input from Claude Code

## Installation

No installation required! Use directly with npx:

```bash
npx claude-jsqualityhooks [command]
```

For better performance, you can install globally:

```bash
npm install -g claude-jsqualityhooks
claude-jsqualityhooks [command]
```

## Commands

### `init` - Initialize Configuration

Creates a default configuration file and validates your environment.

```bash
npx claude-jsqualityhooks init
```

This command will:
1. Create `claude-hooks.config.yaml` if it doesn't exist
2. Detect installed Biome version (1.x or 2.x)
3. Verify TypeScript is available
4. Test that validators work correctly
5. Report configuration status

**Options:**
- `--force` - Overwrite existing configuration
- `--minimal` - Create minimal configuration
- `--biome-version <version>` - Force specific Biome version

**Example output:**
```
✓ Configuration file created: claude-hooks.config.yaml
✓ Biome detected: v2.3.1
✓ TypeScript detected: v5.4.0
✓ Validators tested successfully
✓ Ready to use! Run 'npx claude-jsqualityhooks install' to register with Claude
```

### `version` - Display Version Information

Shows version information for the tool and detected dependencies.

```bash
npx claude-jsqualityhooks version
```

**Example output:**
```
Claude Hooks Format & Lint: v1.0.0
Biome: v2.3.1 (auto-detected)
TypeScript: v5.4.0
Node: v20.11.0
```

### `install` - Register Hooks with Claude

Automatically configures Claude Code to use this tool as a hook.

```bash
npx claude-jsqualityhooks install
```

This command will:
1. Locate Claude settings file (`~/.claude/settings.json`)
2. Backup existing settings
3. Add PostToolUse hooks for Write/Edit operations
4. Verify installation

**Options:**
- `--settings-path <path>` - Custom Claude settings location
- `--no-backup` - Skip settings backup
- `--tools <tools>` - Specify which tools to hook (default: "Write|Edit|MultiEdit")

**Example output:**
```
✓ Claude settings found: ~/.claude/settings.json
✓ Backup created: ~/.claude/settings.json.backup
✓ Hook registered for tools: Write, Edit, MultiEdit
✓ Installation complete! The hook will run automatically when Claude modifies files
```

### `uninstall` - Remove Hooks from Claude

Removes the hook configuration from Claude settings.

```bash
npx claude-jsqualityhooks uninstall
```

## Hook Mode

When the tool detects JSON input via stdin, it automatically switches to hook mode. This happens when Claude Code executes it as a hook.

### How It Works

1. Claude writes/edits a file
2. Claude executes the hook with JSON input
3. The tool validates and fixes the file
4. Results are returned to Claude in AI-optimized format

### Manual Testing

You can test hook mode manually:

```bash
echo '{"hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"test.ts"}}' | npx claude-jsqualityhooks
```

## Configuration

The tool uses `claude-hooks.config.yaml` for configuration. Key settings:

```yaml
# Enable/disable validation
enabled: true

# Auto-fix issues
autoFix: true

# Validators to use
validators:
  biome:
    enabled: true
    version: auto  # auto-detects 1.x or 2.x
  typescript:
    enabled: true
```

See [Configuration Guide](./config/configuration-guide.md) for full details.

## Troubleshooting

### Command Not Found

If `npx` can't find the package:
```bash
npm cache clean --force
npx claude-jsqualityhooks@latest version
```

### Hook Not Running

Check if hook is registered:
```bash
cat ~/.claude/settings.json | grep claude-jsqualityhooks
```

Re-install if needed:
```bash
npx claude-jsqualityhooks install
```

### Biome Not Detected

Install Biome in your project:
```bash
npm install --save-dev @biomejs/biome
npx claude-jsqualityhooks init
```

### Permission Errors

On Unix systems, ensure npx has execution permissions:
```bash
chmod +x $(which npx)
```

## Advanced Usage

### Custom Configuration Path

Use environment variable:
```bash
CLAUDE_HOOKS_CONFIG=./custom-config.yaml npx claude-jsqualityhooks
```

### Debug Mode

Enable verbose output:
```bash
DEBUG=claude-hooks:* npx claude-jsqualityhooks init
```

### CI/CD Integration

Check code without Claude:
```bash
# Validate files directly
npx claude-jsqualityhooks check src/**/*.ts
```

## Examples

### Quick Setup

```bash
# 1. Initialize in your project
cd my-project
npx claude-jsqualityhooks init

# 2. Install Biome if needed
npm install --save-dev @biomejs/biome

# 3. Register with Claude
npx claude-jsqualityhooks install

# Done! Hooks will run automatically
```

### Project-Specific Hook

Add to your project's package.json:
```json
{
  "scripts": {
    "claude-hooks": "npx claude-jsqualityhooks"
  }
}
```

Then in Claude settings:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "cd $CLAUDE_PROJECT_DIR && npm run claude-hooks"
      }]
    }]
  }
}
```

## Uninstalling

To completely remove:

1. Remove from Claude:
```bash
npx claude-jsqualityhooks uninstall
```

2. Delete configuration:
```bash
rm claude-hooks.config.yaml
```

3. Clear npx cache (optional):
```bash
npm cache clean --force
```