export function parseTSVLine(line) {
  const [num, traditional, simplified, pinyin, definitions] = line.split('\t')
  return {
    id: parseInt(num),
    traditional: traditional?.trim() ?? '',
    simplified: simplified?.trim() ?? '',
    pinyin: pinyin?.trim() ?? '',
    definitions: definitions?.trim() ?? ''
  }
}

export function parseTSV(raw) {
  return raw.trim().split('\n').map(parseTSVLine).filter(w => w.simplified)
}
