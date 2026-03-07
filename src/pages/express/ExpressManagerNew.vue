<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Create Manager"
    :userName="userName"
    :companyName="companyName"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div v-if="created" class="success-card">
      <div class="success-icon"><i class="fas fa-check-circle"></i></div>
      <h2>Manager Created</h2>
      <p>Share these credentials securely. They will need to change the password on first login.</p>
      <div class="creds-box">
        <div class="cred-row"><span class="cred-label">Username</span><span class="cred-val">{{ createdCreds.username }}</span></div>
        <div class="cred-row"><span class="cred-label">Temp Password</span><span class="cred-val">{{ createdCreds.password }}</span></div>
      </div>
      <div class="success-actions">
        <router-link to="/express/managers" class="btn-secondary">Back to Managers</router-link>
        <button class="btn-primary" @click="resetForm">Create Another</button>
      </div>
    </div>

    <form v-else class="form-card" @submit.prevent="handleSubmit">
      <router-link to="/express/managers" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Managers
      </router-link>

      <div class="form-grid">
        <div class="field">
          <label>First Name</label>
          <input v-model="form.firstName" required placeholder="First name" />
        </div>
        <div class="field">
          <label>Last Name</label>
          <input v-model="form.lastName" required placeholder="Last name" />
        </div>
        <div class="field">
          <label>Phone</label>
          <input v-model="form.phone" type="tel" required placeholder="07X XXX XXXX" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" required placeholder="email@example.com" />
        </div>
        <div class="field">
          <label>Depot</label>
          <select v-model="form.depotId">
            <option value="">No depot (optional)</option>
            <option v-for="d in depots" :key="d.id" :value="d.id">{{ d.name }} — {{ d.city }}</option>
          </select>
        </div>
        <div class="field">
          <label>Username</label>
          <input v-model="form.username" required placeholder="Username for login" />
        </div>
        <div class="field">
          <label>Temporary Password</label>
          <input v-model="form.tempPassword" required placeholder="Temp password" minlength="6" />
        </div>
      </div>

      <p v-if="error" class="form-error"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>

      <div class="form-actions">
        <router-link to="/express/managers" class="btn-secondary">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <span v-else>Create Manager</span>
        </button>
      </div>
    </form>
  </PortalLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import { useAuth } from '../../composables/useAuth.js'
import { userService } from '../../services/userService.js'
import { depotService } from '../../services/depotService.js'
import { auditLogService } from '../../services/auditLogService.js'
import { companyService } from '../../services/companyService.js'
import { navItems } from './expressNav.js'

const router = useRouter()
const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const depots = ref([])
const saving = ref(false)
const error = ref('')
const created = ref(false)
const createdCreds = reactive({ username: '', password: '' })
const companyName = ref('')
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const form = reactive({
  firstName: '', lastName: '', phone: '', email: '',
  depotId: '', username: '', tempPassword: '',
})

function resetForm() {
  Object.assign(form, { firstName: '', lastName: '', phone: '', email: '', depotId: '', username: '', tempPassword: '' })
  created.value = false
  error.value = ''
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const user = await userService.create({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      username: form.username,
      password: form.tempPassword,
      role: 'manager',
      companyId: cid.value,
      depotId: form.depotId || null,
      mustChangePassword: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    if (form.depotId) {
      await depotService.patch(form.depotId, { managerId: user.id })
    }

    await auditLogService.log(
      auth.userId.value, 'express_admin', cid.value,
      'create', 'user', user.id,
      `Created manager ${form.firstName} ${form.lastName}`
    )

    createdCreds.username = form.username
    createdCreds.password = form.tempPassword
    created.value = true
  } catch {
    error.value = 'Failed to create manager. Check if username already exists.'
  } finally {
    saving.value = false
  }
}

function handleLogout() { auth.logout('/express/login') }

onMounted(async () => {
  try {
    const [d, company] = await Promise.all([
      depotService.getByCompany(cid.value),
      companyService.getById(cid.value),
    ])
    depots.value = d
    companyName.value = company?.name || ''
  } catch {}
})
</script>

<style scoped>
.form-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 28px;
  max-width: 720px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.4);
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
}

.field { display: flex; flex-direction: column; }
.field label {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
  font-weight: 500;
}
.field input, .field select {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0a0a0a;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.field input:focus, .field select:focus {
  border-color: #22c55e;
}
.field input::placeholder { color: rgba(255,255,255,0.2); }
.field select option { background: #141414; color: rgba(255,255,255,0.85); }

.form-error {
  color: #ef4444;
  font-size: 13px;
  margin-top: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 10px;
  background: #22c55e;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 10px 24px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-secondary:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }

.success-card {
  background: #141414;
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 14px;
  padding: 40px 28px;
  max-width: 520px;
  text-align: center;
}

.success-icon {
  font-size: 48px;
  color: #22c55e;
  margin-bottom: 16px;
}

.success-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
  color: rgba(255,255,255,0.9);
}

.success-card > p {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  margin: 0 0 24px;
}

.creds-box {
  background: #0a0a0a;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.cred-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.cred-row + .cred-row {
  border-top: 1px solid rgba(255,255,255,0.05);
}

.cred-label {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
}

.cred-val {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
  font-family: monospace;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
