<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Routes"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: tab === 'all' }" @click="tab = 'all'">
        All Routes
      </button>
      <button class="tab-btn" :class="{ active: tab === 'pending' }" @click="tab = 'pending'">
        Pending Approvals
        <span v-if="pendingApprovals.length" class="tab-badge">{{ pendingApprovals.length }}</span>
      </button>
    </div>

    <!-- ALL ROUTES -->
    <div v-if="tab === 'all'">
      <DataTable
        :columns="routeColumns"
        :rows="allRoutes"
        :loading="loadingRoutes"
        :error="routeError"
        emptyIcon="fas fa-road"
        emptyTitle="No routes registered"
        emptySubtitle="Routes from all companies will appear here"
        @retry="loadRoutes"
      >
        <template #cell-isActive="{ row }">
          <StatusBadge :status="row.isActive === false ? 'inactive' : 'active'" />
        </template>
        <template #cell-companyName="{ value }">
          {{ value || '—' }}
        </template>
      </DataTable>
    </div>

    <!-- PENDING APPROVALS -->
    <div v-if="tab === 'pending'">
      <DataTable
        :columns="approvalColumns"
        :rows="pendingApprovals"
        :loading="loadingApprovals"
        :error="approvalError"
        emptyIcon="fas fa-check-circle"
        emptyTitle="No pending approvals"
        emptySubtitle="All route requests have been reviewed"
        @retry="loadApprovals"
      >
        <template #cell-status="{ value }">
          <StatusBadge :status="value" />
        </template>
        <template #cell-submittedAt="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-actions="{ row }">
          <div class="action-btns">
            <button class="btn-approve" :disabled="row._busy" @click="approveRoute(row)">
              <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-reject" :disabled="row._busy" @click="openReject(row)">
              <i class="fas fa-times"></i> Reject
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- REJECTION MODAL -->
    <Teleport to="body">
      <div v-if="rejectModal" class="modal-overlay" @click.self="rejectModal = null">
        <div class="modal-box">
          <h3>Reject Route Request</h3>
          <p class="modal-sub">Provide a reason for rejecting "{{ rejectModal.routeName }}"</p>
          <textarea
            v-model="rejectReason"
            class="modal-textarea"
            rows="4"
            placeholder="Reason for rejection..."
          ></textarea>
          <div class="modal-actions">
            <button class="btn-secondary" @click="rejectModal = null">Cancel</button>
            <button class="btn-danger" :disabled="!rejectReason.trim() || rejecting" @click="confirmReject">
              <i v-if="rejecting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Reject</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </PortalLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { routeService } from '../../services/routeService.js'
import { routeApprovalService } from '../../services/routeApprovalService.js'
import { companyService } from '../../services/companyService.js'
import { auditLogService } from '../../services/auditLogService.js'

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

const tab = ref('all')

const routeColumns = [
  { key: 'name', label: 'Route Name' },
  { key: 'companyName', label: 'Company' },
  { key: 'origin', label: 'Origin' },
  { key: 'destination', label: 'Destination' },
  { key: 'isActive', label: 'Status', width: '100px' },
]

const approvalColumns = [
  { key: 'routeName', label: 'Route' },
  { key: 'companyName', label: 'Company' },
  { key: 'submittedAt', label: 'Submitted', width: '130px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'actions', label: 'Actions', width: '220px' },
]

const allRoutes = ref([])
const loadingRoutes = ref(true)
const routeError = ref('')

const pendingApprovals = ref([])
const loadingApprovals = ref(true)
const approvalError = ref('')

const rejectModal = ref(null)
const rejectReason = ref('')
const rejecting = ref(false)

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadRoutes() {
  loadingRoutes.value = true
  routeError.value = ''
  try {
    const [rts, companies] = await Promise.all([
      routeService.getAll(),
      companyService.getAll(),
    ])
    const compMap = Object.fromEntries(companies.map(c => [c.id, c.name]))
    allRoutes.value = rts.map(r => ({ ...r, companyName: compMap[r.companyId] || '—' }))
  } catch (e) {
    routeError.value = e.message || 'Failed to load routes'
  } finally {
    loadingRoutes.value = false
  }
}

async function loadApprovals() {
  loadingApprovals.value = true
  approvalError.value = ''
  try {
    const [pending, companies] = await Promise.all([
      routeApprovalService.getPending(),
      companyService.getAll(),
    ])
    const compMap = Object.fromEntries(companies.map(c => [c.id, c.name]))
    pendingApprovals.value = pending.map(a => ({ ...a, companyName: compMap[a.companyId] || '—' }))
  } catch (e) {
    approvalError.value = e.message || 'Failed to load approvals'
  } finally {
    loadingApprovals.value = false
  }
}

async function approveRoute(row) {
  row._busy = true
  try {
    await routeApprovalService.approve(row.id, auth.userId.value)
    await auditLogService.log(
      auth.userId.value, 'rura', row.companyId,
      'approve_route', 'routeApproval', row.id,
      `Approved route "${row.routeName}"`
    )
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== row.id)
  } catch {} finally { row._busy = false }
}

function openReject(row) {
  rejectModal.value = row
  rejectReason.value = ''
}

async function confirmReject() {
  if (!rejectReason.value.trim()) return
  rejecting.value = true
  try {
    await routeApprovalService.reject(rejectModal.value.id, auth.userId.value, rejectReason.value.trim())
    await auditLogService.log(
      auth.userId.value, 'rura', rejectModal.value.companyId,
      'reject_route', 'routeApproval', rejectModal.value.id,
      `Rejected route "${rejectModal.value.routeName}": ${rejectReason.value.trim()}`
    )
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== rejectModal.value.id)
    rejectModal.value = null
  } catch {} finally { rejecting.value = false }
}

onMounted(() => {
  loadRoutes()
  loadApprovals()
})
</script>

<style scoped>
.tab-bar {
  display: flex; gap: 4px; margin-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.tab-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 18px; border: none; background: transparent;
  color: rgba(255,255,255,0.4); font-size: 14px; font-weight: 500;
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.15s; margin-bottom: -1px;
}
.tab-btn:hover { color: rgba(255,255,255,0.7); }
.tab-btn.active { color: #22c55e; border-bottom-color: #22c55e; }
.tab-badge {
  background: #22c55e; color: #fff; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px; min-width: 20px; text-align: center;
}

.action-btns { display: flex; gap: 8px; }
.btn-approve, .btn-reject {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-approve { background: rgba(34,197,94,0.12); color: #22c55e; }
.btn-approve:hover { background: rgba(34,197,94,0.25); }
.btn-reject { background: rgba(239,68,68,0.12); color: #ef4444; }
.btn-reject:hover { background: rgba(239,68,68,0.25); }
.btn-approve:disabled, .btn-reject:disabled { opacity: 0.4; cursor: not-allowed; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 24px;
}
.modal-box {
  background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 28px; width: 100%; max-width: 460px;
}
.modal-box h3 { margin: 0 0 6px; font-size: 18px; }
.modal-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0 0 16px; }
.modal-textarea {
  width: 100%; padding: 12px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1); background: #0a0a0a;
  color: rgba(255,255,255,0.85); font-size: 14px; resize: vertical;
  outline: none; box-sizing: border-box; font-family: inherit;
}
.modal-textarea:focus { border-color: #22c55e; }
.modal-textarea::placeholder { color: rgba(255,255,255,0.2); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }

.btn-secondary {
  padding: 10px 20px; background: transparent; color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  font-size: 14px; font-weight: 500; cursor: pointer;
}
.btn-secondary:hover { background: rgba(255,255,255,0.04); }

.btn-danger {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; background: #ef4444; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; min-height: 42px;
}
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
