<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Dashboard"
    :user-name="userName"
    :company-name="companyName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="showNotifications = !showNotifications"
  >
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading dashboard...</p>
    </div>

    <template v-else>
      <div class="stats-grid">
        <StatCard icon="fas fa-id-card" label="Drivers" :value="stats.drivers" :loading="loading" />
        <StatCard icon="fas fa-hard-hat" label="Workers" :value="stats.workers" :loading="loading" />
        <StatCard icon="fas fa-bus" label="Buses" :value="stats.buses" :loading="loading" />
        <StatCard icon="fas fa-route" label="Trips Today" :value="stats.tripsToday" :loading="loading" />
        <StatCard icon="fas fa-coins" label="Revenue Today" :value="stats.revenueToday" :loading="loading" />
        <StatCard icon="fas fa-users" label="Passengers Today" :value="stats.passengersToday" :loading="loading" />
      </div>

      <div v-if="alerts.length" class="alerts-panel">
        <h3 class="section-title"><i class="fas fa-exclamation-triangle"></i> Alerts</h3>
        <div class="alert-card" v-for="alert in alerts" :key="alert.id">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ alert.message }}</span>
        </div>
      </div>

      <div class="section-title-row">
        <h3 class="section-title"><i class="fas fa-clipboard-list"></i> Today's Trip Board</h3>
      </div>

      <div v-if="!todayTrips.length" class="empty-trips">
        <i class="fas fa-route"></i>
        <p>No trips scheduled for today</p>
      </div>

      <div v-else class="trip-board">
        <div class="trip-card" v-for="trip in todayTrips" :key="trip.id">
          <div class="trip-header">
            <span class="trip-route">{{ trip.routeName }}</span>
            <StatusBadge :status="trip.status" />
          </div>
          <div class="trip-details">
            <div class="trip-detail">
              <i class="fas fa-clock"></i>
              <span>{{ trip.departureTime }}</span>
            </div>
            <div class="trip-detail">
              <i class="fas fa-id-card"></i>
              <span :class="{ 'unassigned': !trip.driverName }">{{ trip.driverName || 'UNASSIGNED' }}</span>
            </div>
            <div class="trip-detail">
              <i class="fas fa-hard-hat"></i>
              <span :class="{ 'unassigned': !trip.workerName }">{{ trip.workerName || 'UNASSIGNED' }}</span>
            </div>
            <div class="trip-detail">
              <i class="fas fa-bus"></i>
              <span>{{ trip.busPlate || '—' }}</span>
            </div>
            <div class="trip-detail">
              <i class="fas fa-users"></i>
              <span>{{ trip.passengers }} passengers</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import StatCard from '../../components/shared/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { userService } from '../../services/userService.js'
import { busService } from '../../services/busService.js'
import { scheduleService } from '../../services/scheduleService.js'
import { routeService } from '../../services/routeService.js'
import { driverService } from '../../services/driverService.js'
import { workerService } from '../../services/workerService.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { bookingService } from '../../services/bookingService.js'
import { notificationService } from '../../services/notificationService.js'

const router = useRouter()
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
const showNotifications = ref(false)
const unreadCount = ref(0)

const stats = ref({
  drivers: 0,
  workers: 0,
  buses: 0,
  tripsToday: 0,
  revenueToday: '0 RWF',
  passengersToday: 0,
})

const todayTrips = ref([])
const alerts = ref([])

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})
const companyName = ref('')

function today() {
  return new Date().toISOString().split('T')[0]
}

async function loadDashboard() {
  loading.value = true
  const depotId = auth.depotId.value
  const companyId = auth.companyId.value
  try {
    const [drivers, workers, buses, schedules, routes, fares, notifications] = await Promise.all([
      userService.getAll({ role: 'driver', depotId }),
      userService.getAll({ role: 'worker', depotId }),
      busService.getAll({ depotId }),
      scheduleService.getByCompany(companyId),
      routeService.getByCompany(companyId),
      fareCollectionService.getByDepot(depotId, { tripDate: today() }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    stats.value.drivers = drivers.length
    stats.value.workers = workers.length
    stats.value.buses = buses.length

    const routeMap = {}
    routes.forEach(r => { routeMap[r.id] = r })

    const driverMap = {}
    drivers.forEach(d => { driverMap[d.id] = d })

    const workerMap = {}
    workers.forEach(w => { workerMap[w.id] = w })

    const driverRecords = await driverService.getAll({ companyId })
    const driverUserMap = {}
    driverRecords.forEach(d => { driverUserMap[d.id] = d })

    const workerRecords = await workerService.getAll({ companyId })
    const workerUserMap = {}
    workerRecords.forEach(w => { workerUserMap[w.id] = w })

    const todayDate = today()
    const todaySchedules = schedules.filter(s => {
      if (s.depotId && s.depotId !== depotId) return false
      return true
    })

    const revenue = fares.reduce((sum, f) => sum + (f.amount || 0), 0)
    const passengers = fares.reduce((sum, f) => sum + (f.passengerCount || 1), 0)

    stats.value.tripsToday = todaySchedules.length
    stats.value.revenueToday = `${revenue.toLocaleString()} RWF`
    stats.value.passengersToday = passengers

    const tripAlerts = []
    todayTrips.value = todaySchedules.map(s => {
      const route = routeMap[s.routeId]
      const driverUser = s.driverId ? driverMap[s.driverId] : null
      const workerUser = s.workerId ? workerMap[s.workerId] : null

      if (!s.driverId) {
        tripAlerts.push({
          id: `no-driver-${s.id}`,
          message: `Trip ${route?.name || s.routeId} at ${s.departureTime || '—'} has no driver assigned`,
        })
      }
      if (!s.workerId) {
        tripAlerts.push({
          id: `no-worker-${s.id}`,
          message: `Trip ${route?.name || s.routeId} at ${s.departureTime || '—'} has no worker assigned`,
        })
      }

      const tripFares = fares.filter(f => f.scheduleId === s.id)
      const pCount = tripFares.reduce((sum, f) => sum + (f.passengerCount || 1), 0)

      return {
        id: s.id,
        routeName: route?.name || 'Unknown Route',
        departureTime: s.departureTime || '—',
        driverName: driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : null,
        workerName: workerUser ? `${workerUser.firstName} ${workerUser.lastName}` : null,
        busPlate: s.busPlate || null,
        status: s.status || 'scheduled',
        passengers: pCount,
      }
    })

    alerts.value = tripAlerts
  } catch (e) {
    console.error('Dashboard load failed:', e)
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadDashboard)
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title i { color: #22c55e; font-size: 14px; }

.alerts-panel {
  margin-bottom: 24px;
}
.alerts-panel .section-title {
  margin-bottom: 12px;
}
.alerts-panel .section-title i { color: #ef4444; }

.alert-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px;
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 8px;
}
.alert-card i { flex-shrink: 0; }

.trip-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.trip-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.15s;
}
.trip-card:hover { border-color: rgba(34,197,94,0.25); }

.trip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.trip-route {
  font-weight: 600;
  font-size: 14px;
  color: rgba(255,255,255,0.9);
}

.trip-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.trip-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255,255,255,0.55);
}
.trip-detail i {
  width: 16px;
  text-align: center;
  color: rgba(255,255,255,0.3);
  font-size: 12px;
}

.unassigned {
  color: #ef4444;
  font-weight: 600;
}

.empty-trips {
  text-align: center;
  padding: 48px 20px;
  color: rgba(255,255,255,0.35);
}
.empty-trips i {
  font-size: 40px;
  color: #22c55e;
  display: block;
  margin-bottom: 12px;
}
.empty-trips p {
  font-size: 15px;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: rgba(255,255,255,0.4);
}
.loading-state i { font-size: 28px; margin-bottom: 12px; display: block; color: #22c55e; }
.loading-state p { font-size: 14px; margin: 0; }

@media (max-width: 640px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .trip-board { grid-template-columns: 1fr; }
}
</style>
