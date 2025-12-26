import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.spec.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    sequence: {
      shuffle: false,
    },
    fileParallelism: false,
  },
});
