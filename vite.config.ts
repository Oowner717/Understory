import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/*
 * The reversed corpus is written during the writing campaign and gated
 * behind the paid tier in the native app. The playtest renders no
 * reversals, so shipping that text costs bundle for nothing. Roughly half
 * the corpus. Stripped from production builds only, so the dev-only
 * #/writing dashboard still sees and edits the full data.
 */
function stripReversedCopy() {
  return {
    name: 'understory-strip-reversed',
    apply: 'build' as const,
    // 'pre' so this sees the raw JSON, before Vite's json plugin turns it
    // into a module. Returns JSON, and the json plugin proceeds normally.
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.endsWith('content/meanings.json')) return null
      const data = JSON.parse(code)
      for (const m of data.meanings) m.reversed = { readingLines: [], questions: [], libraryEntry: '' }
      return { code: JSON.stringify(data), map: null }
    },
  }
}

// GitHub Pages project site serves from /<repo>/; override with UNDERSTORY_BASE if needed.
const base = process.env.UNDERSTORY_BASE ?? '/Understory/'

export default defineConfig({
  base,
  plugins: [
    react(),
    stripReversedCopy(),
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
