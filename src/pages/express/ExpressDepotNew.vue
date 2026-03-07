<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Create Depot"
    :userName="userName"
    :companyName="companyName"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <form class="form-card" @submit.prevent="handleSubmit">
      <router-link to="/express/depots" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Depots
      </router-link>

      <div class="form-grid">
        <div class="field">
          <label>Depot Name</label>
          <input v-model="form.name" required placeholder="e.g. Kigali Central Depot" />
        </div>
        <div class="field">
          <label>City</label>
          <input v-model="form.city" required placeholder="City" />
        </div>
        <div class="field full">
          <label>Address</label>
          <input v-model="form.address" placeholder="Full address" />
        </div>
        <div class="field">
          <label>Phone</label>
          <input v-model="form.phone" type="tel" placeholder="Contact phone" />
        </div>
      </div>

      <p v-if="error" class="form-error"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>

      <div class="form-actions">
        <router-link to="/express/depots" class="btn-secondary">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <span v-else>Create Depot</span>
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
import { depotService } from '../../services/depotService.js'
import { auditLogService } from '../../services/auditLogService.js'
import { companyService } from '../../services/companyService.js'
import { navItems } from './expressNav.js'

const router = useRouter()
const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const saving = ref(false)
const error = ref('')
const companyName = ref('')
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const form = reactive({ name: '', city: '', address: '', phone: '' })

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    const depot = await depotService.create({
      name: form.name,
      city: form.city,
      address: form.address,
      phone: form.phone,
      companyId: cid.value,
      managerId: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    await auditLogService.log(
      auth.userId.value, 'express_admin', cid.value,
      'create', 'depot', depot.id,
      `Created depot ${form.name}`
    )

    router.push('/express/depots')
  } catch {
    error.value = 'Failed to create depot'
  } finally {
    saving.value = false
  }
}

function handleLogout() { auth.logout('/express/login') }

onMounted(async () => {
  try {
    const company = await companyService.getById(cid.value)
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
.field.full { grid-column: 1 / -1; }
.field label {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  margin-bottom: 6px;
  font-weight: 500;
}
.field input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0a0a0a;
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.field input:focus { border-color: #22c55e; }
.field input::placeholder { color: rgba(255,255,255,0.2); }
.form-error { color: #ef4444; font-size: 13px; margin-top: 16px; }
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 24px; border-radius: 10px; background: #22c55e;
  color: #fff; font-size: 14px; font-weight: 600; border: none;
  cursor: pointer; text-decoration: none; transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-secondary {
  display: inline-flex; align-items: center;
  padding: 10px 24px; border-radius: 10px; background: transparent;
  border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6);
  font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none;
  transition: all 0.15s;
}
.btn-secondary:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
