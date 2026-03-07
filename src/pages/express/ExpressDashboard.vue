<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Dashboard"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="stats-grid">
      <StatCard icon="fas fa-warehouse" label="Depots" :value="stats.depots" :loading="loading" />
      <StatCard icon="fas fa-user-tie" label="Managers" :value="stats.managers" :loading="loading" />
      <StatCard icon="fas fa-id-card" label="Drivers" :value="stats.drivers" :loading="loading" />
      <StatCard icon="fas fa-hard-hat" label="Workers" :value="stats.workers" :loading="loading" />
      <StatCard icon="fas fa-bus" label="Buses" :value="stats.buses" :loading="loading" />
      <StatCard icon="fas fa-road" label="Active Routes" :value="stats.activeRoutes" :loading="loading" />
      <StatCard icon="fas fa-route" label="Trips Today" :value="stats.tripsToday" :loading="loading" />
      <StatCard icon="fas fa-coins" label="Revenue Today" :value="stats.revenueToday" :loading="loading" highlight />
      <StatCard icon="fas fa-users" label="Passengers Today" :value="stats.passengersToday" :loading="loading" />
    </div>

    <div class="section-card">
      <div class="section-header">
        <h3><i class="fas fa-exclamation-triangle"></i> Recent Incidents</h3>
      </div>
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i> Loading...
      </div>
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i> {{ error }}
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>
      <div v-else-if="!incidents.length" class="empty-state">
        <i class="fas fa-shield-alt"></i>
        <p>No recent incidents</p>
      </div>
      <div v-else class="incident-list">
        <div v-for="inc in incidents.slice(0, 5)" :key="inc.id" class="incident-row">
          <div class="inc-severity" :class="inc.severity">{{ inc.severity }}</div>
          <div class="inc-body">
            <span class="inc-title">{{ inc.title || inc.description }}</span>
            <span class="inc-date">{{ formatDate(inc.createdAt) }}</span>
          </div>
          <StatusBadge :status="inc.status" />
        </div>
      </div>
    </div>
  </PortalLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import StatCard from '../../components/shared/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { depotService } from '../../services/depotService.js'
import { userService } from '../../services/userService.js'
import { driverService } from '../../services/driverService.js'
import { workerService } from '../../services/workerService.js'
import { busService } from '../../services/busService.js'
import { routeService } from '../../services/routeService.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { incidentService } from '../../services/incidentService.js'
import { notificationService } from '../../services/notificationService.js'
import { companyService } from '../../services/companyService.js'
import { navItems } from './expressNav.js'

const router = useRouter()
const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const loading = ref(true)
const error = ref('')
const incidents = ref([])
const unreadCount = ref(0)
const companyName = ref('')
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const stats = reactive({
  depots: 0, managers: 0, drivers: 0, workers: 0,
  buses: 0, activeRoutes: 0, tripsToday: 0,
  revenueToday: 'RWF 0', passengersToday: 0,
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function today() {
  return new Date().toISOString().split('T')[0]
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [depots, managers, drivers, workers, buses, routes, fares, incs, notifs, company] = await Promise.all([
      depotService.getByCompany(cid.value),
      userService.getAll({ companyId: cid.value, role: 'manager' }),
      driverService.getAll({ companyId: cid.value }),
      workerService.getAll({ companyId: cid.value }),
      busService.getAll({ companyId: cid.value }),
      routeService.getAll({ companyId: cid.value }),
      fareCollectionService.getByCompany(cid.value, { tripDate: today() }),
      incidentService.getByCompany(cid.value),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])

    stats.depots = depots.length
    stats.managers = managers.length
    stats.drivers = drivers.length
    stats.workers = workers.length
    stats.buses = buses.length
    stats.activeRoutes = routes.filter(r => r.isActive).length
    stats.tripsToday = fares.length
    const rev = fares.reduce((s, f) => s + (Number(f.amount) || 0), 0)
    stats.revenueToday = `RWF ${rev.toLocaleString()}`
    stats.passengersToday = fares.reduce((s, f) => s + (Number(f.passengers) || 0), 0)

    incidents.value = incs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch (e) {
    error.value = 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  auth.logout('/express/login')
}

onMounted(loadData)
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.section-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  overflow: hidden;
}

.section-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.section-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
}

.section-header h3 i {
  color: #eab308;
  margin-right: 8px;
}

.loading-state, .error-state, .empty-state {
  padding: 40px 20px;
  text-align: center;
  color: rgba(255,255,255,0.4);
  font-size: 14px;
}

.error-state { color: #ef4444; }

.retry-btn {
  margin-top: 12px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: #22c55e;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.empty-state i {
  font-size: 36px;
  color: #22c55e;
  display: block;
  margin-bottom: 10px;
}

.incident-list { padding: 8px 0; }

.incident-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.incident-row:last-child { border-bottom: none; }

.inc-severity {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.inc-severity.critical, .inc-severity.high { background: rgba(239,68,68,0.12); color: #ef4444; }
.inc-severity.medium { background: rgba(234,179,8,0.12); color: #eab308; }
.inc-severity.low { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }

.inc-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.inc-title {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.inc-date {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
  margin-top: 2px;
}
</style>
