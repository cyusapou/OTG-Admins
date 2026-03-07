<template>
  <div class="worker-dash">
    <!-- Offline banner -->
    <div v-if="isOffline" class="offline-bar">
      <i class="fas fa-wifi"></i> You are offline — scans will queue locally
    </div>

    <!-- Header -->
    <header class="dash-header">
      <div class="header-left">
        <div class="avatar">{{ initials }}</div>
        <div>
          <h1 class="worker-name">{{ worker.firstName }} {{ worker.lastName }}</h1>
          <p class="company-label">{{ worker.companyName || 'On The Go' }}</p>
        </div>
      </div>
      <div class="header-right">
        <span class="live-clock">{{ clock }}</span>
        <button class="icon-btn" @click="logout" title="Log out">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loadingSchedules" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading schedules…</span>
    </div>

    <!-- No schedules -->
    <div v-else-if="schedules.length === 0" class="empty-state">
      <i class="fas fa-calendar-times"></i>
      <p>No trips assigned for today</p>
    </div>

    <!-- Schedule cards -->
    <div v-else class="schedule-list">
      <div v-for="s in schedules" :key="s.id" class="schedule-card">
        <div class="card-top">
          <div class="route-badge">
            <i class="fas fa-route"></i>
          </div>
          <div class="route-info">
            <h2>{{ s.routeName }}</h2>
            <p class="plate">
              <i class="fas fa-bus"></i> {{ s.busPlate }}
            </p>
          </div>
          <div class="departure-time">
            <span class="time-value">{{ s.departureFormatted }}</span>
            <span class="time-label">Departure</span>
          </div>
        </div>

        <div class="boarding-strip">
          <div class="boarded-info">
            <i class="fas fa-users"></i>
            <span>{{ s.boardedCount }} / {{ s.totalSeats }} boarded</span>
          </div>
          <div class="board-bar">
            <div class="board-fill" :style="{ width: boardPercent(s) + '%' }"></div>
          </div>
        </div>

        <div class="card-actions">
          <button class="scan-btn" @click="goScan(s.id)">
            <i class="fas fa-qrcode"></i>
            Start Scanning
          </button>
          <router-link :to="`/worker/manifest/${s.id}`" class="manifest-link">
            <i class="fas fa-clipboard-list"></i> View Manifest
          </router-link>
        </div>
      </div>
    </div>

    <!-- Always-visible quick scan button -->
    <div class="quick-scan-section">
      <button class="quick-scan-btn" @click="goScan('general')">
        <div class="scan-icon-ring">
          <i class="fas fa-qrcode"></i>
        </div>
        <div class="scan-text">
          <span class="scan-title">Scan QR Code</span>
          <span class="scan-sub">Tap to open camera scanner</span>
        </div>
        <i class="fas fa-chevron-right scan-arrow"></i>
      </button>
    </div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <router-link to="/worker/dashboard" class="nav-item active">
        <i class="fas fa-th-large"></i>
        <span>Dashboard</span>
      </router-link>
      <router-link to="/worker/history" class="nav-item">
        <i class="fas fa-history"></i>
        <span>History</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { scheduleService } from '../../services/scheduleService.js'
import { routeService } from '../../services/routeService.js'
import { busService } from '../../services/busService.js'
import { bookingService } from '../../services/bookingService.js'
import { useOffline } from '../../composables/useOffline.js'

const router = useRouter()
const { isOffline } = useOffline()

const worker = ref({})
const schedules = ref([])
const loadingSchedules = ref(true)
const clock = ref('')
let clockTimer = null

const initials = computed(() => {
  const f = worker.value.firstName?.[0] || ''
  const l = worker.value.lastName?.[0] || ''
  return (f + l).toUpperCase()
})

function updateClock() {
  clock.value = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function boardPercent(s) {
  if (!s.totalSeats) return 0
  return Math.min(100, Math.round((s.boardedCount / s.totalSeats) * 100))
}

function goScan(scheduleId) {
  router.push(`/worker/scan/${scheduleId}`)
}

function logout() {
  localStorage.removeItem('workerSession')
  router.push('/worker/login')
}

function formatTime(timeStr) {
  if (!timeStr) return '--:--'
  if (timeStr.includes('T')) {
    return new Date(timeStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  return timeStr
}

async function loadSchedules() {
  loadingSchedules.value = true
  try {
    const assignedIds = worker.value.assignedScheduleIds || []
    const today = new Date().toISOString().split('T')[0]
    const loaded = []

    for (const id of assignedIds) {
      try {
        const schedule = await scheduleService.getDetailed(id)
        const [route, bus, bookings] = await Promise.all([
          routeService.getById(schedule.routeId),
          busService.getById(schedule.busId),
          bookingService.getByScheduleAndDate(id, today),
        ])
        loaded.push({
          id: schedule.id,
          routeName: `${route.origin} → ${route.destination}`,
          busPlate: bus.plateNumber || bus.plate || 'N/A',
          departureFormatted: formatTime(schedule.departureTime),
          boardedCount: bookings.filter(b => b.qrScanned).length,
          totalSeats: bus.capacity || bookings.length || 50,
        })
      } catch { /* skip failed schedule */ }
    }
    schedules.value = loaded
  } catch {
    schedules.value = []
  } finally {
    loadingSchedules.value = false
  }
}

onMounted(() => {
  const raw = localStorage.getItem('workerSession')
  if (!raw) {
    router.replace('/worker/login')
    return
  }
  worker.value = JSON.parse(raw)
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  loadSchedules()
})

onUnmounted(() => {
  clearInterval(clockTimer)
})
</script>

<style scoped>
.worker-dash {
  min-height: 100dvh;
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.85);
  padding-bottom: 80px;
}

/* Offline bar */
.offline-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
  font-size: 13px;
  font-weight: 500;
}

/* Header */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
}

.worker-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.company-label {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.live-clock {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.4);
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: #141414;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
}

.icon-btn:active {
  background: rgba(255, 255, 255, 0.05);
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

/* Schedule list */
.schedule-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.schedule-card {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  overflow: hidden;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.route-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  font-size: 18px;
  flex-shrink: 0;
}

.route-info {
  flex: 1;
  min-width: 0;
}

.route-info h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plate {
  margin: 3px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 6px;
}

.departure-time {
  text-align: right;
  flex-shrink: 0;
}

.time-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #22c55e;
}

.time-label {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 1px;
}

/* Boarding strip */
.boarding-strip {
  padding: 0 16px 14px;
}

.boarded-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.board-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.board-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 3px;
  transition: width 0.4s ease;
}

/* Actions */
.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px 16px;
}

.scan-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  min-height: 52px;
  font-family: inherit;
}

.scan-btn:active {
  background: #1da34d;
}

.manifest-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
  min-height: 52px;
}

.manifest-link:active {
  background: rgba(255, 255, 255, 0.04);
}

/* Quick scan section — always visible */
.quick-scan-section {
  padding: 20px 16px;
}

.quick-scan-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  background: #141414;
  border: 2px solid rgba(34, 197, 94, 0.25);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  text-align: left;
}

.quick-scan-btn:hover {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.04);
  box-shadow: 0 0 24px rgba(34, 197, 94, 0.08);
}

.quick-scan-btn:active {
  transform: scale(0.98);
}

.scan-icon-ring {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
}

.scan-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scan-title {
  font-size: 17px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.scan-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
}

.scan-arrow {
  color: rgba(255, 255, 255, 0.2);
  font-size: 14px;
  flex-shrink: 0;
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
