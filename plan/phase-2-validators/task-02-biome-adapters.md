# Task 2: Biome Adapters

## Task Overview
Implement adapter pattern to handle command differences between Biome 1.x (--apply) and Biome 2.x (--write) versions.

## References
- Primary: `docs/features/02-biome-validator.md#L56-L97`
- Version Differences: `docs/features/02-biome-validator.md#L19-L26`
- Interfaces: `docs/api/interfaces.md#L95-L118`
- Execa Execution: `docs/DEVELOPMENT-SETUP.md#L96-L109`

## Prerequisites
- [ ] Task 1 (Version Detector) completed
- [ ] Version detection working
- [ ] Execa available for commands

## Implementation TODOs

### 1. Create Adapter Interface
- [ ] Create src/validators/biome/adapters/BiomeAdapter.ts
- [ ] Define BiomeAdapter interface
- [ ] Add buildCommand method
- [ ] Add parseOutput method
- [ ] Add getFixFlag method
- Reference: `docs/api/interfaces.md#L101-L105`

### 2. Implement Biome V1 Adapter
- [ ] Create src/validators/biome/adapters/BiomeV1Adapter.ts
- [ ] Implement BiomeAdapter interface
- [ ] buildCommand uses 'check' command
- [ ] Fix flag is '--apply'
- [ ] Reporter flag is '--reporter=json'
- [ ] No --no-colors flag needed
- Reference: `docs/features/02-biome-validator.md#L74-L83`
- Reference: `docs/features/02-biome-validator.md#L21`

### 3. Implement Biome V2 Adapter
- [ ] Create src/validators/biome/adapters/BiomeV2Adapter.ts
- [ ] Implement BiomeAdapter interface
- [ ] buildCommand uses 'check' command
- [ ] Fix flag is '--write'
- [ ] Reporter flag is '--reporter=json'
- [ ] Add '--no-colors' flag
- Reference: `docs/features/02-biome-validator.md#L85-L96`
- Reference: `docs/features/02-biome-validator.md#L22`

### 4. Create Adapter Factory
- [ ] Create src/validators/biome/adapters/AdapterFactory.ts
- [ ] Export createAdapter function
- [ ] Accept version string ('1.x' or '2.x')
- [ ] Return appropriate adapter instance
- [ ] Throw for invalid version
- Reference: `docs/features/02-biome-validator.md#L64-L69`

### 5. Implement Command Building
- [ ] Build base command array
- [ ] Add file path parameter
- [ ] Conditionally add fix flag
- [ ] Add JSON reporter flag
- [ ] Add config path if specified
- [ ] Handle color output flags
- Reference: `docs/features/02-biome-validator.md#L71-L97`

### 6. Implement Output Parsing
- [ ] Parse JSON output from Biome
- [ ] Extract diagnostics array
- [ ] Map to ValidationIssue format
- [ ] Extract file, line, column
- [ ] Determine severity levels
- [ ] Handle parse errors gracefully
- Reference: `docs/api/interfaces.md#L56-L65`

### 7. Add Config Path Support
- [ ] Check config.validators.biome.configPath
- [ ] Add --config-path flag if specified
- [ ] Use absolute path resolution
- [ ] Default to project biome.json
- Reference: `docs/config/configuration-guide.md#L48`

### 8. Handle Unsafe Fixes
- [ ] V1: --apply-unsafe flag
- [ ] V2: --write --unsafe flags
- [ ] Only use if explicitly configured
- [ ] Default to safe fixes only
- Reference: `docs/features/02-biome-validator.md#L23`

## Success Criteria
- [ ] V1 adapter builds correct commands
- [ ] V2 adapter builds correct commands
- [ ] Factory returns correct adapter
- [ ] JSON output parsed correctly
- [ ] Config path support working
- [ ] Safe fixes only by default
- [ ] Both versions validated

## Testing Requirements
- [ ] Test V1 command generation
- [ ] Test V2 command generation
- [ ] Test factory with both versions
- [ ] Test JSON parsing
- [ ] Test error output parsing
- [ ] Mock Biome execution
- [ ] Test with sample outputs

## Notes for Implementation Agent
1. Start with the adapter interface
2. Implement V2 first (latest version)
3. Key difference is --apply vs --write
4. Both use same JSON output format
5. Factory pattern enables easy switching
6. Parse real Biome JSON output samples
7. Handle both success and error outputs