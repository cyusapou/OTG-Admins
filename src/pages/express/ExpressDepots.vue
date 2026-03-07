<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Depots"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="page-actions">
      <router-link to="/express/depots/new" class="btn-primary">
        <i class="fas fa-plus"></i> Create Depot
      </router-link>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-warehouse"
      emptyTitle="No depots yet"
      emptySubtitle="Create your first depot to start organizing operations"
      @retry="loadData"
    >
      <template #empty-action>
        <router-link to="/express/depots/new" class="btn-primary">
          <i class="fas fa-plus"></i> Create Depot
        </router-link>
      </template>
      <template #cell-manager="{ row }">
        {{ row.managerName || '—' }}
      </template>
      <template #cell-buses="{ row }">
        {{ row.busCount }}
      </template>
      <template #cell-drivers="{ row }">
        {{ row.driverCount }}
      </template>
    </DataTable>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import { useAuth } from '../../composables/useAuth.js'
import { depotService } from '../../services/depotService.js'
import { userService } from '../../services/userService.js'
import { busService } from '../../services/busService.js'
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
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'manager', label: 'Manager' },
  { key: 'buses', label: 'Buses', width: '80px' },
  { key: 'drivers', label: 'Drivers', width: '80px' },
]

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [depots, managers, buses, drivers, notifs, company] = await Promise.all([
      depotService.getByCompany(cid.value),
      userService.getAll({ companyId: cid.value, role: 'manager' }),
      busService.getAll({ companyId: cid.value }),
      driverService.getAll({ companyId: cid.value }),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])
    const mgrMap = Object.fromEntries(managers.map(m => [m.id, `${m.firstName} ${m.lastName}`]))
    rows.value = depots.map(d => ({
      ...d,
      managerName: mgrMap[d.managerId] || '',
      busCount: buses.filter(b => b.depotId === d.id).length,
      driverCount: drivers.filter(dr => dr.depotId === d.id).length,
    }))
    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch {
    error.value = 'Failed to load depots'
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  background: #22c55e;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
</style>
