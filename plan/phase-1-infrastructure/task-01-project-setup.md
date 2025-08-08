# Task 1: Project Setup

## Task Overview
Initialize the TypeScript project with pnpm, configure build tools, and establish the project structure.

## References
- Primary: `docs/implementation/phase-1-infrastructure.md#L17-L56`
- Package Manager: `docs/DEVELOPMENT-SETUP.md#L3-L29`
- Dependencies: `docs/DEVELOPMENT-SETUP.md#L36-L55`
- Build Config: `docs/implementation/phase-1-infrastructure.md#L82-L99`

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git repository initialized

## Implementation TODOs

### 1. Enable pnpm with Corepack
- [ ] Run corepack enable
- [ ] Prepare pnpm with corepack
- [ ] Verify pnpm version
- Reference: `docs/implementation/phase-1-infrastructure.md#L19-L30`

### 2. Initialize Package
- [ ] Run pnpm init
- [ ] Set package name: `claude-jsqualityhooks`
- [ ] Set version: `1.0.0`
- [ ] Set type: `module`
- [ ] Add packageManager field: `pnpm@10.14.0`
- Reference: `docs/DEVELOPMENT-SETUP.md#L193-L204`

### 3. Install Dependencies
- [ ] Production dependencies
  - commander@14.0.0
  - yaml@2.8.1
  - zod@4.0.15
  - execa@9.6.0
  - fast-glob@3.3.3
- [ ] Development dependencies
  - typescript@5.9.2
  - @types/node@20.11.0
  - tsup@8.5.0
  - vitest@3.2.4
  - @biomejs/biome@2.1.3
- Reference: `docs/DEVELOPMENT-SETUP.md#L36-L55`

### 4. Configure TypeScript
- [ ] Create tsconfig.json
- [ ] Target: ES2022
- [ ] Module: ESNext
- [ ] Strict mode enabled
- [ ] Include src/, exclude node_modules, dist, tests
- Reference: `docs/implementation/phase-1-infrastructure.md#L58-L79`

### 5. Configure Build Tool (tsup)
- [ ] Create tsup.config.ts
- [ ] Entry points: src/index.ts, src/cli.ts
- [ ] Formats: ESM and CJS
- [ ] Generate .d.ts files
- [ ] Target: node18
- Reference: `docs/implementation/phase-1-infrastructure.md#L82-L99`

### 6. Add Package Scripts
- [ ] build: tsup
- [ ] build:watch: tsup --watch
- [ ] dev: tsup --watch
- [ ] typecheck: tsc --noEmit
- [ ] test: vitest
- [ ] lint: biome check
- [ ] format: biome format --write
- Reference: `docs/implementation/phase-1-infrastructure.md#L101-L110`

### 7. Create Source Structure
- [ ] Create src/ directory
- [ ] Create src/types/ directory
- [ ] Create src/config/ directory
- [ ] Create src/hooks/ directory
- [ ] Create src/cli/ directory
- [ ] Create tests/ directory
- Reference: `docs/ARCHITECTURE.md#L96-L128`

### 8. Configure Biome
- [ ] Run pnpm exec biome init
- [ ] Set indent: 2 spaces
- [ ] Enable formatter and linter
- [ ] Set line width: 100
- [ ] Ignore: node_modules, dist, coverage
- Reference: `docs/DEVELOPMENT.md#L46-L69`

### 9. Create Configuration Files
- [ ] Create .npmrc with engine-strict=true
- [ ] Create .nvmrc with Node version
- [ ] Create .gitignore
- Reference: `docs/DEVELOPMENT-SETUP.md#L206-L220`

## Success Criteria
- [ ] pnpm --version shows 10.14.0 or compatible
- [ ] pnpm install completes successfully
- [ ] pnpm typecheck runs without errors
- [ ] pnpm build creates dist/ directory
- [ ] tsup config validated
- [ ] Biome config working
- [ ] All directories created

## Testing Requirements
- [ ] Verify pnpm scripts work
- [ ] Confirm TypeScript compiles empty index.ts
- [ ] Test biome check runs
- [ ] Ensure build outputs both ESM and CJS

## Notes for Implementation Agent
1. Start by enabling pnpm through Corepack
2. Install all dependencies in one pnpm add command
3. Create empty index.ts files to test compilation
4. Don't implement actual logic yet, just structure
5. Ensure all config files are in project root
6. Test each script after adding to package.json