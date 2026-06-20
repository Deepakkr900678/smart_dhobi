import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 1100,
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', 'smartdhobi.in', 'www.smartdhobi.in']
  },
  preview: {
    host: '0.0.0.0',
    port: 1100,
    allowedHosts: ['localhost', '127.0.0.1', 'smartdhobi.in', 'www.smartdhobi.in']
  }
})
