import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUDIO_DIR = path.resolve(__dirname, '../New HSK (2025)/Audio')

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'serve-audio',
      configureServer(server) {
        server.middlewares.use('/audio', (req, res, next) => {
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
    }
  ]
})
