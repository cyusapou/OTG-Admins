<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Managers"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="page-actions">
      <router-link to="/express/managers/new" class="btn-primary">
        <i class="fas fa-plus"></i> Create Manager
      </router-link>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      emptyIcon="fas fa-user-tie"
      emptyTitle="No managers yet"
      emptySubtitle="Create your first depot manager to get started"
      :onRowClick="openDetail"
      @retry="loadData"
    >
      <template #empty-action>
        <router-link to="/express/managers/new" class="btn-primary">
          <i class="fas fa-plus"></i> Create Manager
        </router-link>
      </template>
      <template #cell-name="{ row }">
        <span class="name-cell">{{ row.firstName }} {{ row.lastName }}</span>
      </template>
      <template #cell-depot="{ row }">
        {{ row.depotName || '—' }}
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.isActive !== false ? 'active' : 'inactive'" />
      </template>
    </DataTable>

    <!-- Manager Detail Modal -->
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
              <span class="role-badge">Manager</span>
              <StatusBadge :status="selected.isActive !== false ? 'active' : 'inactive'" />
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-envelope"></i> Email</span>
              <span class="detail-value">{{ selected.email || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-phone"></i> Phone</span>
              <span class="detail-value">{{ selected.phone || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-user"></i> Username</span>
              <span class="detail-value mono">{{ selected.username || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-warehouse"></i> Depot</span>
              <span class="detail-value">{{ selected.depotName || 'Not assigned' }}</span>
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
import { depotService } from '../../services/depotService.js'
import { notificationService } from '../../services/notificationService.js'
import { companyService } from '../../services/companyService.js'
import { auditLogService } from '../../services/auditLogService.js'
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

const selected = ref(null)
const actionLoading = ref(false)
const actionMsg = ref('')
const actionSuccess = ref(false)

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'depot', label: 'Depot' },
  { key: 'status', label: 'Status', width: '100px' },
]

function openDetail(row) {
  selected.value = row
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
    await auditLogService.log(
      auth.userId.value, 'express_admin', cid.value,
      'reset_password', 'user', selected.value.id,
      `Reset password for ${selected.value.firstName} ${selected.value.lastName}`
    )
    actionSuccess.value = true
    actionMsg.value = `Password reset. New temp password: ${tempPw}`
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
    await auditLogService.log(
      auth.userId.value, 'express_admin', cid.value,
      nowActive ? 'deactivated_user' : 'reactivated_user', 'user', selected.value.id,
      `${nowActive ? 'Deactivated' : 'Reactivated'} manager ${selected.value.firstName}`
    )
    selected.value.isActive = !nowActive
    const row = rows.value.find(r => r.id === selected.value.id)
    if (row) row.isActive = !nowActive
    actionSuccess.value = true
    actionMsg.value = nowActive ? 'Manager deactivated' : 'Manager reactivated'
  } catch {
    actionSuccess.value = false
    actionMsg.value = 'Action failed'
  } finally {
    actionLoading.value = false
  }
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [managers, depots, notifs, company] = await Promise.all([
      userService.getAll({ companyId: cid.value, role: 'manager' }),
      depotService.getByCompany(cid.value),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])
    const depotMap = Object.fromEntries(depots.map(d => [d.id, d.name]))
    rows.value = managers.map(m => ({ ...m, depotName: depotMap[m.depotId] || '' }))
    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch {
    error.value = 'Failed to load managers'
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  background: #22c55e;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
.name-cell { font-weight: 600; color: rgba(255,255,255,0.9); }

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
}
.detail-value.mono {
  font-family: 'Courier New', monospace;
  color: #22c55e;
}

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

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 520px) {
  .detail-grid { grid-template-columns: 1fr; }
  .modal-actions { flex-direction: column; }
}
</style>
