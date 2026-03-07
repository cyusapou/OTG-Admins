<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Salaries"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="page-actions">
      <span class="month-label">{{ currentMonthLabel }}</span>
      <button
        v-if="pendingCount > 0"
        class="btn-pay-all"
        :disabled="payingAll"
        @click="handlePayAll"
      >
        <i v-if="payingAll" class="fas fa-spinner fa-spin"></i>
        <template v-else><i class="fas fa-check-double"></i> Pay All Pending ({{ pendingCount }})</template>
      </button>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-money-bill-wave"
      empty-title="No salary records"
      empty-subtitle="Salary records for this month will appear here"
      @retry="loadSalaries"
    >
      <template #cell-name="{ row }">
        <span class="emp-name">{{ row.name }}</span>
      </template>

      <template #cell-role="{ row }">
        <span class="role-label">{{ row.role }}</span>
      </template>

      <template #cell-amount="{ row }">
        <span class="amount">{{ row.amount.toLocaleString() }} RWF</span>
      </template>

      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>

      <template #cell-actions="{ row }">
        <button
          v-if="row.status === 'pending'"
          class="btn-mark-paid"
          :disabled="row._paying"
          @click="handleMarkPaid(row)"
        >
          <i v-if="row._paying" class="fas fa-spinner fa-spin"></i>
          <span v-else>Mark Paid</span>
        </button>
        <span v-else class="paid-label"><i class="fas fa-check"></i> Paid</span>
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
import { salaryService } from '../../services/salaryService.js'
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
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', width: '140px' },
]

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)
const payingAll = ref(false)

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const currentMonth = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

const currentMonthLabel = computed(() => {
  const d = new Date()
  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
})

const pendingCount = computed(() => rows.value.filter(r => r.status === 'pending').length)

async function loadSalaries() {
  loading.value = true
  error.value = ''
  try {
    const depotId = auth.depotId.value

    const [salaries, notifications] = await Promise.all([
      salaryService.getByDepot(depotId, currentMonth.value),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    rows.value = salaries.map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.name || '—',
      role: (s.role || '').charAt(0).toUpperCase() + (s.role || '').slice(1),
      amount: s.amount || 0,
      status: s.status || 'pending',
      _paying: false,
    }))
  } catch {
    error.value = 'Failed to load salaries. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleMarkPaid(row) {
  row._paying = true
  try {
    await salaryService.markPaid(row.id, auth.userId.value)
    row.status = 'paid'
  } catch {
    row._paying = false
  }
}

async function handlePayAll() {
  payingAll.value = true
  const pending = rows.value.filter(r => r.status === 'pending')
  try {
    await Promise.all(pending.map(r => salaryService.markPaid(r.id, auth.userId.value)))
    pending.forEach(r => { r.status = 'paid' })
  } catch {} finally {
    payingAll.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadSalaries)
</script>

<style scoped>
.page-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.month-label {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
}

.emp-name { font-weight: 600; }
.role-label { text-transform: capitalize; color: rgba(255,255,255,0.55); }
.amount { font-weight: 600; color: rgba(255,255,255,0.9); }

.btn-mark-paid {
  padding: 6px 14px;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 8px;
  color: #22c55e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-mark-paid:hover:not(:disabled) { background: rgba(34,197,94,0.2); }
.btn-mark-paid:disabled { opacity: 0.5; cursor: not-allowed; }

.paid-label {
  font-size: 12px;
  color: #22c55e;
  font-weight: 500;
}

.btn-pay-all {
  padding: 10px 20px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.btn-pay-all:hover:not(:disabled) { background: #16a34a; }
.btn-pay-all:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
