import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5000',
        ws: true,
      },
      '/devradar-avatars': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/devradar-covers': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      },
      '/devradar-models': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      }
    }
  }
})
