import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(import.meta.url))

function devPort(mode) {
  if (mode === 'admin') return 5174
  return 5173
}

export default defineConfig(({ mode }) => ({
  root: rootDir,
  plugins: [react()],
  cacheDir: mode === 'admin' ? 'node_modules/.vite-admin' : 'node_modules/.vite-user',
  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react') || id.includes('redux')) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
    server: {
      host: 'localhost',
      port: devPort(mode),
      strictPort: true,
      hmr: {
        host: 'localhost',
        port: devPort(mode),
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
}))
