import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : '/markdown-buddy-react/'

  return {
    plugins: [react()],
    base,
    server: {
      port: 3002,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsDir: 'assets'
    }
  }
})