<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FlashCard from './components/FlashCard.vue'
import LevelTabs from './components/LevelTabs.vue'
import { useCards } from './composables/useCards.js'
import hsk1Raw from './data/hsk1.json'
import hsk2Raw from './data/hsk2.json'
import hsk3Raw from './data/hsk3.json'
import hsk4Raw from './data/hsk4.json'
import hsk5Raw from './data/hsk5.json'

const COLORS = { 1: '#38BDF8', 2: '#34D399', 3: '#FBBF24', 4: '#FB7185', 5: '#A78BFA', all: '#94A3B8' }

const allData = {
  1: hsk1Raw.map(c => ({ ...c, level: 1 })),
  2: hsk2Raw.map(c => ({ ...c, level: 2 })),
  3: hsk3Raw.map(c => ({ ...c, level: 3 })),
  4: hsk4Raw.map(c => ({ ...c, level: 4 })),
  5: hsk5Raw.map(c => ({ ...c, level: 5 })),
}

const currentLevel = ref(1)
const cardsData = computed(() =>
  currentLevel.value === 'all'
    ? [1, 2, 3, 4, 5].flatMap(l => allData[l])
    : allData[currentLevel.value]
)

const levelColor = computed(() => COLORS[currentLevel.value])

const {
  card, position, total, progress,
  isFlipped, isShuffled, hideKnown, known, isKnown, knownCount,
  next, prev, flip, markKnown, resetProgress
} = useCards(cardsData)

const levelCounts = computed(() => {
  const c = {}
  for (const l of [1, 2, 3, 4, 5]) c[l] = allData[l].length
  c.all = [1, 2, 3, 4, 5].reduce((s, l) => s + allData[l].length, 0)
  return c
})

const audioEl = ref(null)

function playAudio() {
  if (!card.value || !audioEl.value) return
  audioEl.value.src = `/audio/cmn-${card.value.simplified}.mp3`
  audioEl.value.play().catch(() => {})
}

function handleKey(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    isFlipped.value ? next() : flip()
  } else if (e.key === 'ArrowRight') {
    next()
  } else if (e.key === 'ArrowLeft') {
    prev()
  } else if (e.key === 'k' || e.key === 'K') {
    markKnown()
  } else if (e.key === 'a' || e.key === 'A') {
    playAudio()
  }
}

onMounted(() => window.addEventListener('keydown', handleKey))
onUnmounted(() => window.removeEventListener('keydown', handleKey))

function setLevel(l) {
  currentLevel.value = l
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>HSK Flashcards <span class="year">2025</span></h1>
    </header>

    <LevelTabs :level="currentLevel" :counts="levelCounts" @update:level="setLevel" />

    <main class="main">
      <div class="progress-row">
        <span class="counter">{{ card ? position : 0 }} / {{ total }}</span>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progress + '%', background: levelColor }" />
        </div>
        <span class="known-label">✓ {{ knownCount }}</span>
      </div>

      <div class="card-area">
        <FlashCard
          v-if="card"
          :card="card"
          :level-color="levelColor"
          :is-flipped="isFlipped"
          :is-known="isKnown"
          @flip="flip"
        />
        <div v-else class="empty">
          <p>All cards marked as known! 🎉</p>
          <button class="btn-primary" @click="hideKnown = false">Show all cards</button>
        </div>
      </div>

      <div class="controls">
        <button class="ctrl-btn nav-btn" @click="prev" :disabled="!card">
          <span>←</span> Prev
        </button>

        <div class="ctrl-group">
          <button
            class="ctrl-btn icon-btn"
            :class="{ active: isShuffled }"
            @click="isShuffled = !isShuffled"
            title="Shuffle (S)"
          >⇌</button>

          <button
            class="ctrl-btn icon-btn audio-btn"
            @click="playAudio"
            :disabled="!card"
            title="Play audio (A)"
          >🔊</button>

          <button
            class="ctrl-btn icon-btn known-btn"
            :class="{ known: isKnown }"
            @click="markKnown"
            :disabled="!card"
            title="Mark known (K)"
          >{{ isKnown ? '✓' : '○' }}</button>
        </div>

        <button class="ctrl-btn nav-btn" @click="next" :disabled="!card">
          Next <span>→</span>
        </button>
      </div>

      <div class="options-row">
        <label class="toggle">
          <input type="checkbox" v-model="hideKnown" />
          <span>Hide known cards</span>
        </label>
        <button v-if="knownCount > 0" class="reset-btn" @click="resetProgress">
          Reset progress
        </button>
      </div>

      <div class="shortcuts-hint">
        <kbd>Space</kbd> flip &nbsp;
        <kbd>←</kbd><kbd>→</kbd> navigate &nbsp;
        <kbd>K</kbd> known &nbsp;
        <kbd>A</kbd> audio
      </div>
    </main>

    <audio ref="audioEl" />
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  --bg: #0a0a18;
  --surface: #16213e;
  --border: #1e1e3a;
  --text: #e2e2f0;
  --muted: #555577;
}

body {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

button { cursor: pointer; border: none; outline: none; background: none; font-family: inherit; }
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  background: #0d0d1a;
}

h1 {
  font-size: 20px;
  font-weight: 700;
  color: #e2e2f0;
  letter-spacing: -0.02em;
}

.year {
  font-size: 13px;
  font-weight: 400;
  color: #555577;
  margin-left: 6px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 20px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.counter {
  font-size: 13px;
  color: var(--muted);
  min-width: 54px;
  text-align: right;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;
}

.known-label {
  font-size: 13px;
  color: #34D399;
  min-width: 36px;
}

.card-area {
  width: 100%;
  max-width: 480px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--muted);
  font-size: 16px;
}

.btn-primary {
  background: #38BDF8;
  color: #0a0a18;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 480px;
  justify-content: space-between;
}

.ctrl-btn {
  padding: 10px 18px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, opacity 0.15s;
}
.ctrl-btn:hover:not(:disabled) { background: #1e2a4a; }
.ctrl-btn:disabled { opacity: 0.3; cursor: default; }

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: center;
}

.ctrl-group {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border-radius: 12px;
}

.icon-btn.active {
  background: #1e2a4a;
  border-color: #38BDF8;
  color: #38BDF8;
}

.known-btn.known {
  color: #34D399;
  border-color: #34D399;
}

.options-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 480px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
}
.toggle input { accent-color: #38BDF8; }

.reset-btn {
  font-size: 12px;
  color: #FB7185;
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}
.reset-btn:hover { border-color: #FB7185; }

.shortcuts-hint {
  font-size: 11px;
  color: #33334a;
}

kbd {
  background: #1a1a30;
  border: 1px solid #2a2a4a;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 11px;
  font-family: monospace;
}
</style>
