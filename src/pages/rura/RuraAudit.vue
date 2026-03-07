<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Audit Log"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div class="toolbar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="search" type="text" placeholder="Search logs..." />
      </div>
      <div class="filter-group">
        <label>Action</label>
        <select v-model="actionFilter" class="filter-select">
          <option value="">All Actions</option>
          <option v-for="a in actionTypes" :key="a" :value="a">{{ formatAction(a) }}</option>
        </select>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :rows="filteredLogs"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-clipboard-list"
      emptyTitle="No audit logs"
      :emptySubtitle="hasFilters ? 'No logs match the current filters' : 'System activity will be recorded here'"
      :perPage="50"
      @retry="load"
    >
      <template #cell-createdAt="{ value }">
        {{ formatTime(value) }}
      </template>
      <template #cell-userName="{ value }">
        {{ value || '—' }}
      </template>
      <template #cell-userRole="{ value }">
        <StatusBadge v-if="value" :status="value" />
        <span v-else class="muted">—</span>
      </template>
      <template #cell-companyName="{ value }">
        {{ value || '—' }}
      </template>
      <template #cell-action="{ value }">
        <span class="action-tag">{{ formatAction(value) }}</span>
      </template>
      <template #cell-description="{ value }">
        <span class="desc-text">{{ value || '—' }}</span>
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
import { auditLogService } from '../../services/auditLogService.js'
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
  { key: 'createdAt', label: 'Time', width: '160px' },
  { key: 'userName', label: 'User' },
  { key: 'userRole', label: 'Role', width: '130px' },
  { key: 'companyName', label: 'Company' },
  { key: 'action', label: 'Action', width: '160px' },
  { key: 'description', label: 'Details' },
]

const logs = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const actionFilter = ref('')

const actionTypes = computed(() => {
  const set = new Set(logs.value.map(l => l.action).filter(Boolean))
  return [...set].sort()
})

const hasFilters = computed(() => !!search.value || !!actionFilter.value)

const filteredLogs = computed(() => {
  let list = logs.value
  if (actionFilter.value) {
    list = list.filter(l => l.action === actionFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(l =>
      (l.userName || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.companyName || '').toLowerCase().includes(q)
    )
  }
  return list
})

function formatTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function formatAction(action) {
  return (action || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [allLogs, allUsers, allCompanies] = await Promise.all([
      auditLogService.getRecent(500),
      userService.getAll(),
      companyService.getAll(),
    ])
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim()]))
    const compMap = Object.fromEntries(allCompanies.map(c => [c.id, c.name]))

    logs.value = allLogs.map(l => ({
      ...l,
      userName: userMap[l.userId] || l.userId || '',
      companyName: compMap[l.companyId] || '',
    }))
  } catch (e) {
    error.value = e.message || 'Failed to load audit logs'
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

.search-box {
  display: flex; align-items: center; gap: 10px;
  background: #141414; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 0 14px; flex: 1; max-width: 340px;
  transition: border-color 0.2s;
}
.search-box:focus-within { border-color: #22c55e; }
.search-box i { color: rgba(255,255,255,0.25); font-size: 14px; }
.search-box input {
  flex: 1; background: transparent; border: none; outline: none;
  color: rgba(255,255,255,0.85); font-size: 14px; padding: 10px 0;
}
.search-box input::placeholder { color: rgba(255,255,255,0.2); }

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

.action-tag {
  display: inline-block; padding: 3px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.05); font-size: 12px; font-weight: 500;
  color: rgba(255,255,255,0.6);
}

.desc-text {
  font-size: 13px; color: rgba(255,255,255,0.55);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.muted { color: rgba(255,255,255,0.25); }
</style>
