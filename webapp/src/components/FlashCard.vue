<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
  levelColor: { type: String, default: '#94A3B8' },
  isFlipped: { type: Boolean, default: false },
  isKnown: { type: Boolean, default: false },
})
const emit = defineEmits(['flip'])

const hanzi = computed(() => props.card.simplified || '')
const pinyin = computed(() => props.card.pinyin || '')

const topDefs = computed(() => {
  if (!props.card.definitions) return []
  return props.card.definitions
    .split(', ')
    .slice(0, 5)
    .filter(Boolean)
})

const showTraditional = computed(() =>
  props.card.traditional && props.card.traditional !== props.card.simplified
)
</script>

<template>
  <div class="card-scene" @click="emit('flip')" role="button" tabindex="0" @keydown.enter="emit('flip')" @keydown.space.prevent="emit('flip')">
    <div class="card" :class="{ flipped: isFlipped, known: isKnown }">

      <div class="card-face card-front" :style="{ '--accent': levelColor }">
        <div class="card-badge" :style="{ background: levelColor }">HSK {{ card.level }}</div>
        <div v-if="isKnown" class="known-mark">✓</div>
        <div class="card-hanzi">{{ hanzi }}</div>
        <div v-if="pinyin" class="card-pinyin card-pinyin-sm">{{ pinyin }}</div>
        <div class="card-hint">tap to reveal</div>
      </div>

      <div class="card-face card-back" :style="{ '--accent': levelColor }">
        <div class="card-badge" :style="{ background: levelColor }">HSK {{ card.level }}</div>
        <div v-if="isKnown" class="known-mark">✓</div>
        <div class="card-hanzi card-hanzi-sm">{{ hanzi }}</div>
        <div class="card-pinyin">{{ pinyin }}</div>
        <div v-if="showTraditional" class="card-traditional">{{ card.traditional }}</div>
        <div class="card-defs">
          <span v-for="(def, i) in topDefs" :key="i" class="card-def">{{ def }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.card-scene {
  perspective: 1200px;
  width: 100%;
  max-width: 480px;
  height: 300px;
  cursor: pointer;
  outline: none;
}

.card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}
.card.flipped { transform: rotateY(180deg); }

.card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 20px;
  border: 2px solid var(--accent, #94A3B8);
  background: #16213e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  transition: border-color 0.3s;
}

.card-back { transform: rotateY(180deg); }

.card-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  color: #0a0a18;
  letter-spacing: 0.05em;
}

.known-mark {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 17px;
  color: #34D399;
  font-weight: 700;
}

.card-hanzi {
  font-size: 93px;
  line-height: 1;
  font-weight: 300;
  color: #f0f0ff;
  letter-spacing: -2px;
}
.card-hanzi-sm { font-size: 45px; margin-bottom: 0; }

.card-hint {
  font-size: 13px;
  color: #444466;
  position: absolute;
  bottom: 18px;
}

.card-pinyin {
  font-size: 30px;
  color: var(--accent, #94A3B8);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.card-pinyin-sm {
  font-size: 19px;
  margin-top: 4px;
}

.card-traditional {
  font-size: 17px;
  color: #666688;
}

.card-defs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.card-def {
  font-size: 15px;
  color: #a0a0c0;
  text-align: center;
}
.card-def:first-child {
  font-size: 19px;
  color: #d0d0f0;
  font-weight: 500;
}
</style>
