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
    <div class="page-actions">
      <button class="btn-primary" @click="showReportModal = true">
        <i class="fas fa-plus"></i> Report Incident
      </button>
    </div>

    <DataTable
      :columns="columns"
      :rows="sortedRows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-exclamation-triangle"
      empty-title="No incidents reported"
      empty-subtitle="Report an incident to get started"
      @retry="loadIncidents"
    >
      <template #empty-action>
        <button class="btn-add" @click="showReportModal = true">
          <i class="fas fa-plus"></i> Report Incident
        </button>
      </template>
      <template #cell-severity="{ row }">
        <StatusBadge :status="row.severity" />
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>

      <template #cell-actions="{ row }">
        <div class="incident-actions">
          <button
            v-if="row.status === 'open'"
            class="btn-resolve"
            @click="openResolveModal(row)"
          >
            <i class="fas fa-check"></i> Resolve
          </button>
          <span v-if="row.status !== 'open'" class="resolved-label">
            <i class="fas fa-check-circle"></i> Resolved
          </span>
          <button
            type="button"
            class="btn-remove-incident"
            :disabled="row._removing"
            @click.stop="handleRemoveIncident(row)"
            title="Delete incident"
          >
            <i v-if="row._removing" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Report Incident Modal -->
    <teleport to="body">
      <div v-if="showReportModal" class="modal-backdrop" @click.self="showReportModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Report Incident</h3>
            <button class="modal-close" @click="showReportModal = false"><i class="fas fa-times"></i></button>
          </div>

          <form @submit.prevent="handleReportIncident">
            <div class="modal-field">
              <label>Type</label>
              <select v-model="reportForm.type" required>
                <option value="">Select type...</option>
                <option value="breakdown">Breakdown</option>
                <option value="accident">Accident</option>
                <option value="delay">Delay</option>
                <option value="passenger_complaint">Passenger Complaint</option>
                <option value="road_block">Road Block</option>
                <option value="weather">Weather</option>
                <option value="fuel_shortage">Fuel Shortage</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Severity</label>
              <select v-model="reportForm.severity" required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Description</label>
              <textarea v-model="reportForm.description" rows="3" required placeholder="Describe what happened..."></textarea>
            </div>

            <p v-if="reportError" class="modal-error">{{ reportError }}</p>

            <button type="submit" class="btn-primary btn-full" :disabled="reporting">
              <i v-if="reporting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Report Incident</span>
            </button>
          </form>
        </div>
      </div>
    </teleport>

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
import { navItems } from './managerNav.js'

const auth = useAuth()

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'severity', label: 'Severity' },
  { key: 'reportedBy', label: 'Reported By' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', width: '200px' },
]

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)

const resolveModal = ref(null)
const resolution = ref('')
const resolving = ref(false)

const showReportModal = ref(false)
const reporting = ref(false)
const reportError = ref('')
const reportForm = ref({
  type: '',
  severity: 'low',
  description: '',
})
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

async function handleRemoveIncident(row) {
  if (!confirm('Delete this incident record?')) return
  row._removing = true
  try {
    await incidentService.remove(row.id)
    await loadIncidents()
  } catch {
    error.value = 'Failed to delete incident.'
  } finally {
    row._removing = false
  }
}

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

async function handleReportIncident() {
  if (!reportForm.value.description.trim()) {
    reportError.value = 'Please enter a description'
    return
  }
  reporting.value = true
  reportError.value = ''
  try {
    await incidentService.create({
      companyId: auth.companyId.value,
      depotId: auth.depotId.value || null,
      reportedBy: auth.userId.value,
      reporterRole: 'manager',
      type: reportForm.value.type,
      severity: reportForm.value.severity,
      description: reportForm.value.description.trim(),
      status: 'open',
      date: new Date().toISOString().split('T')[0],
    })
    showReportModal.value = false
    reportForm.value = { type: '', severity: 'low', description: '' }
    await loadIncidents()
  } catch {
    reportError.value = 'Failed to report incident. Try again.'
  } finally {
    reporting.value = false
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

.incident-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.btn-remove-incident {
  padding: 6px 12px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 8px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.btn-remove-incident:hover:not(:disabled) { background: rgba(239,68,68,0.2); }
.btn-remove-incident:disabled { opacity: 0.6; cursor: not-allowed; }

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

.page-actions { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.page-actions .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; min-height: auto; }
.btn-add {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: #22c55e; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-add:hover { background: #16a34a; }
</style>
