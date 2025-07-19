import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.jsx'],
    globals: true,
    css: true,
    exclude: [
      'tests/e2e/**/*', // Exclude E2E tests from Vitest
      'node_modules/**/*', // Exclude node_modules tests
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/*.config.ts',
        'build/',
        'dist/',
        'coverage/',
      ],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
    },
  },
}); 