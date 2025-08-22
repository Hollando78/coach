import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.PUBLIC_BASE_PATH || '/doodle-td'
  const apiBase = env.API_BASE_PATH || '/doodle-td-api'

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 51501,
      proxy: {
        [apiBase]: {
          target: 'http://127.0.0.1:51502',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${apiBase}`), ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            game: ['pixi.js'],
          },
        },
      },
    },
  }
})