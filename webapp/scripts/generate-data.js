import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseTSV } from './parse-tsv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT_DIR = path.resolve(__dirname, '../../Scripts and data/correct pinyin/new')
const AUDIO_DIR = path.resolve(__dirname, '../../New HSK (2025)/Audio')
const OUTPUT_DIR = path.resolve(__dirname, '../src/data')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

for (const level of [1, 2, 3, 4, 5]) {
  const raw = fs.readFileSync(path.join(INPUT_DIR, `HSK${level}.tsv`), 'utf-8')
  const words = parseTSV(raw)
  fs.writeFileSync(path.join(OUTPUT_DIR, `hsk${level}.json`), JSON.stringify(words))
  console.log(`HSK${level}: ${words.length} words`)
}

if (fs.existsSync(AUDIO_DIR)) {
  const audioWords = fs.readdirSync(AUDIO_DIR)
    .map(f => f.match(/^cmn-(.+)\.mp3$/)?.[1])
    .filter(Boolean)
  fs.writeFileSync(path.join(OUTPUT_DIR, 'audio-index.json'), JSON.stringify(audioWords))
  console.log(`Audio index: ${audioWords.length} files`)
} else {
  fs.writeFileSync(path.join(OUTPUT_DIR, 'audio-index.json'), '[]')
  console.log('Audio dir not found, wrote empty index')
}
