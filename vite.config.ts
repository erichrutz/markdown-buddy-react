import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/markdown-buddy-react/' : '/',
  server: {
    port: 3002,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['mermaid'],
    exclude: []
  },
  ssr: {
    noExternal: ['mermaid']
  },
  define: {
    // This helps with mermaid's dynamic imports in development
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})