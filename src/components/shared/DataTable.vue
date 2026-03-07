<template>
  <div class="dt-wrap">
    <div v-if="loading" class="dt-skeleton">
      <div class="skel-row" v-for="i in 5" :key="i">
        <div class="skel-cell" v-for="j in columns.length" :key="j"></div>
      </div>
    </div>

    <div v-else-if="error" class="dt-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="dt-retry" @click="$emit('retry')">
        <i class="fas fa-redo"></i> Try Again
      </button>
    </div>

    <div v-else-if="!rows.length" class="dt-empty">
      <i :class="emptyIcon || 'fas fa-inbox'"></i>
      <p class="dt-empty-title">{{ emptyTitle || 'No data yet' }}</p>
      <p class="dt-empty-sub">{{ emptySubtitle }}</p>
      <slot name="empty-action" />
    </div>

    <div v-else class="dt-table-wrap">
      <table class="dt-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :style="col.width ? { width: col.width } : {}">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in paginatedRows"
            :key="row.id || i"
            :class="{ clickable: !!onRowClick }"
            @click="onRowClick && onRowClick(row)"
          >
            <td v-for="col in columns" :key="col.key">
              <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="dt-pagination">
        <button :disabled="page <= 1" @click="page--">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="page++">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  loading: Boolean,
  error: String,
  emptyIcon: String,
  emptyTitle: String,
  emptySubtitle: String,
  onRowClick: Function,
  perPage: { type: Number, default: 20 },
})

defineEmits(['retry'])

const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(props.rows.length / props.perPage)))
const paginatedRows = computed(() => {
  const start = (page.value - 1) * props.perPage
  return props.rows.slice(start, start + props.perPage)
})
</script>

<style scoped>
.dt-skeleton { display: flex; flex-direction: column; gap: 8px; padding: 16px 0; }
.skel-row { display: flex; gap: 12px; }
.skel-cell {
  flex: 1; height: 20px; border-radius: 6px; background: #141414;
  animation: shimmer 1.5s ease infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.dt-error, .dt-empty {
  text-align: center; padding: 48px 20px; color: rgba(255,255,255,0.4);
}
.dt-error i, .dt-empty i { font-size: 40px; margin-bottom: 12px; display: block; }
.dt-empty i { color: #22c55e; }
.dt-error i { color: #ef4444; }
.dt-empty-title { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.7); margin: 0 0 4px; }
.dt-empty-sub { font-size: 13px; margin: 0 0 16px; }
.dt-retry {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: #22c55e; color: #fff; font-weight: 600; cursor: pointer;
}

.dt-table-wrap { overflow-x: auto; }
.dt-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.dt-table thead th {
  text-align: left; padding: 10px 14px;
  font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;
  color: rgba(255,255,255,0.35); background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.dt-table tbody tr { transition: background 0.1s; }
.dt-table tbody tr:nth-child(even) { background: rgba(255,255,255,0.015); }
.dt-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.dt-table tbody tr.clickable { cursor: pointer; }
.dt-table tbody td {
  padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.8);
}

.dt-pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 16px 0; font-size: 13px; color: rgba(255,255,255,0.5);
}
.dt-pagination button {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07);
  background: transparent; color: rgba(255,255,255,0.5); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.dt-pagination button:hover:not(:disabled) { background: rgba(255,255,255,0.04); color: #22c55e; }
.dt-pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
