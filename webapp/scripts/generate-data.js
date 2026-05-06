import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseTSV } from './parse-tsv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT_DIR = path.resolve(__dirname, '../../Scripts and data/correct pinyin/new')
const OUTPUT_DIR = path.resolve(__dirname, '../src/data')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

for (const level of [1, 2, 3, 4, 5]) {
  const raw = fs.readFileSync(path.join(INPUT_DIR, `HSK${level}.tsv`), 'utf-8')
  const words = parseTSV(raw)
  fs.writeFileSync(path.join(OUTPUT_DIR, `hsk${level}.json`), JSON.stringify(words))
  console.log(`HSK${level}: ${words.length} words`)
}
