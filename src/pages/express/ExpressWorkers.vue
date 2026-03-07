<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Workers"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-hard-hat"
      emptyTitle="No workers"
      emptySubtitle="Workers are assigned through depot managers"
      @retry="loadData"
    >
      <template #cell-name="{ row }">
        <span class="name-cell">{{ row.firstName }} {{ row.lastName }}</span>
      </template>
      <template #cell-depot="{ row }">
        {{ row.depotName || '—' }}
      </template>
      <template #cell-role="{ row }">
        {{ row.workerRole || row.position || '—' }}
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
import { workerService } from '../../services/workerService.js'
import { depotService } from '../../services/depotService.js'
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
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role' },
  { key: 'depot', label: 'Depot' },
  { key: 'status', label: 'Status', width: '100px' },
]

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [workers, depots, notifs, company] = await Promise.all([
      workerService.getAll({ companyId: cid.value }),
      depotService.getByCompany(cid.value),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])
    const depotMap = Object.fromEntries(depots.map(d => [d.id, d.name]))
    rows.value = workers.map(w => ({
      ...w,
      depotName: depotMap[w.depotId] || '',
    }))
    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch {
    error.value = 'Failed to load workers'
  } finally {
    loading.value = false
  }
}

function handleLogout() { auth.logout('/express/login') }

onMounted(loadData)
</script>

<style scoped>
.name-cell { font-weight: 600; color: rgba(255,255,255,0.9); }
</style>
