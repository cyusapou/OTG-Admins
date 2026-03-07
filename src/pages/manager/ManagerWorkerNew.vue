<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Add Worker"
    :user-name="userName"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div v-if="created" class="success-card">
      <div class="success-icon"><i class="fas fa-check-circle"></i></div>
      <h2>Worker Created</h2>
      <p>Share these credentials with the worker:</p>
      <div class="credentials">
        <div class="cred-row">
          <span class="cred-label">Username</span>
          <span class="cred-value">{{ createdCreds.username }}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temp Password</span>
          <span class="cred-value">{{ createdCreds.password }}</span>
        </div>
      </div>
      <div class="success-actions">
        <router-link to="/manager/workers" class="btn-secondary">Back to Workers</router-link>
        <button class="btn-primary" @click="resetForm">Add Another</button>
      </div>
    </div>

    <form v-else class="form-card" @submit.prevent="handleSubmit">
      <router-link to="/manager/workers" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Workers
      </router-link>

      <div class="form-grid">
        <div class="field">
          <label>First Name</label>
          <input v-model="form.firstName" type="text" required placeholder="Jane" />
        </div>
        <div class="field">
          <label>Last Name</label>
          <input v-model="form.lastName" type="text" required placeholder="Doe" />
        </div>
        <div class="field">
          <label>Phone Number</label>
          <input v-model="form.phone" type="tel" required placeholder="+250 7XX XXX XXX" />
        </div>
        <div class="field">
          <label>Username</label>
          <input v-model="form.username" type="text" required placeholder="jane.doe" />
        </div>
        <div class="field">
          <label>Temp Password</label>
          <input v-model="form.tempPassword" type="text" required placeholder="Min 6 characters" minlength="6" />
        </div>
        <div class="field">
          <label>Monthly Salary (RWF)</label>
          <input v-model.number="form.monthlySalary" type="number" required placeholder="120000" min="0" />
        </div>
      </div>

      <p v-if="error" class="form-error"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>

      <button type="submit" class="btn-primary btn-submit" :disabled="submitting">
        <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
        <span v-else><i class="fas fa-plus"></i> Create Worker</span>
      </button>
    </form>
  </PortalLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import { useAuth } from '../../composables/useAuth.js'
import { userService } from '../../services/userService.js'
import { workerService } from '../../services/workerService.js'
import { salaryService } from '../../services/salaryService.js'

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

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  username: '',
  tempPassword: '',
  monthlySalary: '',
})

const submitting = ref(false)
const error = ref('')
const created = ref(false)
const createdCreds = ref({ username: '', password: '' })

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    const depotId = auth.depotId.value
    const companyId = auth.companyId.value
    const now = new Date().toISOString()

    const user = await userService.create({
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      phone: form.value.phone,
      username: form.value.username,
      password: form.value.tempPassword,
      role: 'worker',
      companyId,
      depotId,
      status: 'active',
      mustChangePassword: true,
      createdAt: now,
      updatedAt: now,
    })

    await workerService.create({
      userId: user.id,
      companyId,
      depotId,
      status: 'active',
      createdAt: now,
    })

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    await salaryService.create({
      userId: user.id,
      companyId,
      depotId,
      role: 'worker',
      name: `${form.value.firstName} ${form.value.lastName}`,
      amount: form.value.monthlySalary,
      month: currentMonth,
      status: 'pending',
      createdAt: now,
    })

    createdCreds.value = { username: form.value.username, password: form.value.tempPassword }
    created.value = true
  } catch (e) {
    error.value = e.message || 'Failed to create worker. Please try again.'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = {
    firstName: '', lastName: '', phone: '',
    username: '', tempPassword: '', monthlySalary: '',
  }
  created.value = false
  error.value = ''
}

function handleLogout() {
  auth.logout('/manager/login')
}
</script>

<style scoped>
.form-card { max-width: 720px; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.45);
  text-decoration: none;
  font-size: 13px;
  margin-bottom: 24px;
  transition: color 0.15s;
}
.back-link:hover { color: #22c55e; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 24px;
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 12px 14px;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.field input:focus { border-color: #22c55e; }
.field input::placeholder { color: rgba(255,255,255,0.2); }

.form-error {
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  padding: 12px 24px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #16a34a; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-submit { min-height: 48px; }

.success-card { max-width: 480px; text-align: center; }
.success-icon { font-size: 56px; color: #22c55e; margin-bottom: 16px; }
.success-card h2 { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0 0 8px; }
.success-card > p { font-size: 14px; color: rgba(255,255,255,0.4); margin: 0 0 24px; }

.credentials {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}
.cred-row { display: flex; justify-content: space-between; padding: 8px 0; }
.cred-row + .cred-row { border-top: 1px solid rgba(255,255,255,0.05); }
.cred-label { font-size: 13px; color: rgba(255,255,255,0.4); }
.cred-value { font-size: 14px; font-weight: 600; color: #22c55e; font-family: monospace; }

.success-actions { display: flex; gap: 12px; justify-content: center; }
.btn-secondary {
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-secondary:hover { border-color: rgba(255,255,255,0.25); color: #fff; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
