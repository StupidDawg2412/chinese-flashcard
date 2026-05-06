import { describe, it, expect } from 'vitest'
import { parseTSVLine, parseTSV } from './parse-tsv.js'

describe('parseTSVLine', () => {
  it('parses all fields', () => {
    const r = parseTSVLine('愛\t爱\tài\tlove, like, be fond of')
    expect(r).toEqual({ traditional: '愛', simplified: '爱', pinyin: 'ài', definitions: 'love, like, be fond of' })
  })

  it('handles same trad/simp', () => {
    const r = parseTSVLine('八\t八\tbā\tdet.: eight')
    expect(r.traditional).toBe(r.simplified)
    expect(r.traditional).toBe('八')
  })

  it('trims whitespace', () => {
    const r = parseTSVLine(' 我 \t 我 \t wǒ \t I, me ')
    expect(r.simplified).toBe('我')
    expect(r.pinyin).toBe('wǒ')
  })

  it('handles missing definitions', () => {
    const r = parseTSVLine('的\t的\tde\t')
    expect(r.definitions).toBe('')
    expect(r.simplified).toBe('的')
  })
})

describe('parseTSV', () => {
  it('parses multiple lines', () => {
    const raw = '愛\t爱\tài\tlove\n我\t我\twǒ\tI, me\n你\t你\tnǐ\tyou'
    const words = parseTSV(raw)
    expect(words).toHaveLength(3)
    expect(words[0].simplified).toBe('爱')
    expect(words[2].pinyin).toBe('nǐ')
  })

  it('filters out lines with no simplified', () => {
    const raw = '愛\t爱\tài\tlove\n\n我\t我\twǒ\tI'
    const words = parseTSV(raw)
    expect(words).toHaveLength(2)
  })

  it('assigns sequential ids', () => {
    const raw = '爱\t爱\tài\tlove\n我\t我\twǒ\tI'
    const words = parseTSV(raw)
    expect(words.map(w => w.id)).toEqual([1, 2])
  })
})
