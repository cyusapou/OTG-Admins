<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Trips"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading today's trips...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="loadTrips">
        <i class="fas fa-redo"></i> Try Again
      </button>
    </div>

    <div v-else-if="!trips.length" class="empty-state">
      <i class="fas fa-route"></i>
      <p class="empty-title">No trips scheduled for today</p>
      <p class="empty-sub">Trips for this depot will appear here</p>
    </div>

    <div v-else class="trips-grid">
      <div
        v-for="trip in trips"
        :key="trip.id"
        class="trip-card"
        :class="{ 'has-unassigned': !trip.driverId || !trip.workerId }"
      >
        <div class="trip-header">
          <span class="trip-route">{{ trip.routeName }}</span>
          <StatusBadge :status="trip.status" />
        </div>

        <div class="trip-body">
          <div class="trip-row">
            <i class="fas fa-clock"></i>
            <span>{{ trip.departureTime }}</span>
          </div>
          <div class="trip-row">
            <i class="fas fa-id-card"></i>
            <span :class="{ 'unassigned': !trip.driverName }">{{ trip.driverName || 'UNASSIGNED' }}</span>
          </div>
          <div class="trip-row">
            <i class="fas fa-hard-hat"></i>
            <span :class="{ 'unassigned': !trip.workerName }">{{ trip.workerName || 'UNASSIGNED' }}</span>
          </div>
          <div class="trip-row">
            <i class="fas fa-bus"></i>
            <span>{{ trip.busPlate || '—' }}</span>
          </div>
          <div class="trip-row">
            <i class="fas fa-users"></i>
            <span>{{ trip.passengers }} passengers</span>
          </div>
        </div>

        <button
          v-if="!trip.driverId || !trip.workerId"
          class="btn-assign"
          @click="openAssignModal(trip)"
        >
          <i class="fas fa-user-plus"></i> Assign
        </button>
      </div>
    </div>

    <teleport to="body">
      <div v-if="assignModal" class="modal-backdrop" @click.self="assignModal = null">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Assign Staff</h3>
            <button class="modal-close" @click="assignModal = null"><i class="fas fa-times"></i></button>
          </div>
          <p class="modal-sub">{{ assignModal.routeName }} — {{ assignModal.departureTime }}</p>

          <div class="modal-field" v-if="!assignModal.driverId">
            <label>Driver</label>
            <select v-model="assignForm.driverId">
              <option value="">Select driver...</option>
              <option v-for="d in availableDrivers" :key="d.id" :value="d.id">
                {{ d.firstName }} {{ d.lastName }}
              </option>
            </select>
          </div>

          <div class="modal-field" v-if="!assignModal.workerId">
            <label>Worker</label>
            <select v-model="assignForm.workerId">
              <option value="">Select worker...</option>
              <option v-for="w in availableWorkers" :key="w.id" :value="w.id">
                {{ w.firstName }} {{ w.lastName }}
              </option>
            </select>
          </div>

          <p v-if="assignError" class="assign-error">{{ assignError }}</p>

          <button class="btn-primary" :disabled="assigning" @click="submitAssignment">
            <i v-if="assigning" class="fas fa-spinner fa-spin"></i>
            <span v-else>Save Assignment</span>
          </button>
        </div>
      </div>
    </teleport>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { userService } from '../../services/userService.js'
import { scheduleService } from '../../services/scheduleService.js'
import { routeService } from '../../services/routeService.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { notificationService } from '../../services/notificationService.js'

const auth = useAuth()

const navItems = [
  { path: '/manager', icon: 'fas fa-chart-pie', label: 'Dashboard', exact: true },
  { path: '/manager/drivers', icon: 'fas fa-id-card', label: 'Drivers' },
  { path: '/manager/workers', icon: 'fas fa-hard-hat', label: 'Workers' },
  { path: '/manager/trips', icon: 'fas fa-route', label: 'Trips' },
  { path: '/manager/buses', icon: 'fas fa-bus', label: 'Buses' },
  { path: '/manager/expenses', icon: 'fas fa-receipt', label: 'Expenses' },
  { path: '/manager/salaries', icon: 'fas fa-money-bill-wave', label: 'Salaries' },
  { path: '/manager/incidents', icon: 'fas fa-exclamation-triangle', label: 'Incidents' },
]

const loading = ref(true)
const error = ref('')
const trips = ref([])
const unreadCount = ref(0)
const availableDrivers = ref([])
const availableWorkers = ref([])

const assignModal = ref(null)
const assignForm = ref({ driverId: '', workerId: '' })
const assigning = ref(false)
const assignError = ref('')

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

function today() {
  return new Date().toISOString().split('T')[0]
}

async function loadTrips() {
  loading.value = true
  error.value = ''
  try {
    const depotId = auth.depotId.value
    const companyId = auth.companyId.value

    const [schedules, routes, drivers, workers, fares, notifications] = await Promise.all([
      scheduleService.getByCompany(companyId),
      routeService.getByCompany(companyId),
      userService.getAll({ role: 'driver', depotId }),
      userService.getAll({ role: 'worker', depotId }),
      fareCollectionService.getByDepot(depotId, { tripDate: today() }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length
    availableDrivers.value = drivers
    availableWorkers.value = workers

    const routeMap = {}
    routes.forEach(r => { routeMap[r.id] = r })

    const driverMap = {}
    drivers.forEach(d => { driverMap[d.id] = d })

    const workerMap = {}
    workers.forEach(w => { workerMap[w.id] = w })

    const depotSchedules = schedules.filter(s => {
      if (s.depotId && s.depotId !== depotId) return false
      return true
    })

    trips.value = depotSchedules.map(s => {
      const route = routeMap[s.routeId]
      const driver = s.driverId ? driverMap[s.driverId] : null
      const worker = s.workerId ? workerMap[s.workerId] : null
      const tripFares = fares.filter(f => f.scheduleId === s.id)
      const pCount = tripFares.reduce((sum, f) => sum + (f.passengerCount || 1), 0)

      return {
        id: s.id,
        routeName: route?.name || 'Unknown Route',
        departureTime: s.departureTime || '—',
        driverId: s.driverId || null,
        driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
        workerId: s.workerId || null,
        workerName: worker ? `${worker.firstName} ${worker.lastName}` : null,
        busPlate: s.busPlate || null,
        status: s.status || 'scheduled',
        passengers: pCount,
      }
    })
  } catch {
    error.value = 'Failed to load trips. Please try again.'
  } finally {
    loading.value = false
  }
}

function openAssignModal(trip) {
  assignModal.value = trip
  assignForm.value = { driverId: '', workerId: '' }
  assignError.value = ''
}

async function submitAssignment() {
  assignError.value = ''
  const patch = {}
  if (!assignModal.value.driverId && assignForm.value.driverId) {
    patch.driverId = assignForm.value.driverId
    const d = availableDrivers.value.find(x => x.id === assignForm.value.driverId)
    if (d) patch.driverName = `${d.firstName} ${d.lastName}`
  }
  if (!assignModal.value.workerId && assignForm.value.workerId) {
    patch.workerId = assignForm.value.workerId
    const w = availableWorkers.value.find(x => x.id === assignForm.value.workerId)
    if (w) patch.workerName = `${w.firstName} ${w.lastName}`
  }

  if (!Object.keys(patch).length) {
    assignError.value = 'Please select at least one staff member'
    return
  }

  assigning.value = true
  try {
    await scheduleService.patch(assignModal.value.id, patch)
    assignModal.value = null
    await loadTrips()
  } catch {
    assignError.value = 'Assignment failed. Try again.'
  } finally {
    assigning.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadTrips)
</script>

<style scoped>
.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.trip-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 18px;
  transition: border-color 0.15s;
  display: flex;
  flex-direction: column;
}
.trip-card:hover { border-color: rgba(34,197,94,0.25); }
.trip-card.has-unassigned { border-color: rgba(239,68,68,0.2); }

.trip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.trip-route { font-weight: 600; font-size: 15px; color: rgba(255,255,255,0.9); }

.trip-body { display: flex; flex-direction: column; gap: 7px; flex: 1; }
.trip-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255,255,255,0.55);
}
.trip-row i { width: 16px; text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; }
.unassigned { color: #ef4444; font-weight: 600; }

.btn-assign {
  margin-top: 14px;
  padding: 9px 16px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 8px;
  color: #22c55e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.btn-assign:hover { background: rgba(34,197,94,0.18); }

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 64px 20px;
  color: rgba(255,255,255,0.35);
}
.loading-state i, .error-state i, .empty-state i {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}
.loading-state i { color: #22c55e; }
.error-state i { color: #ef4444; }
.empty-state i { color: #22c55e; }
.empty-title { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.6); margin: 0 0 4px; }
.empty-sub { font-size: 13px; margin: 0; }

.btn-retry {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: #22c55e;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}
.modal-card {
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 440px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); }
.modal-close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.35);
  font-size: 18px;
  cursor: pointer;
}
.modal-close:hover { color: rgba(255,255,255,0.7); }
.modal-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0 0 20px; }

.modal-field { margin-bottom: 16px; }
.modal-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
}
.modal-field select {
  width: 100%;
  padding: 12px 14px;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
  cursor: pointer;
}
.modal-field select:focus { border-color: #22c55e; }
.modal-field select option { background: #141414; color: rgba(255,255,255,0.85); }

.assign-error { color: #ef4444; font-size: 13px; margin-bottom: 12px; }

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  min-height: 46px;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #16a34a; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

@media (max-width: 640px) {
  .trips-grid { grid-template-columns: 1fr; }
}
</style>
