<template>
  <span class="badge" :class="variant">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String })

const variant = computed(() => {
  const map = {
    active: 'green', approved: 'green', paid: 'green', valid: 'green',
    resolved: 'green', completed: 'green', confirmed: 'green', arrived: 'green',
    pending: 'yellow', under_review: 'yellow', boarding: 'yellow', scheduled: 'yellow',
    upcoming: 'yellow',
    rejected: 'red', cancelled: 'red', suspended: 'red', critical: 'red',
    high: 'red', expired: 'red', invalid: 'red',
    inactive: 'muted', open: 'muted', low: 'muted', medium: 'muted',
    in_progress: 'blue',
  }
  return map[props.status] || 'muted'
})

const label = computed(() => (props.status || '').replace(/_/g, ' '))
</script>

<style scoped>
.badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 600; text-transform: capitalize; white-space: nowrap;
}
.green { background: rgba(34,197,94,0.12); color: #22c55e; }
.yellow { background: rgba(234,179,8,0.12); color: #eab308; }
.red { background: rgba(239,68,68,0.12); color: #ef4444; }
.muted { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
.blue { background: rgba(59,130,246,0.12); color: #3b82f6; }
</style>
