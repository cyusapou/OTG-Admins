<template>
  <div class="stats-card">
    <div class="card-icon">
      <i v-if="icon && icon.startsWith('fa')" :class="icon"></i>
      <span v-else>{{ icon }}</span>
    </div>
    <div class="card-body">
      <p class="card-label">{{ label }}</p>
      <p class="card-value">{{ value }}</p>
      <span v-if="trend" class="card-trend" :class="trendPositive ? 'up' : 'down'">
        <i :class="trendPositive ? 'fas fa-chart-line' : 'fas fa-chart-line'" style="margin-right: 4px;"></i> {{ trend }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: String,
  label: String,
  value: [String, Number],
  trend: String
})

const trendPositive = computed(() => {
  if (!props.trend) return true
  return !props.trend.startsWith('-')
})
</script>

<style scoped>
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.2s;
}

.stats-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
  border-radius: 8px;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #5a6c7d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
}

.card-trend {
  font-size: 12px;
  color: #10b981;
  font-weight: 600;
}

.card-trend.down {
  color: #ef4444;
}

@media (max-width: 600px) {
  .stats-card {
    padding: 16px;
  }

  .card-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
  }

  .card-value {
    font-size: 20px;
  }
}

/* Dark mode */
html.dark .stats-card {
  background: var(--surface);
  border-color: var(--border);
  box-shadow: none;
}

html.dark .stats-card:hover {
  box-shadow: var(--glow);
}

html.dark .card-icon {
  background: var(--bg);
}

html.dark .card-label {
  color: var(--text-muted);
}

html.dark .card-value {
  color: var(--text);
}

html.dark .card-trend {
  color: var(--green);
}

html.dark .card-trend.down {
  color: #ef4444;
}
</style>
