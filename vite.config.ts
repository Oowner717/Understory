import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages project site serves from /<repo>/; override with UNDERSTORY_BASE if needed.
const base = process.env.UNDERSTORY_BASE ?? '/Understory/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['deck/manifest.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,webp,svg,png,json}'],
      },
      manifest: {
        name: 'Understory',
        short_name: 'Understory',
        description: 'A naturalist’s tarot journal. Reflection, not fortune.',
        start_url: '.',
        display: 'standalone',
        background_color: '#F4EEDF',
        theme_color: '#F4EEDF',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
  },
})
