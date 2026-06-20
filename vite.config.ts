import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// NOTE: vite-plugin-pwa removed temporarily — no Vite 7 support yet.
// PWA / offline support will be added in Phase 2 once the plugin
// releases a compatible version.

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
