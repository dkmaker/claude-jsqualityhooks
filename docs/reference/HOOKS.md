# Claude Code Hooks Reference

## Official Documentation

For the most up-to-date and complete Claude Code hooks documentation, please refer to the official Anthropic documentation:

**🔗 https://docs.anthropic.com/en/docs/claude-code/hooks**

## Key Topics Covered

The official documentation includes:

- **Hook Events**: PreToolUse, PostToolUse, UserPromptSubmit, Stop, etc.
- **Configuration**: Settings file structure and matcher patterns
- **Input/Output Schemas**: JSON formats for hook communication
- **Security Best Practices**: Safe hook implementation guidelines
- **MCP Tool Integration**: Working with Model Context Protocol tools
- **Debugging Guide**: Troubleshooting hook issues

## Hook Input Format

Standard hook input structure:
```json
{
  "hook_event_name": "PostToolUse",
  "tool_name": "Write|Edit|MultiEdit",
  "tool_input": {
    "file_path": "/path/to/file",
    "content": "..."
  },
  "tool_response": {
    "success": true
  }
}
```