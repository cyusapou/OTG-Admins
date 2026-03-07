<template>
  <div class="worker-history">
    <!-- Header -->
    <header class="history-header">
      <button class="back-btn" @click="$router.push('/worker/dashboard')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>Scan History</h1>
      <div class="total-badge">{{ logs.length }} scans</div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading history…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="groupedLogs.length === 0" class="empty-state">
      <i class="fas fa-history"></i>
      <p>No scan history yet</p>
    </div>

    <!-- Grouped logs -->
    <div v-else class="log-groups">
      <div v-for="group in groupedLogs" :key="group.date" class="log-group">
        <div class="group-header">
          <span class="group-date">{{ group.label }}</span>
          <span class="group-count">{{ group.items.length }} scans</span>
        </div>

        <div class="log-list">
          <div v-for="log in group.items" :key="log.id" class="log-row">
            <div class="log-icon" :class="log.result">
              <i :class="log.result === 'valid' ? 'fas fa-check' : 'fas fa-times'"></i>
            </div>
            <div class="log-info">
              <span class="log-booking">Booking #{{ log.bookingId }}</span>
              <span class="log-reason" v-if="log.reason">{{ log.reason }}</span>
            </div>
            <div class="log-meta">
              <span class="result-badge" :class="log.result">{{ resultLabel(log.result) }}</span>
              <span class="log-time">{{ formatTime(log.scannedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <router-link to="/worker/dashboard" class="nav-item">
        <i class="fas fa-th-large"></i>
        <span>Dashboard</span>
      </router-link>
      <router-link to="/worker/history" class="nav-item active">
        <i class="fas fa-history"></i>
        <span>History</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { scanLogService } from '../../services/workerService.js'

const router = useRouter()

const worker = ref({})
const logs = ref([])
const loading = ref(true)

const RESULT_LABELS = {
  valid: 'Valid',
  unpaid: 'Unpaid',
  invalid: 'Invalid',
  already_scanned: 'Duplicate',
  wrong_trip: 'Wrong Trip',
  expired: 'Expired',
}

function resultLabel(result) {
  return RESULT_LABELS[result] || result
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

const groupedLogs = computed(() => {
  const groups = {}
  for (const log of logs.value) {
    const date = log.scannedAt ? log.scannedAt.split('T')[0] : 'unknown'
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: formatDate(date),
      items: items.sort((a, b) => (b.scannedAt || '').localeCompare(a.scannedAt || '')),
    }))
})

onMounted(async () => {
  const raw = localStorage.getItem('workerSession')
  if (!raw) { router.replace('/worker/login'); return }
  worker.value = JSON.parse(raw)

  try {
    logs.value = await scanLogService.getAll({ workerId: worker.value.id, _sort: 'scannedAt', _order: 'desc' })
  } catch {
    logs.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.worker-history {
  min-height: 100dvh;
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.85);
  padding-bottom: 80px;
}

/* Header */
.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  position: sticky;
  top: 0;
  background: #0a0a0a;
  z-index: 50;
}

.back-btn {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: #141414;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.history-header h1 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.total-badge {
  padding: 6px 12px;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 15px;
}

.loading-state i,
.empty-state i {
  font-size: 32px;
}

/* Groups */
.log-groups {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.group-date {
  font-size: 15px;
  font-weight: 600;
}

.group-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}

.log-list {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
}

.log-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.log-row:last-child {
  border-bottom: none;
}

.log-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.log-icon.valid {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.log-icon.unpaid,
.log-icon.invalid,
.log-icon.already_scanned,
.log-icon.wrong_trip,
.log-icon.expired {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.log-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-booking {
  font-size: 15px;
  font-weight: 500;
}

.log-reason {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.result-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-badge.valid {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.result-badge.unpaid,
.result-badge.invalid,
.result-badge.already_scanned,
.result-badge.wrong_trip,
.result-badge.expired {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.log-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  font-variant-numeric: tabular-nums;
}

/* Bottom nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #141414;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
}

.nav-item i {
  font-size: 20px;
}

.nav-item.active,
.nav-item.router-link-exact-active {
  color: #22c55e;
}
</style>
