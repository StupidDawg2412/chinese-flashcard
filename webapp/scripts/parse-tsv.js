export function parseTSVLine(line) {
  const [traditional, simplified, pinyin, definitions] = line.split('\t')
  return {
    traditional: traditional?.trim() ?? '',
    simplified: simplified?.trim() ?? '',
    pinyin: pinyin?.trim() ?? '',
    definitions: definitions?.trim() ?? ''
  }
}

export function parseTSV(raw) {
  return raw
    .trim()
    .split('\n')
    .map(parseTSVLine)
    .filter(w => w.simplified)
    .map((w, i) => ({ id: i + 1, ...w }))
}
