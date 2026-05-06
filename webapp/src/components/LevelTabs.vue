<script setup>
const props = defineProps({
  level: { type: [Number, String], required: true },
  counts: { type: Object, required: true }
})
const emit = defineEmits(['update:level'])

const LEVELS = [
  { key: 1, label: 'HSK 1', color: '#38BDF8' },
  { key: 2, label: 'HSK 2', color: '#34D399' },
  { key: 3, label: 'HSK 3', color: '#FBBF24' },
  { key: 4, label: 'HSK 4', color: '#FB7185' },
  { key: 5, label: 'HSK 5', color: '#A78BFA' },
  { key: 'all', label: 'All', color: '#94A3B8' },
]
</script>

<template>
  <nav class="level-tabs">
    <button
      v-for="l in LEVELS"
      :key="l.key"
      class="level-tab"
      :class="{ active: level === l.key }"
      :style="level === l.key ? { '--accent': l.color, borderBottomColor: l.color, color: l.color } : {}"
      @click="emit('update:level', l.key)"
    >
      <span class="tab-label">{{ l.label }}</span>
      <span class="tab-count">{{ counts[l.key] }}</span>
    </button>
  </nav>
</template>

<style scoped>
.level-tabs {
  display: flex;
  gap: 2px;
  background: #0d0d1a;
  padding: 0 16px;
  border-bottom: 1px solid #1e1e3a;
  overflow-x: auto;
  scrollbar-width: none;
}
.level-tabs::-webkit-scrollbar { display: none; }

.level-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 16px 8px;
  color: #555577;
  border-bottom: 2px solid transparent;
  border-radius: 4px 4px 0 0;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
  font-size: 13px;
  gap: 2px;
}
.level-tab:hover { color: #8888aa; }
.level-tab.active { font-weight: 600; }

.tab-label { font-size: 13px; }
.tab-count { font-size: 10px; opacity: 0.7; }
</style>
