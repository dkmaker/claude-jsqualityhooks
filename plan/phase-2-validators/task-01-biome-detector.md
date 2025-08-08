# Task 1: Biome Version Detector

## Task Overview
Implement automatic Biome version detection that checks package.json and CLI to determine whether Biome 1.x or 2.x is installed.

## References
- Primary: `docs/features/02-biome-validator.md#L28-L43`
- Execa Usage: `docs/DEVELOPMENT-SETUP.md#L96-L109`
- Version Config: `docs/config/configuration-guide.md#L51-L58`
- Implementation: `docs/implementation/phase-2-validators.md`

## Prerequisites
- [ ] Phase 1 completed
- [ ] Execa package available
- [ ] File system access working

## Implementation TODOs

### 1. Create Version Detector Module
- [ ] Create src/validators/biome/versionDetector.ts
- [ ] Export detectBiomeVersion function
- [ ] Return type: Promise<'1.x' | '2.x' | null>
- [ ] Handle detection failures gracefully
- Reference: `docs/features/02-biome-validator.md#L28-L43`

### 2. Check Package.json Method
- [ ] Create getVersionFromPackageJson function
- [ ] Read package.json from project root
- [ ] Check dependencies['@biomejs/biome']
- [ ] Check devDependencies['@biomejs/biome']
- [ ] Parse semantic version string
- [ ] Return major version (1.x or 2.x)
- Reference: `docs/features/02-biome-validator.md#L31-L33`

### 3. Check CLI Version Method
- [ ] Create getVersionFromCLI function
- [ ] Use execa to run 'biome --version'
- [ ] Parse version from stdout
- [ ] Handle different output formats
- [ ] Extract major version number
- [ ] Handle command not found error
- Reference: `docs/features/02-biome-validator.md#L35-L37`
- Reference: `docs/DEVELOPMENT-SETUP.md#L96-L109`

### 4. Parse Version String
- [ ] Create parseVersion helper function
- [ ] Handle formats: "1.8.3", "v1.8.3", "biome 1.8.3"
- [ ] Extract major version
- [ ] Return '1.x' for v1.x.x
- [ ] Return '2.x' for v2.x.x
- [ ] Handle edge cases

### 5. Implement Fallback Chain
- [ ] Try package.json first (most reliable)
- [ ] Fall back to CLI if not in package.json
- [ ] Default to '2.x' if both fail
- [ ] Log detection method used
- Reference: `docs/features/02-biome-validator.md#L39-L43`

### 6. Add Version Caching
- [ ] Create versionCache variable
- [ ] Cache detected version per session
- [ ] Clear cache on config reload
- [ ] Avoid repeated detection calls
- Reference: `docs/features/01-hook-system.md#L98-L101`

### 7. Handle Config Override
- [ ] Check config.validators.biome.version
- [ ] If 'auto', perform detection
- [ ] If '1.x' or '2.x', use specified
- [ ] Validate version string
- Reference: `docs/config/configuration-guide.md#L51-L58`

### 8. Error Handling
- [ ] Catch file read errors
- [ ] Catch JSON parse errors  
- [ ] Catch subprocess errors
- [ ] Log warnings but don't fail
- [ ] Always return a version (default 2.x)
- Reference: `docs/ARCHITECTURE.md#L149-L162`

## Success Criteria
- [ ] Detects version from package.json
- [ ] Detects version from CLI
- [ ] Falls back to 2.x appropriately
- [ ] Caches result per session
- [ ] Respects config override
- [ ] Handles all error cases
- [ ] Logs detection method

## Testing Requirements
- [ ] Test with Biome 1.x in package.json
- [ ] Test with Biome 2.x in package.json
- [ ] Test with no package.json
- [ ] Test with CLI version only
- [ ] Test with neither available
- [ ] Test cache behavior
- [ ] Mock execa calls

## Notes for Implementation Agent
1. Start with the main detectBiomeVersion function
2. Build detection methods incrementally
3. Test each detection method separately
4. Ensure fallback chain works
5. Cache is important for performance
6. Default to 2.x (latest) when uncertain
7. Log but don't throw on errors