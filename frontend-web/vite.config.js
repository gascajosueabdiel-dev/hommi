// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Al compilar ("npm run build") el resultado se guarda directamente en la carpeta
    // que sirve el backend, así no hay que copiar archivos a mano.
    outDir: '../backend v1 8 2/public',
    emptyOutDir: true, // vacía esa carpeta antes de escribir el build nuevo
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://hommi.homes',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})