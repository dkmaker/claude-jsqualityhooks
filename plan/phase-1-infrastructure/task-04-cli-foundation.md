# Task 4: CLI Foundation

## Task Overview
Implement the CLI commands (init, install, version) using Commander.js and integrate with the hook system for both CLI and hook modes.

## References
- Primary: `docs/CLI.md`
- Commander Setup: `docs/DEVELOPMENT-SETUP.md#L60-L70`
- Init Command: `docs/CLI.md#L31-L61`
- Install Command: `docs/CLI.md#L79-L104`
- Version Command: `docs/CLI.md#L63-L77`

## Prerequisites
- [ ] Task 1 (Project Setup) completed
- [ ] Task 2 (Config Loader) completed  
- [ ] Commander package installed
- [ ] Execa package installed

## Implementation TODOs

### 1. Create CLI Entry Point
- [ ] Create src/cli.ts
- [ ] Add shebang: #!/usr/bin/env node
- [ ] Import commander
- [ ] Set up program basics
- [ ] Add version from package.json
- Reference: `docs/DEVELOPMENT-SETUP.md#L60-L70`

### 2. Detect Execution Mode
- [ ] Check if stdin is piped (hook mode)
- [ ] If piped, read JSON and enter hook mode
- [ ] Otherwise, parse CLI arguments
- [ ] Handle both modes in same entry
- Reference: `docs/CLI.md#L114-L136`

### 3. Implement Init Command
- [ ] Add 'init' command
- [ ] Create claude-jsqualityhooks.config.yaml
- [ ] Detect Biome version using execa
- [ ] Detect TypeScript version
- [ ] Test validators work
- [ ] Report status to user
- [ ] Add --force flag for overwrite
- [ ] Add --minimal flag
- Reference: `docs/CLI.md#L31-L61`

### 4. Implement Version Command  
- [ ] Add 'version' command
- [ ] Show package version
- [ ] Show detected Biome version
- [ ] Show detected TypeScript version
- [ ] Show Node.js version
- [ ] Format output clearly
- Reference: `docs/CLI.md#L63-L77`

### 5. Implement Install Command
- [ ] Add 'install' command
- [ ] Locate ~/.claude/settings.json
- [ ] Backup existing settings
- [ ] Add PostToolUse hooks
- [ ] Configure for Write|Edit|MultiEdit
- [ ] Verify installation
- [ ] Add --settings-path option
- [ ] Add --no-backup option
- Reference: `docs/CLI.md#L79-L104`

### 6. Create Version Detection
- [ ] Create src/utils/versionDetector.ts
- [ ] Detect Biome from package.json
- [ ] Detect Biome from CLI
- [ ] Detect TypeScript version
- [ ] Handle detection failures
- Reference: `docs/features/02-biome-validator.md#L28-L43`

### 7. Handle Hook Mode
- [ ] Create src/cli/hookMode.ts
- [ ] Read JSON from stdin
- [ ] Parse Claude Code input
- [ ] Load configuration
- [ ] Execute hook pipeline
- [ ] Return results to stdout
- Reference: `docs/CLI.md#L114-L145`

### 8. Add CLI Helpers
- [ ] Create src/cli/helpers.ts
- [ ] Add config file creation helper
- [ ] Add settings.json updater
- [ ] Add backup creator
- [ ] Add success/error formatters
- Reference: `docs/CLI.md#L186-L218`

### 9. Error Handling for CLI
- [ ] Catch all exceptions in CLI
- [ ] Provide helpful error messages
- [ ] Exit with appropriate codes
- [ ] Show usage on invalid commands
- Reference: `docs/CLI.md#L186-L234`

## Success Criteria
- [ ] npx execution works
- [ ] init creates config file
- [ ] version shows all versions
- [ ] install updates Claude settings
- [ ] Hook mode processes JSON
- [ ] CLI mode processes commands
- [ ] Error messages helpful
- [ ] All flags working

## Testing Requirements
- [ ] Test init with existing config
- [ ] Test init with --force flag
- [ ] Test version detection
- [ ] Test install with mock settings
- [ ] Test hook mode with sample JSON
- [ ] Test CLI argument parsing
- [ ] Test error cases

## Notes for Implementation Agent
1. Start with CLI entry point
2. Focus on mode detection first
3. Init command is most important
4. Use execa for subprocess calls
5. Create minimal config by default
6. Make version detection robust
7. Handle missing Claude settings gracefully
8. Ensure npx compatibility