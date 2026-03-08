<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Drivers"
    :user-name="userName"
    :company-name="companyName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-id-card"
      empty-title="No drivers yet"
      empty-subtitle="Add your first driver to get started"
      @retry="loadDrivers"
    >
      <template #empty-action>
        <router-link to="/manager/drivers/new" class="btn-add">
          <i class="fas fa-plus"></i> Add Driver
        </router-link>
      </template>

      <template #cell-name="{ row }">
        <span class="driver-name">{{ row.name }}</span>
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>

      <template #cell-licenseExpiry="{ row }">
        <span :class="{ 'expiry-warn': isExpiringSoon(row.licenseExpiry) }">
          {{ row.licenseExpiry || '—' }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <button
          v-if="row.status !== 'inactive'"
          type="button"
          class="btn-remove"
          :disabled="row._removing"
          @click.stop="handleRemoveDriver(row)"
          title="Remove driver"
        >
          <i v-if="row._removing" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-user-minus"></i>
        </button>
        <span v-else class="inactive-label">Inactive</span>
      </template>
    </DataTable>

    <router-link to="/manager/drivers/new" class="fab">
      <i class="fas fa-plus"></i>
    </router-link>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { userService } from '../../services/userService.js'
import { driverService } from '../../services/driverService.js'
import { notificationService } from '../../services/notificationService.js'
import { navItems } from './managerNav.js'

const auth = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'licenseNumber', label: 'License #' },
  { key: 'licenseExpiry', label: 'License Expiry' },
  { key: 'busPlate', label: 'Bus' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', width: '90px' },
]

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)
const companyName = ref('')

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

function isExpiringSoon(dateStr) {
  if (!dateStr) return false
  const exp = new Date(dateStr)
  const now = new Date()
  const diff = (exp - now) / (1000 * 60 * 60 * 24)
  return diff < 30 && diff > 0
}

async function loadDrivers() {
  loading.value = true
  error.value = ''
  try {
    const depotId = auth.depotId.value
    const companyId = auth.companyId.value

    const [driverUsers, driverRecords, notifications] = await Promise.all([
      userService.getAll({ role: 'driver', depotId }),
      driverService.getAll({ companyId }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    const driverMap = {}
    driverRecords.forEach(d => { driverMap[d.userId] = d })

    rows.value = driverUsers
      .filter(u => u.status !== 'inactive')
      .map(u => {
        const rec = driverMap[u.id] || {}
        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          phone: u.phone || '—',
          licenseNumber: rec.licenseNumber || '—',
          licenseExpiry: rec.licenseExpiry || null,
          busPlate: rec.busPlate || '—',
          status: u.status || 'active',
        }
      })
  } catch (e) {
    error.value = 'Failed to load drivers. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleRemoveDriver(row) {
  if (!confirm(`Remove ${row.name} from drivers? They will be deactivated.`)) return
  row._removing = true
  try {
    await userService.patch(row.id, { status: 'inactive' })
    await loadDrivers()
  } catch {
    error.value = 'Failed to remove driver'
  } finally {
    row._removing = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadDrivers)
</script>

<style scoped>
.driver-name { font-weight: 600; }
.expiry-warn { color: #eab308; font-weight: 500; }

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #22c55e;
  color: #fff;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
}
.btn-add:hover { background: #16a34a; }

.fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #22c55e;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(34,197,94,0.35);
  transition: background 0.2s, transform 0.15s;
  z-index: 30;
}
.fab:hover { background: #16a34a; transform: scale(1.05); }

.btn-remove {
  padding: 6px 12px; border-radius: 8px; border: none;
  background: rgba(239,68,68,0.12); color: #ef4444; cursor: pointer;
  font-size: 13px; transition: background 0.15s;
}
.btn-remove:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
.btn-remove:disabled { opacity: 0.6; cursor: not-allowed; }
.inactive-label { font-size: 12px; color: rgba(255,255,255,0.35); }
</style>
