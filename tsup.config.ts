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
    clean: true,
    sourcemap: false,
  },
]);
