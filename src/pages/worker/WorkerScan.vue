<template>
  <div class="worker-scan">
    <!-- Offline banner -->
    <div v-if="isOffline" class="offline-bar">
      <i class="fas fa-wifi"></i> Offline — scans will queue
    </div>

    <!-- Top bar -->
    <header class="scan-header">
      <button class="back-btn" @click="goBack">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="header-info">
        <h1>{{ routeName }}</h1>
      </div>
      <div class="boarded-badge">
        <i class="fas fa-users"></i>
        {{ boardedCount }} / {{ totalSeats }}
      </div>
    </header>

    <!-- Camera area -->
    <div class="camera-area">
      <QrcodeStream
        v-if="!paused"
        :torch="torchActive"
        @detect="onDetect"
        @error="onCameraError"
        class="qr-stream"
      />
      <div v-else class="paused-overlay">
        <i class="fas fa-pause-circle"></i>
        <p>Scanning Paused</p>
      </div>

      <!-- Corner brackets -->
      <div class="scan-frame" :class="{ 'frame-valid': scanStatus === 'valid', 'frame-invalid': scanStatus === 'invalid' }">
        <span class="corner tl"></span>
        <span class="corner tr"></span>
        <span class="corner bl"></span>
        <span class="corner br"></span>
        <div v-if="scanStatus === 'idle'" class="scan-line"></div>
      </div>

      <!-- Torch -->
      <button class="torch-btn" @click="torchActive = !torchActive" :class="{ active: torchActive }">
        <i class="fas fa-bolt"></i>
      </button>
    </div>

    <!-- Result panel -->
    <div class="result-panel" :class="{ open: scanStatus !== 'idle' }">
      <!-- Valid -->
      <div v-if="scanStatus === 'valid'" class="result-content valid">
        <div class="result-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="result-details">
          <span class="result-label">BOARDED</span>
          <h2>{{ lastResult?.passengerName }}</h2>
          <p>Seat {{ lastResult?.seatNumber }}</p>
        </div>
      </div>

      <!-- Invalid -->
      <div v-if="scanStatus === 'invalid'" class="result-content invalid">
        <div class="result-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="result-details">
          <span class="result-label">DENIED</span>
          <p class="reason">{{ lastResult?.reason }}</p>
        </div>
        <button class="dismiss-btn" @click="reset">Dismiss</button>
      </div>
    </div>

    <!-- Bottom controls -->
    <div class="bottom-controls">
      <button class="control-btn manual" @click="showManualLookup = true">
        <i class="fas fa-keyboard"></i>
        Manual Lookup
      </button>
      <button class="control-btn pause" :class="{ active: paused }" @click="togglePause">
        <i :class="paused ? 'fas fa-play' : 'fas fa-pause'"></i>
        {{ paused ? 'Resume' : 'Pause' }}
      </button>
    </div>

    <!-- Manual lookup modal -->
    <div v-if="showManualLookup" class="modal-overlay" @click.self="showManualLookup = false">
      <div class="modal-content">
        <h3>Manual Ticket Lookup</h3>
        <div class="input-wrapper">
          <i class="fas fa-ticket-alt"></i>
          <input
            v-model="manualBookingId"
            placeholder="Enter booking ID"
            inputmode="text"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-cancel" @click="showManualLookup = false">Cancel</button>
          <button class="modal-confirm" @click="manualLookupSubmit" :disabled="!manualBookingId.trim()">
            Look Up
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QrcodeStream } from 'vue-qrcode-reader'
import { scheduleService } from '../../services/scheduleService.js'
import { routeService } from '../../services/routeService.js'
import { busService } from '../../services/busService.js'
import { bookingService } from '../../services/bookingService.js'
import { useScanner } from '../../composables/useScanner.js'
import { useOffline } from '../../composables/useOffline.js'

const route = useRoute()
const router = useRouter()
const { isOffline } = useOffline()

const scheduleId = route.params.scheduleId
const worker = ref({})
const routeName = ref('Loading…')
const totalSeats = ref(0)
const paused = ref(false)
const torchActive = ref(false)
const showManualLookup = ref(false)
const manualBookingId = ref('')

const { lastResult, scanStatus, boardedCount, handleScan, reset } = useScanner(scheduleId, worker)

let autoDismissTimer = null

watch(scanStatus, (status) => {
  clearTimeout(autoDismissTimer)
  if (status === 'valid') {
    autoDismissTimer = setTimeout(() => reset(), 2000)
  }
})

function onDetect(detectedCodes) {
  if (paused.value || scanStatus.value !== 'idle') return
  const raw = detectedCodes?.[0]?.rawValue
  if (raw) handleScan(raw)
}

function onCameraError(err) {
  console.error('Camera error:', err)
}

function togglePause() {
  paused.value = !paused.value
  if (!paused.value) reset()
}

async function manualLookupSubmit() {
  if (!manualBookingId.value.trim()) return
  const payload = JSON.stringify({ bookingId: manualBookingId.value.trim() })
  showManualLookup.value = false
  await handleScan(payload)
  manualBookingId.value = ''
}

function goBack() {
  router.push('/worker/dashboard')
}

onMounted(async () => {
  const raw = localStorage.getItem('workerSession')
  if (!raw) { router.replace('/worker/login'); return }
  worker.value = JSON.parse(raw)

  if (scheduleId === 'general') {
    routeName.value = 'Quick Scan'
    totalSeats.value = 0
  } else {
    try {
      const schedule = await scheduleService.getDetailed(scheduleId)
      const [routeData, bus, bookings] = await Promise.all([
        routeService.getById(schedule.routeId),
        busService.getById(schedule.busId),
        bookingService.getByScheduleAndDate(scheduleId, new Date().toISOString().split('T')[0]),
      ])
      routeName.value = `${routeData.origin} → ${routeData.destination}`
      totalSeats.value = bus.capacity || bookings.length || 50
      boardedCount.value = bookings.filter(b => b.qrScanned).length
    } catch {
      routeName.value = 'Unknown Route'
    }
  }
})
</script>

<style scoped>
.worker-scan {
  min-height: 100dvh;
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
}

.offline-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
  font-size: 12px;
  font-weight: 500;
}

/* Header */
.scan-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
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

.header-info {
  flex: 1;
  min-width: 0;
}

.header-info h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.boarded-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(34, 197, 94, 0.12);
  border-radius: 20px;
  color: #22c55e;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* Camera */
.camera-area {
  position: relative;
  flex: 1;
  min-height: 0;
  max-height: 60vh;
  background: #000;
  overflow: hidden;
}

.qr-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.paused-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
  z-index: 5;
}

.paused-overlay i {
  font-size: 48px;
}

/* Scan frame with corner brackets */
.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 240px;
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border-color: #22c55e;
  border-style: solid;
  border-width: 0;
  transition: border-color 0.3s;
}

.scan-frame.frame-valid .corner { border-color: #22c55e; }
.scan-frame.frame-invalid .corner { border-color: #ef4444; }

.corner.tl { top: 0; left: 0; border-top-width: 4px; border-left-width: 4px; border-top-left-radius: 8px; }
.corner.tr { top: 0; right: 0; border-top-width: 4px; border-right-width: 4px; border-top-right-radius: 8px; }
.corner.bl { bottom: 0; left: 0; border-bottom-width: 4px; border-left-width: 4px; border-bottom-left-radius: 8px; }
.corner.br { bottom: 0; right: 0; border-bottom-width: 4px; border-right-width: 4px; border-bottom-right-radius: 8px; }

.scan-line {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  background: #22c55e;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
  animation: scanMove 2.5s ease-in-out infinite;
}

@keyframes scanMove {
  0%, 100% { top: 8px; }
  50% { top: calc(100% - 10px); }
}

/* Torch button */
.torch-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.torch-btn.active {
  background: #22c55e;
  color: #fff;
}

/* Result panel */
.result-panel {
  flex-shrink: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, padding 0.35s ease;
  background: #141414;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.result-panel.open {
  max-height: 280px;
  padding: 20px 16px;
}

.result-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.result-icon {
  font-size: 40px;
  flex-shrink: 0;
  line-height: 1;
}

.result-content.valid .result-icon { color: #22c55e; }
.result-content.invalid .result-icon { color: #ef4444; }

.result-details {
  flex: 1;
}

.result-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.result-content.valid .result-label {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.result-content.invalid .result-label {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.result-details h2 {
  margin: 4px 0 2px;
  font-size: 22px;
  font-weight: 700;
}

.result-details p {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
}

.result-details .reason {
  color: rgba(255, 255, 255, 0.7);
  font-size: 15px;
  margin-top: 4px;
}

.dismiss-btn {
  align-self: center;
  padding: 12px 20px;
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  min-height: 48px;
  font-family: inherit;
}

/* Bottom controls */
.bottom-controls {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: #0a0a0a;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: #141414;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  min-height: 52px;
  font-family: inherit;
}

.control-btn.pause.active {
  background: #22c55e;
  color: #fff;
  border-color: #22c55e;
}

.control-btn:active {
  background: rgba(255, 255, 255, 0.04);
}

/* Manual lookup modal */
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
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
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
