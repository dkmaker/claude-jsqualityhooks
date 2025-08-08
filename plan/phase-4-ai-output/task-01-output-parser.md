# Task 1: Output Parser

## Task Overview
Parse JSON output from Biome and TypeScript validators, extracting issues and converting to standardized format.

## References
- Primary: `docs/implementation/phase-4-ai-output.md`
- Biome Output: `docs/features/02-biome-validator.md#L99-L147`
- TypeScript Output: `docs/api/interfaces.md#L120-L128`
- Interfaces: `docs/api/interfaces.md#L56-L72`

## Prerequisites
- [ ] Phase 2 completed
- [ ] Validator outputs available
- [ ] JSON parsing capability

## Implementation TODOs

### 1. Create Output Parser Base
- [ ] Create src/formatters/OutputParser.ts
- [ ] Add parseValidatorOutput method
- [ ] Handle JSON parsing errors
- [ ] Return standardized format
- Reference: `docs/implementation/phase-4-ai-output.md`

### 2. Parse Biome JSON Output
- [ ] Create src/formatters/BiomeOutputParser.ts
- [ ] Parse diagnostics array
- [ ] Extract file paths
- [ ] Get line/column numbers
- [ ] Map severity levels
- [ ] Extract error messages
- Reference: `docs/features/02-biome-validator.md#L99-L147`

### 3. Parse TypeScript Output
- [ ] Create src/formatters/TypeScriptOutputParser.ts
- [ ] Convert Diagnostic objects
- [ ] Extract file locations
- [ ] Get position info
- [ ] Map categories to severity
- [ ] Format error text
- Reference: `docs/api/interfaces.md#L120-L128`

### 4. Handle Parse Failures
- [ ] Catch JSON.parse errors
- [ ] Try to extract partial data
- [ ] Log malformed output
- [ ] Return empty issues array
- [ ] Never throw parse errors
- Reference: `docs/ARCHITECTURE.md#L149-L162`

### 5. Normalize File Paths
- [ ] Convert absolute to relative
- [ ] Use forward slashes
- [ ] Remove workspace prefix
- [ ] Consistent path format
- [ ] Handle Windows paths
- Reference: `docs/features/04-ai-formatter.md`

### 6. Extract Issue Details
- [ ] Parse error messages
- [ ] Get rule/diagnostic IDs
- [ ] Extract suggestions
- [ ] Identify fixable issues
- [ ] Parse code snippets

### 7. Map Severity Levels
- [ ] Error -> 'error'
- [ ] Warning -> 'warning'
- [ ] Info/Hint -> 'info'
- [ ] Consistent across validators
- [ ] Clear severity hierarchy
- Reference: `docs/api/interfaces.md#L62`

### 8. Build Issue Objects
- [ ] Create ValidationIssue instances
- [ ] Include all required fields
- [ ] Add optional metadata
- [ ] Ensure type safety
- [ ] Validate structure
- Reference: `docs/api/interfaces.md#L56-L65`

### 9. Sort and Deduplicate
- [ ] Sort by file, line, column
- [ ] Remove duplicate issues
- [ ] Group related issues
- [ ] Maintain issue order
- [ ] Preserve issue context

## Success Criteria
- [ ] Biome output parsed correctly
- [ ] TypeScript output parsed correctly
- [ ] Paths normalized
- [ ] Severity mapped accurately
- [ ] Parse errors handled
- [ ] Consistent output format

## Testing Requirements
- [ ] Test with real Biome output
- [ ] Test with TypeScript diagnostics
- [ ] Test malformed JSON
- [ ] Test empty output
- [ ] Test large output files
- [ ] Mock validator outputs

## Notes for Implementation Agent
1. Real validator output varies
2. Always handle parse failures
3. Normalize everything
4. Keep parser validator-specific
5. Test with actual output samples
6. Preserve useful error context
7. Sort for consistent ordering