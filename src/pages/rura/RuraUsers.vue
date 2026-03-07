<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Users"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div class="toolbar">
      <div class="filter-group">
        <label>Role</label>
        <select v-model="roleFilter" class="filter-select">
          <option value="">All Roles</option>
          <option value="rura">RURA</option>
          <option value="express_admin">Express Admin</option>
          <option value="manager">Manager</option>
          <option value="driver">Driver</option>
          <option value="worker">Worker</option>
        </select>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :rows="filteredUsers"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-users"
      emptyTitle="No users found"
      :emptySubtitle="roleFilter ? 'No users match the selected role filter' : 'Users from all companies will appear here'"
      @retry="load"
    >
      <template #cell-name="{ row }">
        {{ row.firstName }} {{ row.lastName }}
      </template>
      <template #cell-role="{ row }">
        <StatusBadge :status="row.role" />
      </template>
      <template #cell-companyName="{ value }">
        {{ value || '—' }}
      </template>
      <template #cell-isActive="{ row }">
        <StatusBadge :status="row.isActive === false ? 'inactive' : 'active'" />
      </template>
      <template #cell-createdAt="{ value }">
        {{ formatDate(value) }}
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
import { userService } from '../../services/userService.js'
import { companyService } from '../../services/companyService.js'

const auth = useAuth()

const navItems = [
  { path: '/rura', icon: 'fas fa-chart-pie', label: 'Dashboard', exact: true },
  { path: '/rura/companies', icon: 'fas fa-building', label: 'Companies' },
  { path: '/rura/routes', icon: 'fas fa-road', label: 'Routes' },
  { path: '/rura/finances', icon: 'fas fa-coins', label: 'Finances' },
  { path: '/rura/users', icon: 'fas fa-users', label: 'Users' },
  { path: '/rura/incidents', icon: 'fas fa-exclamation-triangle', label: 'Incidents' },
  { path: '/rura/audit', icon: 'fas fa-clipboard-list', label: 'Audit Log' },
]

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'role', label: 'Role', width: '140px' },
  { key: 'companyName', label: 'Company' },
  { key: 'isActive', label: 'Status', width: '100px' },
  { key: 'createdAt', label: 'Created', width: '130px' },
]

const users = ref([])
const loading = ref(true)
const error = ref('')
const roleFilter = ref('')

const filteredUsers = computed(() => {
  if (!roleFilter.value) return users.value
  return users.value.filter(u => u.role === roleFilter.value)
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [allUsers, allCompanies] = await Promise.all([
      userService.getAll(),
      companyService.getAll(),
    ])
    const compMap = Object.fromEntries(allCompanies.map(c => [c.id, c.name]))
    users.value = allUsers.map(u => ({
      ...u,
      companyName: compMap[u.companyId] || '',
    }))
  } catch (e) {
    error.value = e.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex; align-items: flex-end; gap: 16px; margin-bottom: 16px;
  flex-wrap: wrap;
}
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-group label { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 500; }
.filter-select {
  padding: 9px 14px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1); background: #141414;
  color: rgba(255,255,255,0.8); font-size: 13px; outline: none;
  cursor: pointer; min-width: 160px;
  appearance: auto;
}
.filter-select:focus { border-color: #22c55e; }
</style>
