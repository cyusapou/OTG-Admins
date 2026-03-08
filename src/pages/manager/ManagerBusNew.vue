<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Add Bus"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <form class="form-card" @submit.prevent="handleSubmit">
      <router-link to="/manager/buses" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Buses
      </router-link>

      <div class="form-grid">
        <div class="field">
          <label>Plate Number</label>
          <input v-model="form.plateNumber" required placeholder="e.g. RAD 123 A" />
        </div>
        <div class="field">
          <label>Make</label>
          <input v-model="form.make" required placeholder="e.g. Toyota" />
        </div>
        <div class="field">
          <label>Model</label>
          <input v-model="form.model" required placeholder="e.g. Coaster" />
        </div>
        <div class="field">
          <label>Year</label>
          <input v-model.number="form.year" type="number" min="2000" :max="new Date().getFullYear() + 1" placeholder="Year" />
        </div>
        <div class="field">
          <label>Capacity (seats)</label>
          <input v-model.number="form.capacity" type="number" min="1" required placeholder="Seats" />
        </div>
        <div class="field">
          <label>Insurance Expiry</label>
          <input v-model="form.insuranceExpiry" type="date" />
        </div>
        <div class="field">
          <label>Next Service Date</label>
          <input v-model="form.nextServiceDate" type="date" />
        </div>
        <div class="field full">
          <label>Amenities</label>
          <div class="amenities-grid">
            <label v-for="a in amenityOptions" :key="a" class="amenity-check">
              <input type="checkbox" :value="a" v-model="form.amenities" />
              <span>{{ a }}</span>
            </label>
          </div>
        </div>
      </div>

      <p v-if="error" class="form-error"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>

      <div class="form-actions">
        <router-link to="/manager/buses" class="btn-secondary">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <span v-else>Add Bus</span>
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
import { busService } from '../../services/busService.js'
import { notificationService } from '../../services/notificationService.js'
import { navItems } from './managerNav.js'

const router = useRouter()
const auth = useAuth()
const cid = computed(() => auth.companyId.value)
const depotId = computed(() => auth.depotId.value)

const saving = ref(false)
const error = ref('')
const unreadCount = ref(0)
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const amenityOptions = ['WiFi', 'USB Charging', 'AC', 'Reclining Seats', 'TV/Entertainment', 'Luggage Compartment']

const form = reactive({
  plateNumber: '', make: '', model: '', year: '', capacity: '',
  insuranceExpiry: '', nextServiceDate: '', amenities: [],
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    await busService.create({
      plateNumber: form.plateNumber,
      plate: form.plateNumber,
      make: form.make,
      model: form.model,
      year: form.year || null,
      capacity: form.capacity,
      depotId: depotId.value || null,
      companyId: cid.value,
      driverId: null,
      amenities: form.amenities,
      insuranceExpiry: form.insuranceExpiry || null,
      nextServiceDate: form.nextServiceDate || null,
      isActive: true,
      status: 'active',
    })

    router.push('/manager/buses')
  } catch {
    error.value = 'Failed to add bus'
  } finally {
    saving.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(async () => {
  try {
    const notifs = await notificationService.getUnread(auth.userId.value)
    unreadCount.value = notifs.length
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
  display: inline-flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.4); text-decoration: none; font-size: 13px;
  margin-bottom: 24px; transition: color 0.15s;
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
  font-size: 12px; color: rgba(255,255,255,0.45);
  margin-bottom: 6px; font-weight: 500;
}
.field input, .field select {
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0a0a0a; color: rgba(255,255,255,0.85);
  font-size: 14px; outline: none; transition: border-color 0.2s;
}
.field input:focus, .field select:focus { border-color: #22c55e; }
.field input::placeholder { color: rgba(255,255,255,0.2); }
.field select option { background: #141414; color: rgba(255,255,255,0.85); }

.amenities-grid {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px;
}
.amenity-check {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: rgba(255,255,255,0.7); cursor: pointer;
}
.amenity-check input[type="checkbox"] { accent-color: #22c55e; }

.form-error { color: #ef4444; font-size: 13px; margin-top: 16px; }
.form-actions {
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;
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
