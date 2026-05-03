import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT_DIR = path.resolve(__dirname, '../../Scripts and data/correct pinyin/new')
const OUTPUT_DIR = path.resolve(__dirname, '../src/data')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

for (const level of [1, 2, 3, 4, 5]) {
  const raw = fs.readFileSync(path.join(INPUT_DIR, `HSK${level}.tsv`), 'utf-8')
  const words = raw.trim().split('\n').map(line => {
    const parts = line.split('\t')
    const [num, traditional, simplified, pinyin, definitions] = parts
    return {
      id: parseInt(num),
      traditional: traditional?.trim() ?? '',
      simplified: simplified?.trim() ?? '',
      pinyin: pinyin?.trim() ?? '',
      definitions: definitions?.trim() ?? ''
    }
  }).filter(w => w.simplified)

  fs.writeFileSync(path.join(OUTPUT_DIR, `hsk${level}.json`), JSON.stringify(words))
  console.log(`HSK${level}: ${words.length} words`)
}
