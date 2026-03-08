<template>
  <PortalLayout
    :nav-items="navItems"
    role-label="Manager"
    page-title="Teams"
    :user-name="userName"
    :company-name="companyName"
    :unread-count="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading teams...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="loadTeams">
        <i class="fas fa-redo"></i> Try Again
      </button>
    </div>

    <div v-else>
      <p class="teams-intro">Pair drivers with their assistant (worker). Assign trips from the Trips page after linking teams here.</p>

      <div v-if="!teams.length" class="empty-state">
        <i class="fas fa-user-friends"></i>
        <p class="empty-title">No drivers yet</p>
        <p class="empty-sub">Add drivers and workers from the Drivers and Workers pages, then link them here.</p>
      </div>

      <div v-else class="teams-list">
        <div v-for="t in teams" :key="t.driverId" class="team-card">
          <div class="team-driver">
            <span class="team-label">Driver</span>
            <span class="team-name">{{ t.driverName }}</span>
          </div>
          <div class="team-assistant">
            <span class="team-label">Assistant</span>
            <template v-if="t.workerId">
              <span class="team-name">{{ t.workerName }}</span>
              <button
                type="button"
                class="btn-unlink"
                :disabled="t._unlinking"
                @click="unlink(t)"
                title="Unlink assistant"
              >
                <i v-if="t._unlinking" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-unlink"></i> Unlink
              </button>
            </template>
            <template v-else>
              <span class="no-assistant">No assistant</span>
              <select v-model="t._selectedWorkerId" class="select-worker">
                <option value="">Select worker...</option>
                <option v-for="w in unassignedWorkers" :key="w.id" :value="w.id">
                  {{ w.name }}
                </option>
              </select>
              <button
                type="button"
                class="btn-link"
                :disabled="!t._selectedWorkerId || t._linking"
                @click="link(t)"
              >
                <i v-if="t._linking" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-link"></i> Link
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import { useAuth } from '../../composables/useAuth.js'
import { userService } from '../../services/userService.js'
import { driverService } from '../../services/driverService.js'
import { workerService } from '../../services/workerService.js'
import { notificationService } from '../../services/notificationService.js'
import { navItems } from './managerNav.js'

const auth = useAuth()

const loading = ref(true)
const error = ref('')
const teams = ref([])
const unassignedWorkersList = ref([])
const unreadCount = ref(0)
const companyName = ref('')
/** After a successful link PATCH, hold the updated worker so loadTeams uses it (avoids stale GET). */
const lastPatchedWorker = ref(null)

const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const unassignedWorkers = computed(() => {
  const linked = new Set(teams.value.filter(t => t.workerId).map(t => t.workerId))
  return unassignedWorkersList.value.filter(w => !linked.has(w.id))
})

async function loadTeams() {
  loading.value = true
  error.value = ''
  try {
    const companyId = auth.companyId.value
    const depotId = auth.depotId.value

    const [driverDocs, workerDocs, driverUsers, notifications] = await Promise.all([
      driverService.getAll({ companyId }),
      workerService.getAll({ companyId }),
      userService.getAll({ role: 'driver', depotId: depotId || undefined }),
      notificationService.getUnread(auth.userId.value),
    ])

    unreadCount.value = notifications.length

    const driverUserMap = {}
    driverUsers.filter(u => u.status !== 'inactive').forEach(u => { driverUserMap[u.id] = u })

    const workerByDriverId = {}
    workerDocs.forEach(w => {
      const key = w.driverId ? String(w.driverId).trim() : ''
      if (key) workerByDriverId[key] = w
    })
    if (lastPatchedWorker.value?.driverId) {
      const key = String(lastPatchedWorker.value.driverId).trim()
      if (key) workerByDriverId[key] = lastPatchedWorker.value
    }

    const userMap = {}
    await Promise.all(
      [...new Set([...driverDocs.map(d => d.userId), ...workerDocs.map(w => w.userId)])].map(uid =>
        userService.getById(uid).then(u => { userMap[u.id] = u })
      )
    ).catch(() => {})

    unassignedWorkersList.value = workerDocs
      .filter(w => !w.driverId || String(w.driverId).trim() === '')
      .map(w => ({
        id: w.id,
        name: userMap[w.userId] ? `${userMap[w.userId].firstName} ${userMap[w.userId].lastName}` : (w.name || 'Worker'),
      }))

    teams.value = driverDocs
      .filter(d => driverUserMap[d.userId])
      .map(d => {
        const driverDocId = (d.id != null ? String(d.id) : (d._id != null ? String(d._id) : '')).trim()
        const worker = driverDocId ? (workerByDriverId[driverDocId] || null) : null
        return {
          driverId: driverDocId || d.id,
          driverName: userMap[d.userId] ? `${userMap[d.userId].firstName} ${userMap[d.userId].lastName}` : (d.name || 'Driver'),
          workerId: worker ? worker.id : null,
          workerName: worker && userMap[worker.userId] ? `${userMap[worker.userId].firstName} ${userMap[worker.userId].lastName}` : (worker?.name || null),
          _selectedWorkerId: '',
          _unlinking: false,
          _linking: false,
        }
      })
  } catch {
    error.value = 'Failed to load teams.'
  } finally {
    loading.value = false
  }
}

async function link(t) {
  if (!t._selectedWorkerId) return
  const driverIdToSave = t.driverId != null ? String(t.driverId).trim() : ''
  if (!driverIdToSave) {
    error.value = 'Driver id missing. Refresh the page and try again.'
    return
  }
  t._linking = true
  error.value = ''
  lastPatchedWorker.value = null
  try {
    const updated = await workerService.patch(t._selectedWorkerId, { driverId: driverIdToSave })
    if (updated) {
      lastPatchedWorker.value = { ...updated, driverId: driverIdToSave }
    }
    await loadTeams()
  } catch (e) {
    error.value = e?.message || 'Failed to link assistant.'
  } finally {
    t._linking = false
    lastPatchedWorker.value = null
  }
}

async function unlink(t) {
  if (!t.workerId) return
  t._unlinking = true
  try {
    await workerService.patch(t.workerId, { driverId: null })
    await loadTeams()
  } catch {
    error.value = 'Failed to unlink assistant.'
  } finally {
    t._unlinking = false
  }
}

function handleLogout() {
  auth.logout('/manager/login')
}

onMounted(loadTeams)
</script>

<style scoped>
.teams-intro {
  margin-bottom: 20px;
  color: var(--text-secondary, #5a6c7d);
  font-size: 14px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary, #5a6c7d);
}

.error-state p { margin: 12px 0; }
.btn-retry {
  margin-top: 12px;
  padding: 10px 20px;
  background: var(--primary, #22c55e);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary, #5a6c7d);
}

.empty-state i {
  font-size: 48px;
  opacity: 0.5;
  margin-bottom: 16px;
  display: block;
}

.empty-title { font-weight: 600; margin: 0 0 8px 0; }
.empty-sub { margin: 0; font-size: 14px; }

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border, #e8ecf1);
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 600px) {
  .team-card { grid-template-columns: 1fr; }
}

.team-driver,
.team-assistant {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary, #5a6c7d);
}

.team-name { font-weight: 600; }

.no-assistant { color: var(--text-secondary, #5a6c7d); font-style: italic; }

.select-worker {
  max-width: 220px;
  padding: 8px 12px;
  border: 1px solid var(--border, #e8ecf1);
  border-radius: 8px;
  font-size: 14px;
  margin-top: 4px;
}

.btn-link,
.btn-unlink {
  margin-top: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-link {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.btn-link:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-unlink {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.btn-unlink:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
