<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Incidents"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div class="toolbar">
      <div class="filter-group">
        <label>Severity</label>
        <select v-model="severityFilter" class="filter-select">
          <option value="">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Status</label>
        <select v-model="statusFilter" class="filter-select">
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :rows="filteredIncidents"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-shield-alt"
      emptyTitle="No incidents reported"
      :emptySubtitle="hasFilters ? 'No incidents match the current filters' : 'Incident reports will appear here'"
      @retry="load"
    >
      <template #cell-createdAt="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-companyName="{ value }">
        {{ value || '—' }}
      </template>
      <template #cell-severity="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
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
import { incidentService } from '../../services/incidentService.js'
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
  { key: 'createdAt', label: 'Date', width: '130px' },
  { key: 'companyName', label: 'Company' },
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity', width: '100px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'reporterName', label: 'Reporter' },
]

const incidents = ref([])
const loading = ref(true)
const error = ref('')
const severityFilter = ref('')
const statusFilter = ref('')

const hasFilters = computed(() => !!severityFilter.value || !!statusFilter.value)

const filteredIncidents = computed(() => {
  let list = incidents.value
  if (severityFilter.value) list = list.filter(i => i.severity === severityFilter.value)
  if (statusFilter.value) list = list.filter(i => i.status === statusFilter.value)
  return list
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [allIncidents, allCompanies] = await Promise.all([
      incidentService.getAll({ _sort: 'createdAt', _order: 'desc' }),
      companyService.getAll(),
    ])
    const compMap = Object.fromEntries(allCompanies.map(c => [c.id, c.name]))
    incidents.value = allIncidents.map(i => ({
      ...i,
      companyName: compMap[i.companyId] || '',
      reporterName: i.reportedByName || i.reportedBy || '—',
    }))
  } catch (e) {
    error.value = e.message || 'Failed to load incidents'
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
  cursor: pointer; min-width: 140px;
  appearance: auto;
}
.filter-select:focus { border-color: #22c55e; }
</style>
