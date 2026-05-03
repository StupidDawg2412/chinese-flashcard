import { ref, computed, watch } from 'vue'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function loadKnown() {
  try { return new Set(JSON.parse(localStorage.getItem('hsk-known') || '[]')) }
  catch { return new Set() }
}

export function useCards(cardsData) {
  const index = ref(0)
  const isFlipped = ref(false)
  const isShuffled = ref(false)
  const hideKnown = ref(false)
  const known = ref(loadKnown())
  const order = ref([])

  const cardKey = (c) => `${c.level}-${c.id}`

  function saveKnown() {
    localStorage.setItem('hsk-known', JSON.stringify([...known.value]))
  }

  const visible = computed(() =>
    hideKnown.value
      ? cardsData.value.filter(c => !known.value.has(cardKey(c)))
      : cardsData.value
  )

  function buildOrder() {
    const indices = [...Array(visible.value.length).keys()]
    order.value = isShuffled.value ? shuffle(indices) : indices
    index.value = 0
    isFlipped.value = false
  }

  watch(visible, buildOrder, { immediate: true })
  watch(isShuffled, buildOrder)

  const card = computed(() => visible.value.length ? visible.value[order.value[index.value]] : null)
  const total = computed(() => visible.value.length)
  const position = computed(() => index.value + 1)
  const progress = computed(() => total.value ? (position.value / total.value) * 100 : 0)
  const isKnown = computed(() => card.value ? known.value.has(cardKey(card.value)) : false)
  const knownCount = computed(() => known.value.size)

  function next() {
    isFlipped.value = false
    setTimeout(() => { index.value = (index.value + 1) % Math.max(total.value, 1) }, 120)
  }

  function prev() {
    isFlipped.value = false
    setTimeout(() => { index.value = (index.value - 1 + Math.max(total.value, 1)) % Math.max(total.value, 1) }, 120)
  }

  function flip() { isFlipped.value = !isFlipped.value }

  function markKnown() {
    if (!card.value) return
    const key = cardKey(card.value)
    const n = new Set(known.value)
    if (n.has(key)) n.delete(key)
    else n.add(key)
    known.value = n
    saveKnown()
  }

  function resetProgress() {
    known.value = new Set()
    saveKnown()
  }

  return { card, index, total, position, progress, isFlipped, isShuffled, hideKnown, known, isKnown, knownCount, next, prev, flip, markKnown, resetProgress }
}
