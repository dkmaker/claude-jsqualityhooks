import { defineConfig } from 'tsup';

export default defineConfig([
  // Library build (index.ts)
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    target: 'node18',
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: false,
    bundle: true,
    outDir: 'dist',
    external: [
      'commander',
      'yaml',
      'zod',
      'execa',
      'fast-glob'
    ],
  },
  // CLI build (cli.ts) - CJS only with shebang
  {
    entry: {
      cli: 'src/cli.ts',
    },
    format: ['cjs'],
    target: 'node18',
    dts: true,
    sourcemap: true,
    splitting: false,
    minify: false,
    bundle: true,
    outDir: 'dist',
    external: [
      'commander',
      'yaml',
      'zod',
      'execa',
      'fast-glob'
    ],
    banner: {
      js: '#!/usr/bin/env node'
    },
  }
]);