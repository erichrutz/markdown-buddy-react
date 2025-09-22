/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    isolate: true,
    deps: {
      optimizer: {
        web: {
          exclude: ['whatwg-url', 'webidl-conversions']
        },
        ssr: {
          exclude: ['whatwg-url', 'webidl-conversions']
        }
      }
    },
    server: {
      deps: {
        external: ['whatwg-url', 'webidl-conversions']
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