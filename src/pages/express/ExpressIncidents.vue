<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Incidents"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="filters">
      <select v-model="severityFilter" @change="applyFilters">
        <option value="">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select v-model="statusFilter" @change="applyFilters">
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>

    <DataTable
      :columns="columns"
      :rows="filteredRows"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-shield-alt"
      emptyTitle="No incidents"
      emptySubtitle="No incidents match your current filters"
      @retry="loadData"
    >
      <template #cell-title="{ row }">
        <span class="title-cell">{{ row.title || row.description || '—' }}</span>
      </template>
      <template #cell-severity="{ row }">
        <span class="severity-tag" :class="row.severity">{{ row.severity }}</span>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #cell-date="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #cell-depot="{ row }">
        {{ row.depotName || '—' }}
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
import { depotService } from '../../services/depotService.js'
import { notificationService } from '../../services/notificationService.js'
import { companyService } from '../../services/companyService.js'
import { navItems } from './expressNav.js'

const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const loading = ref(true)
const error = ref('')
const allRows = ref([])
const filteredRows = ref([])
const severityFilter = ref('')
const statusFilter = ref('')
const unreadCount = ref(0)
const companyName = ref('')
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const columns = [
  { key: 'title', label: 'Incident' },
  { key: 'severity', label: 'Severity', width: '100px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'depot', label: 'Depot' },
  { key: 'date', label: 'Date', width: '110px' },
]

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function applyFilters() {
  filteredRows.value = allRows.value.filter(r => {
    if (severityFilter.value && r.severity !== severityFilter.value) return false
    if (statusFilter.value && r.status !== statusFilter.value) return false
    return true
  })
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [incidents, depots, notifs, company] = await Promise.all([
      incidentService.getByCompany(cid.value),
      depotService.getByCompany(cid.value),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])
    const depotMap = Object.fromEntries(depots.map(d => [d.id, d.name]))
    allRows.value = incidents
      .map(i => ({ ...i, depotName: depotMap[i.depotId] || '' }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    applyFilters()
    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch {
    error.value = 'Failed to load incidents'
  } finally {
    loading.value = false
  }
}

function handleLogout() { auth.logout('/express/login') }

onMounted(loadData)
</script>

<style scoped>
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filters select {
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #141414;
  color: rgba(255,255,255,0.7);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

.filters select:focus { border-color: #22c55e; }
.filters select option { background: #141414; color: rgba(255,255,255,0.85); }

.title-cell {
  font-weight: 500;
  color: rgba(255,255,255,0.85);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.severity-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.severity-tag.critical, .severity-tag.high { background: rgba(239,68,68,0.12); color: #ef4444; }
.severity-tag.medium { background: rgba(234,179,8,0.12); color: #eab308; }
.severity-tag.low { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
</style>
