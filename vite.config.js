import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  root: rootDir,
  plugins: [react()],
  cacheDir: mode === 'admin' ? 'node_modules/.vite-admin' : 'node_modules/.vite-user',
  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
  },
    server: {
      host: 'localhost',
      port: mode === 'admin' ? 5174 : 5173,
      strictPort: true,
      hmr: {
        host: 'localhost',
        port: mode === 'admin' ? 5174 : 5173,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
}))
