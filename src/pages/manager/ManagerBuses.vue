<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Buses"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-bus"
      empty-title="No buses in this depot"
      empty-subtitle="Buses assigned to your depot will appear here"
      @retry="loadBuses"
    >
      <template #cell-plateNumber="{ row }">
        <span class="plate">{{ row.plateNumber }}</span>
      </template>

      <template #cell-driverName="{ row }">
        <span :class="{ 'no-driver': !row.driverName }">{{ row.driverName || 'Unassigned' }}</span>
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
    </DataTable>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { busService } from '../../services/busService.js'
import { userService } from '../../services/userService.js'
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

const columns = [
  { key: 'plateNumber', label: 'Plate' },
  { key: 'model', label: 'Model' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'driverName', label: 'Driver' },
  { key: 'status', label: 'Status' },
]

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

async function loadBuses() {
  loading.value = true
  error.value = ''
  try {
    const depotId = auth.depotId.value

    const [buses, drivers, notifications] = await Promise.all([
      busService.getAll({ depotId }),
      userService.getAll({ role: 'driver', depotId }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    const driverMap = {}
    drivers.forEach(d => { driverMap[d.id] = d })

    rows.value = buses.map(b => {
      const driver = b.driverId ? driverMap[b.driverId] : null
      return {
        id: b.id,
        plateNumber: b.plateNumber || '—',
        model: b.model || '—',
        capacity: b.capacity || '—',
        driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
        status: b.status || 'active',
      }
    })
  } catch {
    error.value = 'Failed to load buses. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadBuses)
</script>

<style scoped>
.plate { font-weight: 700; font-family: monospace; letter-spacing: 0.5px; }
.no-driver { color: rgba(255,255,255,0.3); font-style: italic; }
</style>
