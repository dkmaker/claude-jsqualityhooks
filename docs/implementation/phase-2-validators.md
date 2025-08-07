# Phase 2: Validator Integration

## Overview

Phase 2 implements the Biome and TypeScript validators with version detection and JSON output parsing.

## Goals

1. Implement Biome version detection
2. Create version-specific adapters
3. Integrate TypeScript Compiler API
4. Build validation pipeline
5. Parse and standardize results

## Key Implementation Files

- `src/validators/biome/versionDetector.ts`
- `src/validators/biome/v1Adapter.ts`
- `src/validators/biome/v2Adapter.ts`
- `src/validators/biome/index.ts`
- `src/validators/typescript.ts`

## Biome Version Detector

```typescript
// src/validators/biome/versionDetector.ts
export class BiomeVersionDetector {
  async detect(): Promise<BiomeVersion> {
    // Check package.json
    const pkgVersion = await this.getPackageVersion();
    if (pkgVersion) return pkgVersion;
    
    // Run biome --version
    const cliVersion = await this.getCLIVersion();
    if (cliVersion) return cliVersion;
    
    // Default to 2.x
    return { major: 2, minor: 0, patch: 0 };
  }
}
```

## TypeScript Validator

```typescript
// src/validators/typescript.ts
export class TypeScriptValidator {
  private program: ts.Program;
  
  async initialize(configPath: string) {
    // Load tsconfig and create program
  }
  
  async validate(file: FileInfo): Promise<ValidationResult> {
    // Get diagnostics and format
  }
}
```

## Success Criteria

- [ ] Biome version auto-detection works
- [ ] Both validators produce JSON output
- [ ] Results are standardized format
- [ ] Parallel validation works
- [ ] Error handling is robust

## Next: [Phase 3: Auto-Fix](./phase-3-auto-fix.md)