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

    <div v-else>
      <div class="trips-header">
        <button class="btn-new-trip" @click="openNewTripModal">
          <i class="fas fa-plus"></i> New Trip
        </button>
      </div>
      <div v-if="!trips.length" class="empty-state">
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

        <div class="trip-card-actions">
          <button
            v-if="!trip.driverId || !trip.workerId"
            class="btn-assign"
            @click="openAssignModal(trip)"
          >
            <i class="fas fa-user-plus"></i> Assign
          </button>
          <button
            type="button"
            class="btn-delete-trip-inline"
            :disabled="trip._deleting"
            @click.stop="handleDeleteTrip(trip)"
            title="Delete trip"
          >
            <i v-if="trip._deleting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      </div>
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
            <label>Driver (pair driver with assistant on the Teams page)</label>
            <select v-model="assignForm.selectedDriverKey">
              <option value="">Select driver...</option>
              <option v-for="d in availableDriversWithWorkers" :key="d.driverUserId" :value="d.driverUserId">
                {{ d.driverName }} — {{ d.workerName || 'No assistant' }}
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

      <div v-if="newTripModal" class="modal-backdrop" @click.self="newTripModal = false">
        <div class="modal-card modal-card-wide">
          <div class="modal-header">
            <h3>New Trip</h3>
            <button class="modal-close" @click="newTripModal = false"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-field">
            <label>Route</label>
            <select v-model="newTripForm.routeId" required>
              <option value="">Select route...</option>
              <option v-for="r in newTripRoutes" :key="r.id" :value="r.id">
                {{ r.origin }} → {{ r.destination }}
              </option>
            </select>
          </div>
          <div class="modal-field">
            <label>Bus</label>
            <select v-model="newTripForm.busId" required>
              <option value="">Select bus...</option>
              <option v-for="b in newTripBuses" :key="b.id" :value="b.id">
                {{ b.plateNumber || b.plate }} ({{ b.capacity || 45 }} seats)
              </option>
            </select>
          </div>
          <div class="modal-field">
            <label>Date</label>
            <input v-model="newTripForm.date" type="date" required />
          </div>
          <div class="modal-field">
            <label>Departure time</label>
            <input v-model="newTripForm.departureTime" type="time" required />
          </div>
          <div class="modal-field">
            <label>Total seats</label>
            <input v-model.number="newTripForm.totalSeats" type="number" min="1" required />
          </div>
          <div class="modal-field">
            <label>Assign driver (assistant auto-assigned)</label>
            <select v-model="newTripForm.selectedDriverKey">
              <option value="">Assign later</option>
              <option v-for="d in availableDriversWithWorkers" :key="d.driverUserId" :value="d.driverUserId">
                {{ d.driverName }} — {{ d.workerName || 'No assistant' }}
              </option>
            </select>
          </div>
          <p v-if="newTripError" class="assign-error">{{ newTripError }}</p>
          <button
            class="btn-primary"
            :disabled="creatingTrip || newTripRoutes.length === 0 || newTripBuses.length === 0"
            @click="submitNewTrip"
          >
            <i v-if="creatingTrip" class="fas fa-spinner fa-spin"></i>
            <span v-else>Create Trip</span>
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
import { busService } from '../../services/busService.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { notificationService } from '../../services/notificationService.js'
import { driverService } from '../../services/driverService.js'
import { workerService } from '../../services/workerService.js'
import { navItems } from './managerNav.js'

const auth = useAuth()

const loading = ref(true)
const error = ref('')
const trips = ref([])
const unreadCount = ref(0)
/** List of { driverUserId, driverName, driverDocId, workerUserId, workerName, workerDocId } for drivers (worker may be null) */
const availableDriversWithWorkers = ref([])
/** Workers with no driver linked, for "link as assistant" in Assign modal */

const assignModal = ref(null)
const assignForm = ref({ selectedDriverKey: '' })
const assigning = ref(false)
const assignError = ref('')

const newTripModal = ref(false)
const newTripForm = ref({
  routeId: '',
  busId: '',
  date: '',
  departureTime: '08:00',
  totalSeats: 45,
  selectedDriverKey: '',
})
const newTripRoutes = ref([])
const newTripBuses = ref([])
const creatingTrip = ref(false)
const newTripError = ref('')

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

    const [schedules, routes, driverUsers, driverDocs, workerDocs, fares, notifications] = await Promise.all([
      scheduleService.getByCompany(companyId),
      routeService.getAll({ companyId }),
      userService.getAll({ role: 'driver', companyId }),
      driverService.getAll({ companyId }),
      workerService.getAll({ companyId }),
      fareCollectionService.getByDepot(depotId, { tripDate: today() }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    const driverMapByUserId = {}
    driverDocs.forEach(d => { driverMapByUserId[d.userId] = d })
    const workerMapByDriverId = {}
    workerDocs.forEach(w => {
      const key = w.driverId != null ? String(w.driverId).trim() : ''
      if (key) workerMapByDriverId[key] = w
    })

    const activeDriverUserIds = new Set(driverUsers.filter(u => u.status !== 'inactive').map(u => u.id))

    // Normalize driver doc id so it matches Worker.driverId (string, trimmed)
    function driverDocId(d) {
      return (d?.id != null ? String(d.id) : (d?._id != null ? String(d._id) : '')).trim()
    }

    // Include all active drivers (with or without linked worker) so they can be assigned
    availableDriversWithWorkers.value = driverUsers
      .filter(u => activeDriverUserIds.has(u.id))
      .map(u => {
        const driverDoc = driverMapByUserId[u.id]
        if (!driverDoc) return null
        const driverIdKey = driverDocId(driverDoc)
        const workerDoc = driverIdKey ? (workerMapByDriverId[driverIdKey] || null) : null
        return {
          driverUserId: u.id,
          driverName: `${u.firstName} ${u.lastName}`,
          driverDocId: driverDoc.id,
          workerUserId: workerDoc ? workerDoc.userId : null,
          workerName: workerDoc ? (workerDoc.name || `${workerDoc.userId}`) : null,
          workerDocId: workerDoc ? workerDoc.id : null,
        }
      })
      .filter(Boolean)

    const driverMap = {}
    driverUsers.forEach(d => { driverMap[d.id] = d })
    const workerMap = {}
    await Promise.all(workerDocs.map(w => userService.getById(w.userId).then(u => { workerMap[u.id] = u }))).catch(() => {})

    const depotSchedules = schedules.filter(s => {
      if (s.depotId && s.depotId !== depotId) return false
      return true
    })

    const routeMap = {}
    routes.forEach(r => { routeMap[r.id] = r })

    trips.value = depotSchedules.map(s => {
      const route = routeMap[s.routeId]
      const driver = s.driverId ? driverMap[s.driverId] : null
      const worker = s.workerId ? workerMap[s.workerId] : null
      const tripFares = fares.filter(f => f.scheduleId === s.id)
      const pCount = tripFares.reduce((sum, f) => sum + (f.passengerCount || 1), 0)

      return {
        id: s.id,
        routeName: route ? `${route.origin || ''} → ${route.destination || ''}`.trim() || 'Unknown Route' : 'Unknown Route',
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

const selectedDriverForAssign = computed(() => {
  if (!assignModal.value || !assignForm.value.selectedDriverKey) return null
  return availableDriversWithWorkers.value.find(d => d.driverUserId === assignForm.value.selectedDriverKey) || null
})

/** Re-fetch drivers and workers so Assign dropdown shows up-to-date links (e.g. after linking on Teams). */
async function refreshAvailableDriversWithWorkers() {
  const companyId = auth.companyId.value
  const [driverUsers, driverDocs, workerDocs] = await Promise.all([
    userService.getAll({ role: 'driver', companyId }),
    driverService.getAll({ companyId }),
    workerService.getAll({ companyId }),
  ])
  const driverMapByUserId = {}
  driverDocs.forEach(d => { driverMapByUserId[d.userId] = d })
  const workerMapByDriverId = {}
  workerDocs.forEach(w => {
    const key = w.driverId != null ? String(w.driverId).trim() : ''
    if (key) workerMapByDriverId[key] = w
  })
  function driverDocId(d) {
    return (d?.id != null ? String(d.id) : (d?._id != null ? String(d._id) : '')).trim()
  }
  const activeDriverUserIds = new Set(driverUsers.filter(u => u.status !== 'inactive').map(u => u.id))
  availableDriversWithWorkers.value = driverUsers
    .filter(u => activeDriverUserIds.has(u.id))
    .map(u => {
      const driverDoc = driverMapByUserId[u.id]
      if (!driverDoc) return null
      const driverIdKey = driverDocId(driverDoc)
      const workerDoc = driverIdKey ? (workerMapByDriverId[driverIdKey] || null) : null
      return {
        driverUserId: u.id,
        driverName: `${u.firstName} ${u.lastName}`,
        driverDocId: driverDoc.id,
        workerUserId: workerDoc ? workerDoc.userId : null,
        workerName: workerDoc ? (workerDoc.name || `${workerDoc.userId}`) : null,
        workerDocId: workerDoc ? workerDoc.id : null,
      }
    })
    .filter(Boolean)
}

async function openAssignModal(trip) {
  assignModal.value = trip
  assignForm.value = { selectedDriverKey: '' }
  assignError.value = ''
  await refreshAvailableDriversWithWorkers()
}

async function handleDeleteTrip(trip) {
  if (!confirm(`Delete trip "${trip.routeName}" at ${trip.departureTime}? This cannot be undone.`)) return
  trip._deleting = true
  try {
    await scheduleService.remove(trip.id)
    await loadTrips()
  } catch {
    error.value = 'Failed to delete trip.'
  } finally {
    trip._deleting = false
  }
}

async function submitAssignment() {
  assignError.value = ''
  if (!assignModal.value.driverId && !assignForm.value.selectedDriverKey) {
    assignError.value = 'Please select a driver. Link driver and assistant on the Teams page if needed.'
    return
  }

  const selected = availableDriversWithWorkers.value.find(d => d.driverUserId === assignForm.value.selectedDriverKey)
  const patch = {}
  if (!assignModal.value.driverId && selected) {
    patch.driverId = selected.driverUserId
    patch.driverName = selected.driverName
    if (selected.workerDocId) {
      patch.workerId = selected.workerUserId || null
      patch.workerName = selected.workerName || null
    }
  }

  if (!Object.keys(patch).length) {
    assignError.value = 'Please select a driver.'
    return
  }

  assigning.value = true
  try {
    await scheduleService.patch(assignModal.value.id, patch)
    const driverDoc = await driverService.getById(selected.driverDocId)
    const driverSchedules = [...(driverDoc.assignedScheduleIds || []), assignModal.value.id]
    await driverService.patch(selected.driverDocId, { assignedScheduleIds: driverSchedules })
    if (patch.workerId && selected.workerDocId) {
      const workerDocId = selected.workerDocId
      const workerDoc = await workerService.getById(workerDocId)
      const workerSchedules = [...(workerDoc.assignedScheduleIds || []), assignModal.value.id]
      await workerService.patch(workerDocId, { assignedScheduleIds: workerSchedules })
    }
    assignModal.value = null
    await loadTrips()
  } catch (e) {
    assignError.value = e.message || 'Assignment failed. Try again.'
  } finally {
    assigning.value = false
  }
}

async function openNewTripModal() {
  newTripModal.value = true
  newTripForm.value = {
    routeId: '',
    busId: '',
    date: today(),
    departureTime: '08:00',
    totalSeats: 45,
    selectedDriverKey: '',
  }
  newTripError.value = ''
  try {
    const companyId = auth.companyId.value
    const depotId = auth.depotId.value
    const [routes, buses] = await Promise.all([
      routeService.getAll({ companyId }),
      depotId
        ? busService.getAll({ companyId, depotId })
        : busService.getAll({ companyId }),
    ])
    newTripRoutes.value = routes.filter(r => r.isActive !== false)
    newTripBuses.value = (buses || []).filter(b => b.isActive !== false)
    if (newTripRoutes.value.length === 0 || newTripBuses.value.length === 0) {
      newTripError.value = 'You need at least one route and one bus to create a trip. Please add them from the Routes and Buses pages first.'
    }
  } catch {
    newTripError.value = 'Failed to load routes and buses.'
  }
}

async function submitNewTrip() {
  newTripError.value = ''
  if (newTripRoutes.value.length === 0 || newTripBuses.value.length === 0) {
    newTripError.value = 'You need at least one route and one bus to create a trip. Please add them from the Routes and Buses pages first.'
    return
  }
  if (!newTripForm.value.routeId || !newTripForm.value.busId || !newTripForm.value.date || !newTripForm.value.departureTime) {
    newTripError.value = 'Please fill route, bus, date and departure time.'
    return
  }
  creatingTrip.value = true
  try {
    const companyId = auth.companyId.value
    const depotId = auth.depotId.value
    const bus = newTripBuses.value.find(b => b.id === newTripForm.value.busId)
    const schedule = await scheduleService.create({
      routeId: newTripForm.value.routeId,
      companyId,
      depotId,
      busId: newTripForm.value.busId,
      busPlate: bus?.plateNumber || bus?.plate || null,
      date: newTripForm.value.date,
      departureTime: newTripForm.value.departureTime,
      totalSeats: newTripForm.value.totalSeats || 45,
      status: 'scheduled',
      isActive: true,
    })
    const selected = availableDriversWithWorkers.value.find(d => d.driverUserId === newTripForm.value.selectedDriverKey)
    if (selected) {
      await scheduleService.patch(schedule.id, {
        driverId: selected.driverUserId,
        driverName: selected.driverName,
        workerId: selected.workerUserId || null,
        workerName: selected.workerName || null,
      })
      const driverDoc = await driverService.getById(selected.driverDocId)
      await driverService.patch(selected.driverDocId, { assignedScheduleIds: [...(driverDoc.assignedScheduleIds || []), schedule.id] })
      if (selected.workerDocId) {
        const workerDoc = await workerService.getById(selected.workerDocId)
        await workerService.patch(selected.workerDocId, { assignedScheduleIds: [...(workerDoc.assignedScheduleIds || []), schedule.id] })
      }
    }
    newTripModal.value = false
    await loadTrips()
  } catch (e) {
    newTripError.value = e.message || 'Failed to create trip.'
  } finally {
    creatingTrip.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadTrips)
</script>

<style scoped>
.trips-header {
  margin-bottom: 16px;
}
.btn-new-trip {
  padding: 10px 20px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-new-trip:hover { background: #16a34a; }
.trips-section .trips-header { margin-bottom: 12px; }
.modal-card-wide { max-width: 480px; }
.modal-field input {
  width: 100%;
  padding: 12px 14px;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
}
.modal-field input:focus { border-color: #22c55e; }

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

.trip-card-actions {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.btn-delete-trip-inline {
  padding: 9px 16px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.btn-delete-trip-inline:hover:not(:disabled) { background: rgba(239,68,68,0.2); }
.btn-delete-trip-inline:disabled { opacity: 0.6; cursor: not-allowed; }

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
.modal-hint { font-size: 12px; color: rgba(255,255,255,0.4); margin: 6px 0 0; }

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
