import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://65.2.82.202:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
