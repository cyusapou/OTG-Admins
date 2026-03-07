<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Register Company"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div v-if="created" class="success-screen">
      <div class="success-icon"><i class="fas fa-check-circle"></i></div>
      <h2>Company Registered</h2>
      <p class="success-sub">{{ form.companyName }} has been registered successfully.</p>

      <div class="credentials-card">
        <h4>Express Admin Credentials</h4>
        <p class="cred-note">Share these with the company administrator. They will be prompted to change their password on first login.</p>
        <div class="cred-row">
          <span class="cred-label">Username</span>
          <span class="cred-value">{{ form.adminUsername }}</span>
          <button class="copy-btn" @click="copy(form.adminUsername)"><i class="fas fa-copy"></i></button>
        </div>
        <div class="cred-row">
          <span class="cred-label">Password</span>
          <span class="cred-value">{{ form.adminPassword }}</span>
          <button class="copy-btn" @click="copy(form.adminPassword)"><i class="fas fa-copy"></i></button>
        </div>
      </div>

      <div class="success-actions">
        <router-link to="/rura/companies" class="btn-secondary">View Companies</router-link>
        <button class="btn-primary" @click="resetForm">Register Another</button>
      </div>
    </div>

    <form v-else class="reg-form" @submit.prevent="handleSubmit">
      <div class="form-section">
        <h3>Company Information</h3>
        <div class="form-grid">
          <div class="field">
            <label>Company Name *</label>
            <input v-model="form.companyName" type="text" required placeholder="e.g. Swift Transit Ltd" />
          </div>
          <div class="field">
            <label>Registration Number</label>
            <input v-model="form.registrationNumber" type="text" placeholder="e.g. RCA-2024-001" />
          </div>
          <div class="field">
            <label>Phone</label>
            <input v-model="form.phone" type="tel" placeholder="+250 7XX XXX XXX" />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="info@company.rw" />
          </div>
          <div class="field full">
            <label>Address</label>
            <input v-model="form.address" type="text" placeholder="Kigali, Rwanda" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Express Admin Account</h3>
        <p class="section-note">This account will manage the company on the platform.</p>
        <div class="form-grid">
          <div class="field">
            <label>Admin First Name *</label>
            <input v-model="form.adminFirstName" type="text" required placeholder="Jean" />
          </div>
          <div class="field">
            <label>Admin Last Name *</label>
            <input v-model="form.adminLastName" type="text" required placeholder="Doe" />
          </div>
          <div class="field">
            <label>Username *</label>
            <input v-model="form.adminUsername" type="text" required placeholder="jdoe" />
          </div>
          <div class="field">
            <label>Temporary Password *</label>
            <div class="pw-field">
              <input v-model="form.adminPassword" :type="showPw ? 'text' : 'password'" required minlength="6" placeholder="Min 6 characters" />
              <button type="button" class="pw-toggle" @click="showPw = !showPw">
                <i :class="showPw ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          <div class="field">
            <label>Admin Email</label>
            <input v-model="form.adminEmail" type="email" placeholder="admin@company.rw" />
          </div>
          <div class="field">
            <label>Admin Phone</label>
            <input v-model="form.adminPhone" type="tel" placeholder="+250 7XX XXX XXX" />
          </div>
        </div>
      </div>

      <p v-if="submitError" class="form-error">
        <i class="fas fa-exclamation-circle"></i> {{ submitError }}
      </p>

      <div class="form-actions">
        <router-link to="/rura/companies" class="btn-secondary">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="submitting">
          <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
          <span v-else>Register Company</span>
        </button>
      </div>
    </form>
  </PortalLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import { useAuth } from '../../composables/useAuth.js'
import { companyService } from '../../services/companyService.js'
import { userService } from '../../services/userService.js'
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

const defaultForm = () => ({
  companyName: '',
  registrationNumber: '',
  phone: '',
  email: '',
  address: '',
  adminFirstName: '',
  adminLastName: '',
  adminUsername: '',
  adminPassword: '',
  adminEmail: '',
  adminPhone: '',
})

const form = reactive(defaultForm())
const showPw = ref(false)
const submitting = ref(false)
const submitError = ref('')
const created = ref(false)

function resetForm() {
  Object.assign(form, defaultForm())
  created.value = false
  submitError.value = ''
}

function copy(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  try {
    const company = await companyService.create({
      name: form.companyName,
      registrationNumber: form.registrationNumber,
      phone: form.phone,
      email: form.email,
      address: form.address,
      isActive: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    })

    await userService.create({
      firstName: form.adminFirstName,
      lastName: form.adminLastName,
      username: form.adminUsername,
      password: form.adminPassword,
      email: form.adminEmail,
      phone: form.adminPhone,
      role: 'express_admin',
      companyId: company.id,
      isActive: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    })

    await auditLogService.log(
      auth.userId.value, 'rura', null,
      'create_company', 'company', company.id,
      `Registered company "${form.companyName}" with admin ${form.adminUsername}`
    )

    created.value = true
  } catch (e) {
    submitError.value = e.message || 'Failed to register company'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.reg-form {
  max-width: 780px;
}

.form-section {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 20px;
}
.form-section h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
.section-note { font-size: 13px; color: rgba(255,255,255,0.35); margin: 4px 0 16px; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
.field.full { grid-column: 1 / -1; }

.field label {
  display: block;
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
  font-weight: 500;
}
.field input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0a0a0a;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.field input:focus { border-color: #22c55e; }
.field input::placeholder { color: rgba(255,255,255,0.2); }

.pw-field { position: relative; }
.pw-field input { padding-right: 44px; }
.pw-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  font-size: 14px;
}

.form-error {
  color: #ef4444;
  font-size: 14px;
  margin: 0 0 16px;
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
  min-height: 44px;
}
.btn-primary:hover { background: #16a34a; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: transparent;
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s;
}
.btn-secondary:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); }

.success-screen { text-align: center; max-width: 520px; margin: 0 auto; padding-top: 20px; }
.success-icon { font-size: 56px; color: #22c55e; margin-bottom: 16px; }
.success-screen h2 { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
.success-sub { font-size: 14px; color: rgba(255,255,255,0.4); margin: 0 0 28px; }

.credentials-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 24px;
  text-align: left;
  margin-bottom: 24px;
}
.credentials-card h4 { margin: 0 0 6px; font-size: 15px; }
.cred-note { font-size: 12px; color: rgba(255,255,255,0.35); margin: 0 0 16px; }

.cred-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  margin-bottom: 8px;
}
.cred-label { font-size: 12px; color: rgba(255,255,255,0.4); width: 80px; flex-shrink: 0; }
.cred-value { flex: 1; font-size: 14px; font-weight: 600; font-family: monospace; }
.copy-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}
.copy-btn:hover { color: #22c55e; }

.success-actions { display: flex; gap: 12px; justify-content: center; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
