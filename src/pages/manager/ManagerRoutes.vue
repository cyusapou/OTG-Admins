<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Routes"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="page-actions">
      <router-link to="/manager/routes/new" class="btn-primary">
        <i class="fas fa-plus"></i> New Route
      </router-link>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-road"
      empty-title="No routes yet"
      empty-subtitle="Add a route to create trips"
      @retry="loadData"
    >
      <template #empty-action>
        <router-link to="/manager/routes/new" class="btn-primary">
          <i class="fas fa-plus"></i> New Route
        </router-link>
      </template>
      <template #cell-route="{ row }">
        <span class="route-cell">{{ row.origin }} → {{ row.destination }}</span>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.isActive ? 'active' : 'inactive'" />
      </template>
      <template #cell-actions="{ row }">
        <button
          type="button"
          class="btn-remove"
          :disabled="row._deleting"
          @click.stop="handleRemoveRoute(row)"
          title="Remove route"
        >
          <i v-if="row._deleting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-trash-alt"></i>
        </button>
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
import { notificationService } from '../../services/notificationService.js'
import { navItems } from './managerNav.js'

const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const columns = [
  { key: 'route', label: 'Route' },
  { key: 'distance', label: 'Distance' },
  { key: 'fare', label: 'Fare' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'actions', label: '', width: '80px' },
]

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [routes, notifs] = await Promise.all([
      routeService.getAll({ companyId: cid.value }),
      notificationService.getUnread(auth.userId.value),
    ])
    rows.value = routes.map(r => ({
      ...r,
      distance: r.distance ? `${r.distance} km` : '—',
      fare: r.fare != null ? `RWF ${Number(r.fare).toLocaleString()}` : '—',
    }))
    unreadCount.value = notifs.length
  } catch {
    error.value = 'Failed to load routes'
  } finally {
    loading.value = false
  }
}

async function handleRemoveRoute(row) {
  if (!confirm(`Remove route ${row.origin} → ${row.destination}?`)) return
  row._deleting = true
  try {
    await routeService.remove(row.id)
    await loadData()
  } catch {
    error.value = 'Failed to remove route'
  } finally {
    row._deleting = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

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
.btn-remove {
  padding: 6px 12px; border-radius: 8px; border: none;
  background: rgba(239,68,68,0.12); color: #ef4444; cursor: pointer;
  font-size: 13px; transition: background 0.15s;
}
.btn-remove:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
.btn-remove:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
