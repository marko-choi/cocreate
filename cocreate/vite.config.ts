import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cocreate/',  // This matches your GitHub repo name
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure proper chunks and asset handling
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
