<template>
  <div class="worker-manifest">
    <!-- Header -->
    <header class="manifest-header">
      <button class="back-btn" @click="$router.push('/worker/dashboard')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="header-center">
        <h1>Passenger Manifest</h1>
        <p class="route-sub">{{ routeName }}</p>
      </div>
      <div class="boarded-badge">
        {{ boardedCount }} / {{ bookings.length }}
      </div>
    </header>

    <!-- Search -->
    <div class="search-bar">
      <i class="fas fa-search"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or seat…"
        inputmode="search"
      />
      <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading manifest…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredBookings.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <p v-if="searchQuery">No results for "{{ searchQuery }}"</p>
      <p v-else>No bookings found for this trip</p>
    </div>

    <!-- Passenger list -->
    <div v-else class="passenger-list">
      <div
        v-for="b in filteredBookings"
        :key="b.id"
        class="passenger-row"
        :class="{ boarded: b.qrScanned }"
      >
        <div class="seat-num">{{ b.seatNumber || '—' }}</div>
        <div class="pax-info">
          <span class="pax-name">{{ b.passengerName || 'Unknown' }}</span>
          <span class="pax-meta">{{ b.phone || '' }}</span>
        </div>
        <div class="pax-status">
          <span v-if="b.qrScanned" class="status-chip boarded">
            <i class="fas fa-check"></i> Boarded
          </span>
          <button v-else class="mark-btn" @click="promptManualBoard(b)">
            <i class="fas fa-hourglass-half"></i> Mark
          </button>
        </div>
      </div>
    </div>

    <!-- PIN confirmation modal -->
    <div v-if="showPinModal" class="modal-overlay" @click.self="closePinModal">
      <div class="modal-content">
        <h3>Confirm Manual Boarding</h3>
        <p class="modal-desc">
          Mark <strong>{{ pendingBooking?.passengerName }}</strong> (Seat {{ pendingBooking?.seatNumber }}) as boarded?
        </p>
        <div class="input-wrapper">
          <i class="fas fa-lock"></i>
          <input
            v-model="confirmPin"
            type="password"
            placeholder="Enter your 4-digit PIN"
            inputmode="numeric"
            maxlength="4"
            @keyup.enter="confirmManualBoard"
          />
        </div>
        <div v-if="pinError" class="pin-error">
          <i class="fas fa-exclamation-circle"></i> {{ pinError }}
        </div>
        <div class="modal-actions">
          <button class="modal-cancel" @click="closePinModal">Cancel</button>
          <button class="modal-confirm" @click="confirmManualBoard" :disabled="confirmPin.length !== 4">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookingService } from '../../services/bookingService.js'
import { scheduleService } from '../../services/scheduleService.js'
import { routeService } from '../../services/routeService.js'
import { scanLogService } from '../../services/workerService.js'

const route = useRoute()
const router = useRouter()

const scheduleId = route.params.scheduleId
const worker = ref({})
const bookings = ref([])
const routeName = ref('')
const loading = ref(true)
const searchQuery = ref('')

const showPinModal = ref(false)
const pendingBooking = ref(null)
const confirmPin = ref('')
const pinError = ref('')

const boardedCount = computed(() => bookings.value.filter(b => b.qrScanned).length)

const filteredBookings = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return bookings.value
  return bookings.value.filter(b =>
    (b.passengerName || '').toLowerCase().includes(q) ||
    String(b.seatNumber || '').includes(q)
  )
})

function promptManualBoard(booking) {
  pendingBooking.value = booking
  confirmPin.value = ''
  pinError.value = ''
  showPinModal.value = true
}

function closePinModal() {
  showPinModal.value = false
  pendingBooking.value = null
  confirmPin.value = ''
  pinError.value = ''
}

async function confirmManualBoard() {
  if (confirmPin.value !== worker.value.pin) {
    pinError.value = 'Incorrect PIN'
    return
  }

  const b = pendingBooking.value
  try {
    await bookingService.patch(b.id, {
      qrScanned: true,
      scannedAt: new Date().toISOString(),
      scannedByWorkerId: worker.value.id,
      manualBoard: true,
    })

    await scanLogService.create({
      workerId: worker.value.id,
      bookingId: b.id,
      scheduleId,
      scannedAt: new Date().toISOString(),
      result: 'valid',
      reason: 'Manual boarding',
    })

    const idx = bookings.value.findIndex(x => x.id === b.id)
    if (idx !== -1) bookings.value[idx].qrScanned = true
  } catch {
    pinError.value = 'Failed to update — try again'
    return
  }

  closePinModal()
}

onMounted(async () => {
  const raw = localStorage.getItem('workerSession')
  if (!raw) { router.replace('/worker/login'); return }
  worker.value = JSON.parse(raw)

  try {
    const schedule = await scheduleService.getDetailed(scheduleId)
    const routeData = await routeService.getById(schedule.routeId)
    routeName.value = `${routeData.origin} → ${routeData.destination}`

    const today = new Date().toISOString().split('T')[0]
    bookings.value = await bookingService.getByScheduleAndDate(scheduleId, today)
  } catch {
    routeName.value = 'Unknown Route'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.worker-manifest {
  min-height: 100dvh;
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.85);
}

/* Header */
.manifest-header {
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

.header-center {
  flex: 1;
  min-width: 0;
}

.header-center h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.route-sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.boarded-badge {
  padding: 8px 14px;
  background: rgba(34, 197, 94, 0.12);
  border-radius: 20px;
  color: #22c55e;
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* Search */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 16px;
  padding: 0 16px;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
}

.search-bar:focus-within {
  border-color: #22c55e;
}

.search-bar i {
  color: rgba(255, 255, 255, 0.25);
  font-size: 15px;
}

.search-bar input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  padding: 14px 0;
  font-family: inherit;
}

.search-bar input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.clear-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 24px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 15px;
}

.loading-state i,
.empty-state i {
  font-size: 32px;
}

/* Passenger list */
.passenger-list {
  padding: 0 16px 24px;
}

.passenger-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.seat-num {
  width: 44px;
  height: 44px;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.passenger-row.boarded .seat-num {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.pax-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pax-name {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pax-meta {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 2px;
}

.pax-status {
  flex-shrink: 0;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-chip.boarded {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.mark-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  cursor: pointer;
  min-height: 40px;
  font-family: inherit;
}

.mark-btn:active {
  background: rgba(255, 255, 255, 0.04);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  background: #141414;
  border-radius: 20px 20px 0 0;
  padding: 24px 16px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

.modal-content h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.modal-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}

.modal-desc strong {
  color: rgba(255, 255, 255, 0.85);
}

.modal-content .input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 0 16px;
}

.modal-content .input-wrapper:focus-within {
  border-color: #22c55e;
}

.modal-content .input-wrapper i {
  color: rgba(255, 255, 255, 0.25);
  font-size: 16px;
}

.modal-content .input-wrapper input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 17px;
  padding: 16px 0;
  font-family: inherit;
}

.modal-content .input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.pin-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 13px;
  color: #ef4444;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.modal-cancel {
  flex: 1;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  cursor: pointer;
  min-height: 52px;
  font-family: inherit;
}

.modal-confirm {
  flex: 1;
  padding: 14px;
  background: #22c55e;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  min-height: 52px;
  font-family: inherit;
}

.modal-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
