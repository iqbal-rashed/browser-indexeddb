import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    clean: true,
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    target: 'es2020',
    outDir: 'dist',
    dts: true,
    clean: false,
    sourcemap: false,
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    target: 'es2020',
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    clean: false,
    minify: true,
    sourcemap: false,
  },
]);
