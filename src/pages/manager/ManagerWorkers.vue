<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Workers"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-hard-hat"
      empty-title="No workers yet"
      empty-subtitle="Add your first worker to get started"
      :onRowClick="openDetail"
      @retry="loadWorkers"
    >
      <template #empty-action>
        <router-link to="/manager/workers/new" class="btn-add">
          <i class="fas fa-plus"></i> Add Worker
        </router-link>
      </template>

      <template #cell-name="{ row }">
        <span class="worker-name">{{ row.name }}</span>
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :status="row.isActive !== false ? 'active' : 'inactive'" />
      </template>

      <template #cell-actions="{ row }">
        <button
          v-if="row.isActive !== false"
          type="button"
          class="btn-remove"
          :disabled="row._removing"
          @click.stop="handleRemoveWorker(row)"
          title="Remove worker"
        >
          <i v-if="row._removing" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-user-minus"></i>
        </button>
        <span v-else class="inactive-label">Inactive</span>
      </template>
    </DataTable>

    <router-link to="/manager/workers/new" class="fab">
      <i class="fas fa-plus"></i>
    </router-link>

    <!-- Worker Detail Modal -->
    <Teleport to="body">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-card">
          <button class="modal-close" @click="selected = null">
            <i class="fas fa-times"></i>
          </button>

          <div class="modal-header">
            <div class="avatar">{{ initials(selected) }}</div>
            <div>
              <h2>{{ selected.firstName }} {{ selected.lastName }}</h2>
              <span class="role-badge">Worker</span>
              <StatusBadge :status="selected.isActive !== false ? 'active' : 'inactive'" />
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-phone"></i> Phone</span>
              <span class="detail-value">{{ selected.phone || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-user"></i> Username</span>
              <span class="detail-value mono">{{ selected.username || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-lock"></i> Password</span>
              <span class="detail-value mono">
                <template v-if="showPassword">{{ selected.password }}</template>
                <template v-else>••••••••</template>
                <button class="toggle-pw" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-bus"></i> Assigned Bus</span>
              <span class="detail-value">{{ selected.assignedBus || 'Not assigned' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-calendar"></i> Created</span>
              <span class="detail-value">{{ formatDate(selected.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-clock"></i> Last Login</span>
              <span class="detail-value">{{ selected.lastLoginAt ? formatDate(selected.lastLoginAt) : 'Never' }}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-outline" @click="resetPassword" :disabled="actionLoading">
              <i class="fas fa-key"></i> Reset Password
            </button>
            <button
              :class="selected.isActive !== false ? 'btn-danger' : 'btn-primary'"
              @click="toggleActive"
              :disabled="actionLoading"
            >
              <i :class="selected.isActive !== false ? 'fas fa-ban' : 'fas fa-check'"></i>
              {{ selected.isActive !== false ? 'Deactivate' : 'Reactivate' }}
            </button>
          </div>

          <p v-if="actionMsg" class="action-msg" :class="{ success: actionSuccess }">
            {{ actionMsg }}
          </p>
        </div>
      </div>
    </Teleport>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { userService } from '../../services/userService.js'
import { workerService } from '../../services/workerService.js'
import { notificationService } from '../../services/notificationService.js'
import { auditLogService } from '../../services/auditLogService.js'

import { navItems } from './managerNav.js'

const auth = useAuth()

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'username', label: 'Username' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', width: '90px' },
]

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)
const selected = ref(null)
const showPassword = ref(false)
const actionLoading = ref(false)
const actionMsg = ref('')
const actionSuccess = ref(false)

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

function openDetail(row) {
  selected.value = row
  showPassword.value = false
  actionMsg.value = ''
}

function initials(user) {
  return ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function resetPassword() {
  actionLoading.value = true
  actionMsg.value = ''
  try {
    const tempPw = 'reset' + Math.random().toString(36).slice(2, 8)
    await userService.patch(selected.value.id, {
      password: tempPw,
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    })
    selected.value.password = tempPw
    showPassword.value = true
    await auditLogService.log(
      auth.userId.value, 'manager', auth.companyId.value,
      'reset_password', 'user', selected.value.id,
      `Reset password for worker ${selected.value.firstName} ${selected.value.lastName}`
    )
    actionSuccess.value = true
    actionMsg.value = `Password reset to: ${tempPw}`
  } catch {
    actionSuccess.value = false
    actionMsg.value = 'Failed to reset password'
  } finally {
    actionLoading.value = false
  }
}

async function toggleActive() {
  actionLoading.value = true
  actionMsg.value = ''
  const nowActive = selected.value.isActive !== false
  try {
    await userService.patch(selected.value.id, {
      isActive: !nowActive,
      updatedAt: new Date().toISOString(),
    })
    selected.value.isActive = !nowActive
    const row = rows.value.find(r => r.id === selected.value.id)
    if (row) row.isActive = !nowActive
    await auditLogService.log(
      auth.userId.value, 'manager', auth.companyId.value,
      nowActive ? 'deactivated_user' : 'reactivated_user', 'user', selected.value.id,
      `${nowActive ? 'Deactivated' : 'Reactivated'} worker ${selected.value.firstName}`
    )
    actionSuccess.value = true
    actionMsg.value = nowActive ? 'Worker deactivated' : 'Worker reactivated'
  } catch {
    actionSuccess.value = false
    actionMsg.value = 'Action failed'
  } finally {
    actionLoading.value = false
  }
}

async function handleRemoveWorker(row) {
  if (!confirm(`Remove ${row.name} from workers? They will be deactivated.`)) return
  row._removing = true
  try {
    await userService.patch(row.id, { isActive: false, status: 'inactive' })
    await loadWorkers()
  } catch {
    error.value = 'Failed to remove worker'
  } finally {
    row._removing = false
  }
}

async function loadWorkers() {
  loading.value = true
  error.value = ''
  try {
    const depotId = auth.depotId.value
    const companyId = auth.companyId.value

    const [workerUsers, workerRecords, notifications] = await Promise.all([
      userService.getAll({ role: 'worker', companyId }),
      workerService.getAll({ companyId }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    const workerMap = {}
    workerRecords.forEach(w => { workerMap[w.userId] = w })

    rows.value = workerUsers.map(u => {
      const rec = workerMap[u.id] || {}
      return {
        ...u,
        name: `${u.firstName} ${u.lastName}`,
        assignedBus: rec.busPlate || '—',
      }
    })
  } catch {
    error.value = 'Failed to load workers. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadWorkers)
</script>

<style scoped>
.worker-name { font-weight: 600; color: rgba(255,255,255,0.9); }

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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
}
.modal-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 520px;
  position: relative;
  animation: slideUp 0.2s ease;
}
.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}
.modal-close:hover { background: rgba(255,255,255,0.05); color: #fff; }

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(34,197,94,0.15);
  color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}
.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px;
  color: rgba(255,255,255,0.9);
}
.role-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(34,197,94,0.12);
  color: #22c55e;
  padding: 3px 10px;
  border-radius: 6px;
  margin-right: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 28px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  display: flex;
  align-items: center;
  gap: 6px;
}
.detail-label i { width: 14px; text-align: center; }
.detail-value {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-value.mono {
  font-family: 'Courier New', monospace;
  color: #22c55e;
}
.toggle-pw {
  background: none;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  font-size: 13px;
  padding: 2px;
  transition: color 0.15s;
}
.toggle-pw:hover { color: rgba(255,255,255,0.7); }

.modal-actions {
  display: flex;
  gap: 12px;
}
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-outline:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
.btn-outline:disabled, .btn-danger:disabled, .btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  background: #22c55e;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  background: #ef4444;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover { background: #dc2626; }

.action-msg {
  margin-top: 16px;
  font-size: 13px;
  color: #ef4444;
  padding: 10px 14px;
  background: rgba(239,68,68,0.08);
  border-radius: 8px;
}
.action-msg.success {
  color: #22c55e;
  background: rgba(34,197,94,0.08);
}

.btn-remove {
  padding: 6px 12px; border-radius: 8px; border: none;
  background: rgba(239,68,68,0.12); color: #ef4444; cursor: pointer;
  font-size: 13px; transition: background 0.15s;
}
.btn-remove:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
.btn-remove:disabled { opacity: 0.6; cursor: not-allowed; }
.inactive-label { font-size: 12px; color: rgba(255,255,255,0.35); }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 520px) {
  .detail-grid { grid-template-columns: 1fr; }
  .modal-actions { flex-direction: column; }
}
</style>
