<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Expenses"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="page-actions">
      <button class="btn-primary" @click="showModal = true">
        <i class="fas fa-plus"></i> Log Expense
      </button>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :error="error"
      empty-icon="fas fa-receipt"
      empty-title="No expenses recorded"
      empty-subtitle="Log your first expense to get started"
      @retry="loadExpenses"
    >
      <template #empty-action>
        <button class="btn-add" @click="showModal = true">
          <i class="fas fa-plus"></i> Log Expense
        </button>
      </template>

      <template #cell-amount="{ row }">
        <span class="amount">{{ row.amount.toLocaleString() }} RWF</span>
      </template>

      <template #cell-category="{ row }">
        <span class="category-badge">{{ row.category }}</span>
      </template>
    </DataTable>

    <teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Log Expense</h3>
            <button class="modal-close" @click="showModal = false"><i class="fas fa-times"></i></button>
          </div>

          <form @submit.prevent="handleSubmitExpense">
            <div class="modal-field">
              <label>Category</label>
              <select v-model="expForm.category" required>
                <option value="">Select category...</option>
                <option value="fuel">Fuel</option>
                <option value="maintenance">Maintenance</option>
                <option value="salary_advance">Salary Advance</option>
                <option value="insurance">Insurance</option>
                <option value="tolls">Tolls & Parking</option>
                <option value="cleaning">Cleaning</option>
                <option value="office">Office Supplies</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Description</label>
              <input v-model="expForm.description" type="text" required placeholder="Describe the expense" />
            </div>
            <div class="modal-field">
              <label>Amount (RWF)</label>
              <input v-model.number="expForm.amount" type="number" required placeholder="0" min="1" />
            </div>
            <div class="modal-field">
              <label>Date</label>
              <input v-model="expForm.date" type="date" required />
            </div>
            <div class="modal-field">
              <label>Bus (optional)</label>
              <select v-model="expForm.busId">
                <option value="">No specific bus</option>
                <option v-for="bus in depotBuses" :key="bus.id" :value="bus.id">
                  {{ bus.plateNumber }}
                </option>
              </select>
            </div>

            <p v-if="expError" class="modal-error">{{ expError }}</p>

            <button type="submit" class="btn-primary btn-full" :disabled="submitting">
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Save Expense</span>
            </button>
          </form>
        </div>
      </div>
    </teleport>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import { useAuth } from '../../composables/useAuth.js'
import { expenseService } from '../../services/expenseService.js'
import { busService } from '../../services/busService.js'
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
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'busPlate', label: 'Bus' },
]

const loading = ref(true)
const error = ref('')
const rows = ref([])
const unreadCount = ref(0)
const depotBuses = ref([])
const showModal = ref(false)
const submitting = ref(false)
const expError = ref('')

const expForm = ref({
  category: '',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  busId: '',
})

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

async function loadExpenses() {
  loading.value = true
  error.value = ''
  try {
    const depotId = auth.depotId.value

    const [expenses, buses, notifications] = await Promise.all([
      expenseService.getByDepot(depotId),
      busService.getAll({ depotId }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length
    depotBuses.value = buses

    const busMap = {}
    buses.forEach(b => { busMap[b.id] = b })

    rows.value = expenses.map(e => ({
      id: e.id,
      date: e.date || e.createdAt?.split('T')[0] || '—',
      category: (e.category || 'other').replace(/_/g, ' '),
      description: e.description || '—',
      amount: e.amount || 0,
      busPlate: e.busId ? (busMap[e.busId]?.plateNumber || '—') : '—',
    }))
  } catch {
    error.value = 'Failed to load expenses. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleSubmitExpense() {
  expError.value = ''
  submitting.value = true
  try {
    const depotId = auth.depotId.value
    const companyId = auth.companyId.value
    const now = new Date().toISOString()

    await expenseService.create({
      companyId,
      depotId,
      category: expForm.value.category,
      description: expForm.value.description,
      amount: expForm.value.amount,
      date: expForm.value.date,
      busId: expForm.value.busId || null,
      createdBy: auth.userId.value,
      createdAt: now,
    })

    showModal.value = false
    expForm.value = {
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      busId: '',
    }
    await loadExpenses()
  } catch {
    expError.value = 'Failed to save expense. Please try again.'
  } finally {
    submitting.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadExpenses)
</script>

<style scoped>
.page-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.amount { font-weight: 600; color: rgba(255,255,255,0.9); }
.category-badge { text-transform: capitalize; }

.btn-primary {
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
.btn-primary:hover:not(:disabled) { background: #16a34a; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-full { width: 100%; justify-content: center; min-height: 46px; }

.btn-add {
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
}
.btn-add:hover { background: #16a34a; }

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
  max-width: 460px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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

.modal-field { margin-bottom: 16px; }
.modal-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
}
.modal-field input, .modal-field select {
  width: 100%;
  padding: 12px 14px;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.modal-field input:focus, .modal-field select:focus { border-color: #22c55e; }
.modal-field input::placeholder { color: rgba(255,255,255,0.2); }
.modal-field select { cursor: pointer; }
.modal-field select option { background: #141414; color: rgba(255,255,255,0.85); }

.modal-error { color: #ef4444; font-size: 13px; margin-bottom: 12px; }
</style>
