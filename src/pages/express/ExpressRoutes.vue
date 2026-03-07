<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Routes"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="page-actions">
      <router-link to="/express/routes/new" class="btn-primary">
        <i class="fas fa-plus"></i> Submit New Route
      </router-link>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-road"
      emptyTitle="No routes yet"
      emptySubtitle="Submit a route proposal for RURA approval"
      @retry="loadData"
    >
      <template #empty-action>
        <router-link to="/express/routes/new" class="btn-primary">
          <i class="fas fa-plus"></i> Submit New Route
        </router-link>
      </template>
      <template #cell-route="{ row }">
        <span class="route-cell">{{ row.origin }} → {{ row.destination }}</span>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.isActive ? 'active' : 'inactive'" />
      </template>
      <template #cell-approval="{ row }">
        <StatusBadge :status="row.approvalStatus || 'pending'" />
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
import { routeService } from '../../services/routeService.js'
import { routeApprovalService } from '../../services/routeApprovalService.js'
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
  { key: 'route', label: 'Route' },
  { key: 'distance', label: 'Distance' },
  { key: 'fare', label: 'Fare' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'approval', label: 'Approval', width: '110px' },
]

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [routes, approvals, notifs, company] = await Promise.all([
      routeService.getAll({ companyId: cid.value }),
      routeApprovalService.getByCompany(cid.value),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])
    const approvalMap = Object.fromEntries(approvals.map(a => [a.routeId, a.status]))
    rows.value = routes.map(r => ({
      ...r,
      distance: r.distance ? `${r.distance} km` : '—',
      fare: r.fare != null ? `RWF ${Number(r.fare).toLocaleString()}` : '—',
      approvalStatus: approvalMap[r.id] || (r.isActive ? 'approved' : 'pending'),
    }))
    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch {
    error.value = 'Failed to load routes'
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
.route-cell { font-weight: 600; color: rgba(255,255,255,0.9); }
</style>
