# Task 2: Configuration Loader

## Task Overview
Implement the YAML configuration loader that reads `claude-jsqualityhooks.config.yaml`, validates it with Zod, and provides graceful error handling when the file is missing.

## References
- Primary: `docs/implementation/phase-1-infrastructure.md#L118-L177`
- Config Guide: `docs/config/configuration-guide.md#L8-L29`
- Interfaces: `docs/api/interfaces.md#L10-L34`
- YAML Library: `docs/DEVELOPMENT-SETUP.md#L72-L82`
- Zod Validation: `docs/DEVELOPMENT-SETUP.md#L84-L94`

## Prerequisites
- [ ] Task 1 (Project Setup) completed
- [ ] yaml package installed
- [ ] zod package installed
- [ ] TypeScript configured

## Implementation TODOs

### 1. Create Type Definitions
- [ ] Create src/types/index.ts
- [ ] Define Config interface
  - Reference: `docs/api/interfaces.md#L10-L34`
- [ ] Export all types from index
- [ ] Include validator sub-types
- [ ] Add file pattern types

### 2. Create Zod Schemas
- [ ] Create src/schemas/config.schema.ts
- [ ] Define configSchema with zod
- [ ] Include all 10 configuration options
  - enabled: boolean
  - autoFix: boolean
  - validators.biome.enabled
  - validators.biome.version
  - validators.biome.configPath
  - validators.typescript.enabled
  - validators.typescript.configPath
  - include: string[]
  - exclude: string[]
  - logLevel: enum
- [ ] Add default values for optional fields
- Reference: `docs/config/configuration-guide.md#L30-L123`

### 3. Implement YamlConfigLoader Class
- [ ] Create src/config/YamlConfigLoader.ts
- [ ] Implement load() method
- [ ] Check for config file existence
- [ ] Parse YAML content
- [ ] Validate with Zod schema
- Reference: `docs/implementation/phase-1-infrastructure.md#L120-L177`

### 4. Handle Missing Configuration
- [ ] Implement showWarningAndExit() method
- [ ] Display friendly message
- [ ] Show exact filename needed
- [ ] Provide init command instruction
- [ ] Include minimal config example
- [ ] Exit with code 0 (not error)
- Reference: `docs/implementation/phase-1-infrastructure.md#L147-L167`
- Reference: `docs/CLI.md#L119-L136`

### 5. Add Configuration Validation
- [ ] Implement validateConfig() method
- [ ] Use Zod for runtime validation
- [ ] Provide clear error messages
- [ ] Handle invalid YAML syntax
- [ ] Check required fields
- Reference: `docs/DEVELOPMENT-SETUP.md#L84-L94`

### 6. Add Smart Defaults
- [ ] Default include patterns if not specified
- [ ] Default exclude patterns if not specified
- [ ] Default logLevel to 'warn'
- [ ] Default autoFix to true
- Reference: `docs/config/configuration-guide.md#L75-L77`

### 7. Create Config Constants
- [ ] Define CONFIG_FILE constant
- [ ] Set to 'claude-jsqualityhooks.config.yaml'
- [ ] Use in all file operations
- Reference: `docs/implementation/phase-1-infrastructure.md#L129-L130`

### 8. Error Handling
- [ ] Catch file not found errors
- [ ] Catch YAML parse errors
- [ ] Catch validation errors
- [ ] Provide helpful error messages
- [ ] Never throw unhandled exceptions
- Reference: `docs/ARCHITECTURE.md#L149-L162`

## Success Criteria
- [ ] Config loads from valid YAML file
- [ ] Graceful exit when file missing
- [ ] Clear warning message displayed
- [ ] Zod validation working
- [ ] Type inference from schema
- [ ] Default values applied correctly
- [ ] Error messages helpful

## Testing Requirements
- [ ] Test with missing config file
- [ ] Test with invalid YAML syntax
- [ ] Test with invalid config values
- [ ] Test with minimal config
- [ ] Test with complete config
- [ ] Test default value application
- [ ] Mock file system operations

## Notes for Implementation Agent
1. Start with type definitions
2. Build Zod schema to match types
3. Focus on the missing file case - it's critical
4. Warning message must match docs/CLI.md#L119-L136
5. Use resolve() for absolute paths
6. Don't look for config in multiple locations
7. Config file MUST be in current directory
8. Exit gracefully, don't throw errors