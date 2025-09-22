/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'threads',
    isolate: false,
    deps: {
      optimizer: {
        web: {
          exclude: ['whatwg-url', 'webidl-conversions', 'jsdom', '@testing-library/jest-dom']
        },
        ssr: {
          exclude: ['whatwg-url', 'webidl-conversions', 'jsdom', '@testing-library/jest-dom']
        }
      }
    },
    server: {
      deps: {
        external: ['whatwg-url', 'webidl-conversions']
      }
    },
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/main.tsx',
        'src/i18n/**'
      ]
    }
  }
});