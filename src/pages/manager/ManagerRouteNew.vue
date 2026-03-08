<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="New Route"
    :user-name="userName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <form class="form-card" @submit.prevent="handleSubmit">
      <router-link to="/manager/routes" class="back-link">
        <i class="fas fa-arrow-left"></i> Back to Routes
      </router-link>

      <div class="form-grid">
        <div class="field">
          <label>Origin</label>
          <select v-model="form.originId" required>
            <option value="" disabled>Select origin stop</option>
            <option v-for="s in stops" :key="s.id" :value="s.id">{{ s.name }} ({{ s.city }})</option>
          </select>
        </div>
        <div class="field">
          <label>Destination</label>
          <select v-model="form.destinationId" required>
            <option value="" disabled>Select destination stop</option>
            <option v-for="s in stops" :key="s.id" :value="s.id">{{ s.name }} ({{ s.city }})</option>
          </select>
        </div>
        <div class="field full">
          <label>Intermediate Stops (comma-separated names)</label>
          <input v-model="form.stopsText" placeholder="e.g. Muhanga, Huye" />
        </div>
        <div class="field">
          <label>Distance (km)</label>
          <input v-model.number="form.distance" type="number" min="1" required placeholder="Distance" />
        </div>
        <div class="field">
          <label>Duration (minutes)</label>
          <input v-model.number="form.duration" type="number" min="1" required placeholder="Duration" />
        </div>
        <div class="field">
          <label>Fare (RWF)</label>
          <input v-model.number="form.fare" type="number" min="0" required placeholder="Fare price" />
        </div>
        <div class="field">
          <label>Operating Days</label>
          <div class="days-grid">
            <label v-for="day in allDays" :key="day" class="day-check">
              <input type="checkbox" :value="day" v-model="form.days" />
              <span>{{ day.slice(0, 3) }}</span>
            </label>
          </div>
        </div>
        <div class="field full">
          <label>Departure Times (comma-separated, e.g. 06:00, 09:30, 14:00)</label>
          <input v-model="form.departureTimes" placeholder="06:00, 09:30, 14:00" required />
        </div>
      </div>

      <p v-if="error" class="form-error"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>

      <div class="form-actions">
        <router-link to="/manager/routes" class="btn-secondary">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <span v-else>Create Route</span>
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
import { routeService } from '../../services/routeService.js'
import { stopService } from '../../services/stopService.js'
import { notificationService } from '../../services/notificationService.js'
import { navItems } from './managerNav.js'

const router = useRouter()
const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const stops = ref([])
const saving = ref(false)
const error = ref('')
const unreadCount = ref(0)
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const form = reactive({
  originId: '', destinationId: '', stopsText: '',
  distance: '', duration: '', fare: '',
  days: [...allDays], departureTimes: '',
})

async function handleSubmit() {
  if (form.originId === form.destinationId) {
    error.value = 'Origin and destination must be different'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const originStop = stops.value.find(s => s.id === form.originId)
    const destStop = stops.value.find(s => s.id === form.destinationId)
    const intermediateStops = form.stopsText ? form.stopsText.split(',').map(s => s.trim()).filter(Boolean) : []
    const departureTimes = form.departureTimes.split(',').map(t => t.trim()).filter(Boolean)

    await routeService.create({
      origin: originStop?.name || '',
      originId: form.originId,
      destination: destStop?.name || '',
      destinationId: form.destinationId,
      stops: intermediateStops,
      distance: form.distance,
      duration: form.duration,
      fare: form.fare,
      days: form.days,
      departureTimes,
      companyId: cid.value,
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    router.push('/manager/routes')
  } catch {
    error.value = 'Failed to create route'
  } finally {
    saving.value = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(async () => {
  try {
    const [allStops, notifs] = await Promise.all([
      stopService.getAll(),
      notificationService.getUnread(auth.userId.value),
    ])
    stops.value = allStops
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
.field input, .field select, .field textarea {
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #0a0a0a; color: rgba(255,255,255,0.85);
  font-size: 14px; outline: none; transition: border-color 0.2s;
  font-family: inherit;
}
.field input:focus, .field select:focus, .field textarea:focus { border-color: #22c55e; }
.field input::placeholder, .field textarea::placeholder { color: rgba(255,255,255,0.2); }
.field select option { background: #141414; color: rgba(255,255,255,0.85); }

.days-grid {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
}
.day-check {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: rgba(255,255,255,0.7); cursor: pointer;
}
.day-check input[type="checkbox"] { accent-color: #22c55e; }

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
