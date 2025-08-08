# Task 2: AI Formatter

## Task Overview
Format parsed validation results into AI-optimized output with no ANSI codes, simplified messages, and clear structure.

## References
- Primary: `docs/features/04-ai-formatter.md`
- Implementation: `docs/implementation/phase-4-ai-output.md`
- Interfaces: `docs/api/interfaces.md#L146-L168`
- Architecture: `docs/ARCHITECTURE.md#L66-L75`

## Prerequisites
- [ ] Task 1 (Output Parser) completed
- [ ] Parsed issues available
- [ ] String manipulation ready

## Implementation TODOs

### 1. Create AI Formatter Class
- [ ] Create src/formatters/AIOutputFormatter.ts
- [ ] Implement format method
- [ ] Accept ValidationResult array
- [ ] Return AIFormattedOutput
- Reference: `docs/api/interfaces.md#L146-L152`

### 2. Remove ANSI Codes
- [ ] Create stripAnsi function
- [ ] Remove color codes
- [ ] Remove cursor movements
- [ ] Remove style codes
- [ ] Test with complex sequences
- Reference: `docs/features/04-ai-formatter.md`

### 3. Simplify Error Messages
- [ ] Remove technical jargon
- [ ] Shorten long descriptions
- [ ] Extract key information
- [ ] Make actionable
- [ ] Preserve essential context
- Reference: `docs/features/04-ai-formatter.md`

### 4. Create Summary Statement
- [ ] Count total issues
- [ ] Count by severity
- [ ] List files affected
- [ ] Mention fixes applied
- [ ] Build concise summary
- Reference: `docs/api/interfaces.md#L155`

### 5. Group Issues by File
- [ ] Sort issues by file path
- [ ] Group same-file issues
- [ ] Order by line number
- [ ] Show file-level stats
- [ ] Format hierarchically

### 6. Format Issue List
- [ ] Use consistent format
- [ ] Include file:line:column
- [ ] Show severity clearly
- [ ] Add fix status
- [ ] Keep messages concise
- Reference: `docs/api/interfaces.md#L160-L167`

### 7. Build Statistics Object
- [ ] Total issues count
- [ ] Fixed issues count
- [ ] Remaining issues count
- [ ] Issues by severity
- [ ] Files modified count
- Reference: `docs/api/interfaces.md#L67-L72`

### 8. Create Status Determination
- [ ] 'success' if no issues remain
- [ ] 'warning' if only warnings
- [ ] 'error' if errors exist
- [ ] Consider fix results
- [ ] Clear status logic
- Reference: `docs/api/interfaces.md#L50`

### 9. Format for JSON Output
- [ ] Create clean JSON structure
- [ ] No circular references
- [ ] Proper escaping
- [ ] Valid JSON syntax
- [ ] Readable formatting
- Reference: `docs/CLI.md#L141-L144`

## Success Criteria
- [ ] No ANSI codes in output
- [ ] Messages simplified
- [ ] Clear structure
- [ ] Valid JSON format
- [ ] Statistics accurate
- [ ] Status correct
- [ ] AI-readable format

## Testing Requirements
- [ ] Test ANSI code removal
- [ ] Test message simplification
- [ ] Test with many issues
- [ ] Test with no issues
- [ ] Test JSON validity
- [ ] Verify AI readability

## Notes for Implementation Agent
1. AI readability is key goal
2. No terminal formatting allowed
3. Keep messages actionable
4. Structure must be consistent
5. Test with Claude's parser
6. Ensure valid JSON always
7. Simplify without losing meaning