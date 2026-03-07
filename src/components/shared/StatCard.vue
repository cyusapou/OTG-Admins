<template>
  <div class="stat-card" :class="{ highlight }">
    <div class="stat-icon" :style="iconBg">
      <i :class="icon"></i>
    </div>
    <div class="stat-body">
      <span class="stat-label">{{ label }}</span>
      <span class="stat-value">{{ loading ? '—' : value }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: String,
  label: String,
  value: [String, Number],
  highlight: Boolean,
  loading: Boolean,
  color: { type: String, default: '#22c55e' },
})

const iconBg = computed(() => ({
  background: props.highlight ? 'rgba(239,68,68,0.12)' : `${props.color}15`,
  color: props.highlight ? '#ef4444' : props.color,
}))
</script>

<style scoped>
.stat-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color 0.15s;
}
.stat-card.highlight { border-color: rgba(239,68,68,0.3); }
.stat-card:hover { border-color: rgba(34,197,94,0.2); }

.stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}

.stat-body { display: flex; flex-direction: column; min-width: 0; }
.stat-label { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 500; }
.stat-value { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9); margin-top: 2px; }
</style>
