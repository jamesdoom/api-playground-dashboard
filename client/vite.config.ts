import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, Vite forwards /api requests to the local Express server.
// In production, the same /api paths are handled by Vercel serverless functions.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
