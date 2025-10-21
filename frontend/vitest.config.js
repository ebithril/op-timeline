import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'src/views/**',
        'src/main.js',
        'src/test-utils.js',
        'src/services/api.js',
        'node_modules/**',
        'dist/**',
        '**/*.config.js',
        '**/*.spec.js',
        '**/*.test.js',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 79,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
