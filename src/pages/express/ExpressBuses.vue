<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Fleet"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="page-actions">
      <router-link to="/express/buses/new" class="btn-primary">
        <i class="fas fa-plus"></i> Add Bus
      </router-link>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-bus"
      emptyTitle="No buses"
      emptySubtitle="Add your first bus to the fleet"
      @retry="loadData"
    >
      <template #empty-action>
        <router-link to="/express/buses/new" class="btn-primary">
          <i class="fas fa-plus"></i> Add Bus
        </router-link>
      </template>
      <template #cell-plate="{ row }">
        <span class="plate-cell">{{ row.plateNumber || row.plate }}</span>
      </template>
      <template #cell-depot="{ row }">
        {{ row.depotName || '—' }}
      </template>
      <template #cell-driver="{ row }">
        {{ row.driverName || '—' }}
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.isActive !== false ? 'active' : 'inactive'" />
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
import { depotService } from '../../services/depotService.js'
import { driverService } from '../../services/driverService.js'
import { notificationService } from '../../services/notificationService.js'
import { companyService } from '../../services/companyService.js'
import { navItems } from './expressNav.js'

const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)
const companyName = ref('')
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const columns = [
  { key: 'plate', label: 'Plate' },
  { key: 'model', label: 'Model' },
  { key: 'capacity', label: 'Capacity', width: '90px' },
  { key: 'depot', label: 'Depot' },
  { key: 'driver', label: 'Driver' },
  { key: 'status', label: 'Status', width: '100px' },
]

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [buses, depots, drivers, notifs, company] = await Promise.all([
      busService.getAll({ companyId: cid.value }),
      depotService.getByCompany(cid.value),
      driverService.getAll({ companyId: cid.value }),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])
    const depotMap = Object.fromEntries(depots.map(d => [d.id, d.name]))
    const driverMap = Object.fromEntries(drivers.map(d => [d.id, `${d.firstName} ${d.lastName}`]))
    rows.value = buses.map(b => ({
      ...b,
      model: [b.make, b.model].filter(Boolean).join(' ') || '—',
      depotName: depotMap[b.depotId] || '',
      driverName: driverMap[b.driverId] || '',
    }))
    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch {
    error.value = 'Failed to load fleet'
  } finally {
    loading.value = false
  }
}

function handleLogout() { auth.logout('/express/login') }

onMounted(loadData)
</script>

<style scoped>
.page-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 10px; background: #22c55e;
  color: #fff; font-size: 14px; font-weight: 600; text-decoration: none;
  border: none; cursor: pointer; transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
.plate-cell { font-weight: 700; color: rgba(255,255,255,0.9); font-family: monospace; letter-spacing: 0.5px; }
</style>
