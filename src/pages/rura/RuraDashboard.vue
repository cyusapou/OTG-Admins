<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Dashboard"
    :userName="auth.currentUser.value?.firstName"
    :unreadCount="unreadCount"
    @logout="auth.logout('/rura/login')"
  >
    <div v-if="loadError" class="section-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ loadError }}</p>
      <button class="retry-btn" @click="loadAll">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>

    <template v-else>
      <div class="stats-row">
        <StatCard icon="fas fa-building" label="Total Companies" :value="stats.companies" :loading="loading" />
        <StatCard icon="fas fa-road" label="Active Routes" :value="stats.routes" :loading="loading" />
        <StatCard icon="fas fa-bus" label="Trips Today" :value="stats.tripsToday" :loading="loading" />
        <StatCard icon="fas fa-users" label="Passengers Today" :value="stats.passengersToday" :loading="loading" />
        <StatCard icon="fas fa-coins" label="Revenue Today" :value="stats.revenueToday" :loading="loading" />
        <StatCard
          icon="fas fa-clock"
          label="Pending Approvals"
          :value="stats.pendingApprovals"
          :highlight="stats.pendingApprovals > 0"
          :loading="loading"
        />
      </div>

      <div class="panels">
        <div class="panel">
          <div class="panel-header">
            <h3>Recent Incidents</h3>
            <router-link to="/rura/incidents" class="panel-link">View All</router-link>
          </div>
          <div v-if="loading" class="panel-loading">
            <div class="skel-line" v-for="i in 4" :key="i"></div>
          </div>
          <div v-else-if="!recentIncidents.length" class="panel-empty">
            <i class="fas fa-check-circle"></i>
            <span>No recent incidents</span>
          </div>
          <div v-else class="panel-list">
            <div class="panel-item" v-for="inc in recentIncidents" :key="inc.id">
              <div class="item-left">
                <span class="item-severity" :class="inc.severity">{{ inc.severity }}</span>
                <div class="item-info">
                  <span class="item-title">{{ inc.type }}</span>
                  <span class="item-sub">{{ inc.description || 'No description' }}</span>
                </div>
              </div>
              <StatusBadge :status="inc.status" />
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3>Pending Approvals</h3>
            <router-link to="/rura/routes" class="panel-link">View All</router-link>
          </div>
          <div v-if="loading" class="panel-loading">
            <div class="skel-line" v-for="i in 4" :key="i"></div>
          </div>
          <div v-else-if="!pendingApprovals.length" class="panel-empty">
            <i class="fas fa-check-circle"></i>
            <span>No pending approvals</span>
          </div>
          <div v-else class="panel-list">
            <div class="panel-item" v-for="a in pendingApprovals" :key="a.id">
              <div class="item-info">
                <span class="item-title">{{ a.routeName || 'Route' }}</span>
                <span class="item-sub">{{ a.companyName || 'Unknown company' }} &middot; Submitted {{ formatDate(a.submittedAt) }}</span>
              </div>
              <div class="approval-actions">
                <button class="btn-approve" @click="handleApprove(a)" :disabled="a._busy">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn-reject" @click="handleReject(a)" :disabled="a._busy">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PortalLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import StatCard from '../../components/shared/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { companyService } from '../../services/companyService.js'
import { routeService } from '../../services/routeService.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { incidentService } from '../../services/incidentService.js'
import { routeApprovalService } from '../../services/routeApprovalService.js'
import { notificationService } from '../../services/notificationService.js'
import { plannedTripService } from '../../services/plannedTripService.js'

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

const loading = ref(true)
const loadError = ref('')
const unreadCount = ref(0)
const stats = ref({ companies: 0, routes: 0, tripsToday: 0, passengersToday: 0, revenueToday: '0 RWF', pendingApprovals: 0 })
const recentIncidents = ref([])
const pendingApprovals = ref([])

const today = new Date().toISOString().slice(0, 10)

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

async function loadAll() {
  loading.value = true
  loadError.value = ''
  try {
    const [companies, routes, fares, incidents, pending, trips] = await Promise.all([
      companyService.getAll(),
      routeService.getAll(),
      fareCollectionService.getAll({ tripDate: today }),
      incidentService.getAll({ _sort: 'createdAt', _order: 'desc', _limit: 5 }),
      routeApprovalService.getPending(),
      plannedTripService.getAll({ date: today }),
    ])

    stats.value.companies = companies.length
    stats.value.routes = routes.filter(r => r.isActive !== false).length
    stats.value.tripsToday = trips.length

    const totalPassengers = fares.reduce((s, f) => s + (f.passengerCount || 1), 0)
    stats.value.passengersToday = totalPassengers

    const totalRevenue = fares.reduce((s, f) => s + (f.amount || 0), 0)
    stats.value.revenueToday = totalRevenue.toLocaleString() + ' RWF'

    stats.value.pendingApprovals = pending.length
    recentIncidents.value = incidents
    pendingApprovals.value = pending.slice(0, 5)

    if (auth.userId.value) {
      try {
        const notifs = await notificationService.getUnread(auth.userId.value)
        unreadCount.value = notifs.length
      } catch {}
    }
  } catch (e) {
    loadError.value = e.message || 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
}

async function handleApprove(approval) {
  approval._busy = true
  try {
    await routeApprovalService.approve(approval.id, auth.userId.value)
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== approval.id)
    stats.value.pendingApprovals = Math.max(0, stats.value.pendingApprovals - 1)
  } catch {}
}

async function handleReject(approval) {
  const reason = prompt('Rejection reason:')
  if (!reason) return
  approval._busy = true
  try {
    await routeApprovalService.reject(approval.id, auth.userId.value, reason)
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== approval.id)
    stats.value.pendingApprovals = Math.max(0, stats.value.pendingApprovals - 1)
  } catch {}
}

onMounted(loadAll)
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;
}

.panel {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.panel-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
.panel-link {
  font-size: 12px;
  color: #22c55e;
  text-decoration: none;
  font-weight: 500;
}
.panel-link:hover { text-decoration: underline; }

.panel-loading { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.skel-line {
  height: 16px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
  animation: shimmer 1.5s ease infinite;
}
@keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 20px;
  color: rgba(255,255,255,0.3);
  font-size: 13px;
}
.panel-empty i { font-size: 28px; color: #22c55e; }

.panel-list { display: flex; flex-direction: column; }

.panel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  gap: 12px;
}
.panel-item:last-child { border-bottom: none; }

.item-left { display: flex; align-items: center; gap: 12px; min-width: 0; }

.item-severity {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.item-severity.critical, .item-severity.high {
  background: rgba(239,68,68,0.12);
  color: #ef4444;
}
.item-severity.medium {
  background: rgba(234,179,8,0.12);
  color: #eab308;
}
.item-severity.low {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.4);
}

.item-info { display: flex; flex-direction: column; min-width: 0; }
.item-title { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-sub { font-size: 12px; color: rgba(255,255,255,0.35); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.approval-actions { display: flex; gap: 8px; flex-shrink: 0; }
.btn-approve, .btn-reject {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: all 0.15s;
}
.btn-approve { background: rgba(34,197,94,0.12); color: #22c55e; }
.btn-approve:hover { background: rgba(34,197,94,0.25); }
.btn-reject { background: rgba(239,68,68,0.12); color: #ef4444; }
.btn-reject:hover { background: rgba(239,68,68,0.25); }
.btn-approve:disabled, .btn-reject:disabled { opacity: 0.4; cursor: not-allowed; }

.section-error {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.4);
}
.section-error i { font-size: 40px; color: #ef4444; display: block; margin-bottom: 12px; }
.section-error p { margin: 0 0 16px; }
.retry-btn {
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  background: #22c55e;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.retry-btn:hover { background: #16a34a; }
</style>
