import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.jpeg'],
      manifest: {
        name: 'SN Enviro Ticket System',
        short_name: 'SN Enviro',
        description: 'Offline-capable ticketing system for field engineers',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['lucide-react']
  }
})
