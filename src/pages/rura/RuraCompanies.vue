<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Companies"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div class="toolbar">
      <router-link to="/rura/companies/new" class="btn-primary">
        <i class="fas fa-plus"></i> Register Company
      </router-link>
    </div>

    <DataTable
      :columns="columns"
      :rows="companies"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-building"
      emptyTitle="No companies registered yet"
      emptySubtitle="Register your first transport company to get started"
      :onRowClick="row => $router.push(`/rura/companies/${row.id}`)"
      @retry="load"
    >
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status || (row.isActive === false ? 'suspended' : 'active')" />
      </template>
      <template #cell-routeCount="{ row }">
        {{ row.routeCount ?? '—' }}
      </template>
      <template #cell-createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
      </template>
      <template #empty-action>
        <router-link to="/rura/companies/new" class="btn-primary" style="margin-top: 8px;">
          <i class="fas fa-plus"></i> Register Company
        </router-link>
      </template>
    </DataTable>
  </PortalLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { companyService } from '../../services/companyService.js'
import { routeService } from '../../services/routeService.js'

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
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'routeCount', label: 'Routes', width: '100px' },
  { key: 'createdAt', label: 'Registered', width: '140px' },
]

const companies = ref([])
const loading = ref(true)
const error = ref('')

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [allCompanies, allRoutes] = await Promise.all([
      companyService.getAll(),
      routeService.getAll(),
    ])
    const routeCounts = {}
    allRoutes.forEach(r => {
      routeCounts[r.companyId] = (routeCounts[r.companyId] || 0) + 1
    })
    companies.value = allCompanies.map(c => ({
      ...c,
      routeCount: routeCounts[c.id] || 0,
    }))
  } catch (e) {
    error.value = e.message || 'Failed to load companies'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
</style>
