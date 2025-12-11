import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    // Allow Google OAuth and Picker to work
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://apis.google.com https://www.googleapis.com https://accounts.google.com https://www.gstatic.com https://docs.google.com; frame-src 'self' https://docs.google.com https://*.google.com; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 https://apis.google.com https://www.googleapis.com https://accounts.google.com https://*.googleapis.com https://docs.google.com ws://localhost:5173 ws://127.0.0.1:5173;"
    }
  },
})

