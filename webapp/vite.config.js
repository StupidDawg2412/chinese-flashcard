import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUDIO_DIR = path.resolve(__dirname, '../New HSK (2025)/Audio')

function attachAudio(middlewares) {
  middlewares.use('/audio', (req, res) => {
    const filename = decodeURIComponent(req.url.replace(/^\//, ''))
    const filepath = path.join(AUDIO_DIR, filename)
    if (fs.existsSync(filepath)) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      fs.createReadStream(filepath).pipe(res)
    } else {
      res.statusCode = 404
      res.end()
    }
  })
}

const base = process.env.GITHUB_ACTIONS ? '/chinese-flashcard/' : '/'

export default defineConfig({
  base,
  plugins: [
    vue(),
    {
      name: 'serve-audio',
      configureServer(server) { attachAudio(server.middlewares) },
      configurePreviewServer(server) { attachAudio(server.middlewares) }
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'HSK Flashcards',
        short_name: 'HSK',
        description: 'HSK 3.0 Mandarin flashcards, offline-capable',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 12000, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
})
