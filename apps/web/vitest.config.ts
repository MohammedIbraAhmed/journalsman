/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment setup
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      './tests/setup.ts'
    ],
    css: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/setup.ts',
        'tests/utils/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        '.next/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test patterns
    include: [
      'tests/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
    ],

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['verbose'],

    // Pool options for parallel testing
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1,
      },
    },

    // Retry configuration
    retry: 2,

    // Watch options
    watch: false,
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/tests': path.resolve(__dirname, './tests'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@database': path.resolve(__dirname, '../../packages/database/src'),
    },
  },

  // Define global constants
  define: {
    __TEST__: true,
  },
})