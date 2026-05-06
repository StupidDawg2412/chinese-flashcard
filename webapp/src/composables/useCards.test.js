import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCards } from './useCards.js'

const CARDS = [
  { id: 1, level: 1, simplified: '爱', traditional: '愛', pinyin: 'ài', definitions: 'love' },
  { id: 2, level: 1, simplified: '我', traditional: '我', pinyin: 'wǒ', definitions: 'I, me' },
  { id: 3, level: 1, simplified: '你', traditional: '你', pinyin: 'nǐ', definitions: 'you' },
]

describe('useCards', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('initialises at first card', () => {
    const { card, position, total } = useCards(ref(CARDS))
    expect(position.value).toBe(1)
    expect(total.value).toBe(3)
    expect(card.value.simplified).toBe('爱')
  })

  it('next() advances to second card', async () => {
    const { card, next } = useCards(ref(CARDS))
    next()
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(card.value.simplified).toBe('我')
  })

  it('prev() wraps to last card from first', async () => {
    const { card, prev } = useCards(ref(CARDS))
    prev()
    vi.advanceTimersByTime(200)
    await nextTick()
    expect(card.value.simplified).toBe('你')
  })

  it('next() wraps around at end', async () => {
    const { card, next } = useCards(ref(CARDS))
    for (let i = 0; i < 3; i++) {
      next(); vi.advanceTimersByTime(200); await nextTick()
    }
    expect(card.value.simplified).toBe('爱')
  })

  it('flip() toggles isFlipped', () => {
    const { isFlipped, flip } = useCards(ref(CARDS))
    expect(isFlipped.value).toBe(false)
    flip()
    expect(isFlipped.value).toBe(true)
    flip()
    expect(isFlipped.value).toBe(false)
  })

  it('next() resets flip after delay', async () => {
    const { isFlipped, flip, next } = useCards(ref(CARDS))
    flip()
    expect(isFlipped.value).toBe(true)
    next()
    expect(isFlipped.value).toBe(false)
    vi.advanceTimersByTime(200)
    await nextTick()
  })

  it('markKnown() marks current card', () => {
    const { isKnown, knownCount, markKnown } = useCards(ref(CARDS))
    expect(isKnown.value).toBe(false)
    markKnown()
    expect(isKnown.value).toBe(true)
    expect(knownCount.value).toBe(1)
  })

  it('markKnown() toggles off', () => {
    const { isKnown, markKnown } = useCards(ref(CARDS))
    markKnown()
    markKnown()
    expect(isKnown.value).toBe(false)
  })

  it('markKnown() persists to localStorage', () => {
    const { markKnown } = useCards(ref(CARDS))
    markKnown()
    const stored = JSON.parse(localStorage.getItem('hsk-known'))
    expect(stored).toContain('1-1')
  })

  it('hideKnown filters marked cards', async () => {
    const { markKnown, hideKnown, total } = useCards(ref(CARDS))
    markKnown()
    hideKnown.value = true
    await nextTick()
    expect(total.value).toBe(2)
  })

  it('resetProgress() clears all known', async () => {
    const { markKnown, hideKnown, resetProgress, knownCount, total } = useCards(ref(CARDS))
    markKnown()
    hideKnown.value = true
    await nextTick()
    resetProgress()
    await nextTick()
    expect(knownCount.value).toBe(0)
    expect(total.value).toBe(3)
  })

  it('returns null card when all filtered', async () => {
    const data = ref([{ id: 1, level: 1, simplified: '爱', traditional: '愛', pinyin: 'ài', definitions: 'love' }])
    const { card, markKnown, hideKnown } = useCards(data)
    markKnown()
    hideKnown.value = true
    await nextTick()
    expect(card.value).toBeNull()
  })

  it('level change resets to first card', async () => {
    const data = ref(CARDS)
    const { card, next, position } = useCards(data)
    next(); vi.advanceTimersByTime(200); await nextTick()
    expect(position.value).toBe(2)
    data.value = [...CARDS].reverse()
    await nextTick()
    expect(position.value).toBe(1)
  })
})
