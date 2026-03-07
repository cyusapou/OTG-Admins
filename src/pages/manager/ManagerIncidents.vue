<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Incidents"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <DataTable
      :columns="columns"
      :rows="sortedRows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-exclamation-triangle"
      empty-title="No incidents reported"
      empty-subtitle="Incidents for your depot will appear here"
      @retry="loadIncidents"
    >
      <template #cell-severity="{ row }">
        <StatusBadge :status="row.severity" />
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>

      <template #cell-actions="{ row }">
        <button
          v-if="row.status === 'open'"
          class="btn-resolve"
          @click="openResolveModal(row)"
        >
          <i class="fas fa-check"></i> Resolve
        </button>
        <span v-else class="resolved-label">
          <i class="fas fa-check-circle"></i> Resolved
        </span>
      </template>
    </DataTable>

    <teleport to="body">
      <div v-if="resolveModal" class="modal-backdrop" @click.self="resolveModal = null">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Resolve Incident</h3>
            <button class="modal-close" @click="resolveModal = null"><i class="fas fa-times"></i></button>
          </div>
          <p class="modal-sub">{{ resolveModal.description }}</p>

          <div class="modal-field">
            <label>Resolution</label>
            <textarea
              v-model="resolution"
              rows="4"
              required
              placeholder="Describe how this was resolved..."
            ></textarea>
          </div>

          <p v-if="resolveError" class="modal-error">{{ resolveError }}</p>

          <button class="btn-primary btn-full" :disabled="resolving" @click="handleResolve">
            <i v-if="resolving" class="fas fa-spinner fa-spin"></i>
            <span v-else>Mark Resolved</span>
          </button>
        </div>
      </div>
    </teleport>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { incidentService } from '../../services/incidentService.js'
import { notificationService } from '../../services/notificationService.js'

const auth = useAuth()

const navItems = [
  { path: '/manager', icon: 'fas fa-chart-pie', label: 'Dashboard', exact: true },
  { path: '/manager/drivers', icon: 'fas fa-id-card', label: 'Drivers' },
  { path: '/manager/workers', icon: 'fas fa-hard-hat', label: 'Workers' },
  { path: '/manager/trips', icon: 'fas fa-route', label: 'Trips' },
  { path: '/manager/buses', icon: 'fas fa-bus', label: 'Buses' },
  { path: '/manager/expenses', icon: 'fas fa-receipt', label: 'Expenses' },
  { path: '/manager/salaries', icon: 'fas fa-money-bill-wave', label: 'Salaries' },
  { path: '/manager/incidents', icon: 'fas fa-exclamation-triangle', label: 'Incidents' },
]

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'severity', label: 'Severity' },
  { key: 'reportedBy', label: 'Reported By' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', width: '130px' },
]

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)

const resolveModal = ref(null)
const resolution = ref('')
const resolving = ref(false)
const resolveError = ref('')

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const sortedRows = computed(() => {
  return [...rows.value].sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') return -1
    if (a.status !== 'open' && b.status === 'open') return 1
    return 0
  })
})

async function loadIncidents() {
  loading.value = true
  error.value = ''
  try {
    const depotId = auth.depotId.value

    const [incidents, notifications] = await Promise.all([
      incidentService.getByDepot(depotId),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    rows.value = incidents.map(inc => ({
      id: inc.id,
      date: inc.createdAt?.split('T')[0] || '—',
      type: inc.type || 'General',
      description: inc.description || '—',
      severity: inc.severity || 'low',
      reportedBy: inc.reportedByName || '—',
      status: inc.status || 'open',
    }))
  } catch {
    error.value = 'Failed to load incidents. Please try again.'
  } finally {
    loading.value = false
  }
}

function openResolveModal(row) {
  resolveModal.value = row
  resolution.value = ''
  resolveError.value = ''
}

async function handleResolve() {
  if (!resolution.value.trim()) {
    resolveError.value = 'Please describe the resolution'
    return
  }
  resolving.value = true
  resolveError.value = ''
  try {
    await incidentService.resolve(
      resolveModal.value.id,
      auth.userId.value,
      resolution.value.trim()
    )
    resolveModal.value = null
    await loadIncidents()
  } catch {
    resolveError.value = 'Failed to resolve. Try again.'
  } finally {
    resolving.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadIncidents)
</script>

<style scoped>
.btn-resolve {
  padding: 6px 14px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 8px;
  color: #22c55e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.btn-resolve:hover { background: rgba(34,197,94,0.2); }

.resolved-label {
  font-size: 12px;
  color: #22c55e;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}
.modal-card {
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.9); }
.modal-close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.35);
  font-size: 18px;
  cursor: pointer;
}
.modal-close:hover { color: rgba(255,255,255,0.7); }
.modal-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  margin: 0 0 20px;
  line-height: 1.5;
}

.modal-field { margin-bottom: 16px; }
.modal-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
}
.modal-field textarea {
  width: 100%;
  padding: 12px 14px;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}
.modal-field textarea:focus { border-color: #22c55e; }
.modal-field textarea::placeholder { color: rgba(255,255,255,0.2); }

.modal-error { color: #ef4444; font-size: 13px; margin-bottom: 12px; }

.btn-primary {
  padding: 12px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  min-height: 46px;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #16a34a; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-full { width: 100%; display: flex; align-items: center; justify-content: center; }
</style>
