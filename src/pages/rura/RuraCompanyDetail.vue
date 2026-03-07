<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    :pageTitle="company ? company.name : 'Company Detail'"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div v-if="loading" class="detail-loading">
      <div class="skel-block"></div>
      <div class="skel-block short"></div>
    </div>

    <div v-else-if="loadError" class="section-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ loadError }}</p>
      <button class="retry-btn" @click="load"><i class="fas fa-redo"></i> Retry</button>
    </div>

    <template v-else-if="company">
      <div class="detail-header">
        <router-link to="/rura/companies" class="back-link">
          <i class="fas fa-arrow-left"></i> Companies
        </router-link>
        <div class="header-actions">
          <button
            v-if="company.isActive !== false"
            class="btn-danger"
            :disabled="suspending"
            @click="handleSuspend"
          >
            <i class="fas fa-ban"></i> Suspend
          </button>
          <button
            v-else
            class="btn-primary"
            :disabled="suspending"
            @click="handleReinstate"
          >
            <i class="fas fa-check"></i> Reinstate
          </button>
        </div>
      </div>

      <div class="tab-bar">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab-btn"
          :class="{ active: activeTab === t.key }"
          @click="activeTab = t.key"
        >
          <i :class="t.icon"></i> {{ t.label }}
        </button>
      </div>

      <!-- OVERVIEW TAB -->
      <div v-if="activeTab === 'overview'" class="tab-content">
        <div class="info-grid">
          <div class="info-card">
            <span class="info-label">Status</span>
            <StatusBadge :status="company.isActive === false ? 'suspended' : (company.status || 'active')" />
          </div>
          <div class="info-card">
            <span class="info-label">Registration #</span>
            <span class="info-value">{{ company.registrationNumber || '—' }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Phone</span>
            <span class="info-value">{{ company.phone || '—' }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Email</span>
            <span class="info-value">{{ company.email || '—' }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Address</span>
            <span class="info-value">{{ company.address || '—' }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Registered</span>
            <span class="info-value">{{ formatDate(company.createdAt) }}</span>
          </div>
        </div>
        <div class="stats-row-sm">
          <StatCard icon="fas fa-road" label="Routes" :value="routes.length" :loading="false" />
          <StatCard icon="fas fa-users" label="Users" :value="users.length" :loading="false" />
          <StatCard icon="fas fa-exclamation-triangle" label="Incidents" :value="incidents.length" :loading="false" />
        </div>
      </div>

      <!-- ROUTES TAB -->
      <div v-if="activeTab === 'routes'" class="tab-content">
        <DataTable
          :columns="routeColumns"
          :rows="routes"
          :loading="false"
          emptyIcon="fas fa-road"
          emptyTitle="No routes for this company"
          emptySubtitle="Routes will appear here once submitted"
        >
          <template #cell-isActive="{ row }">
            <StatusBadge :status="row.isActive === false ? 'inactive' : 'active'" />
          </template>
          <template #cell-approvalStatus="{ row }">
            <StatusBadge :status="row.approvalStatus || 'pending'" />
          </template>
        </DataTable>
      </div>

      <!-- FINANCES TAB -->
      <div v-if="activeTab === 'finances'" class="tab-content">
        <div class="stats-row-sm" style="margin-bottom: 20px;">
          <StatCard icon="fas fa-coins" label="Total Revenue" :value="totalRevenue + ' RWF'" :loading="false" />
          <StatCard icon="fas fa-receipt" label="Transactions" :value="fares.length" :loading="false" />
        </div>
        <DataTable
          :columns="fareColumns"
          :rows="fares"
          :loading="false"
          emptyIcon="fas fa-coins"
          emptyTitle="No fare collections yet"
          emptySubtitle="Revenue data will appear as trips are completed"
        >
          <template #cell-amount="{ value }">
            {{ (value || 0).toLocaleString() }} RWF
          </template>
          <template #cell-tripDate="{ value }">
            {{ formatDate(value) }}
          </template>
        </DataTable>
      </div>

      <!-- USERS TAB -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <DataTable
          :columns="userColumns"
          :rows="users"
          :loading="false"
          emptyIcon="fas fa-users"
          emptyTitle="No users for this company"
          emptySubtitle="Users will appear here once created"
        >
          <template #cell-name="{ row }">
            {{ row.firstName }} {{ row.lastName }}
          </template>
          <template #cell-role="{ row }">
            <StatusBadge :status="row.role" />
          </template>
          <template #cell-isActive="{ row }">
            <StatusBadge :status="row.isActive === false ? 'inactive' : 'active'" />
          </template>
        </DataTable>
      </div>

      <!-- INCIDENTS TAB -->
      <div v-if="activeTab === 'incidents'" class="tab-content">
        <DataTable
          :columns="incidentColumns"
          :rows="incidents"
          :loading="false"
          emptyIcon="fas fa-shield-alt"
          emptyTitle="No incidents reported"
          emptySubtitle="Incident reports for this company will appear here"
        >
          <template #cell-severity="{ value }">
            <StatusBadge :status="value" />
          </template>
          <template #cell-status="{ value }">
            <StatusBadge :status="value" />
          </template>
          <template #cell-createdAt="{ value }">
            {{ formatDate(value) }}
          </template>
        </DataTable>
      </div>
    </template>
  </PortalLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import DataTable from '../../components/shared/DataTable.vue'
import StatCard from '../../components/shared/StatCard.vue'
import StatusBadge from '../../components/shared/StatusBadge.vue'
import { useAuth } from '../../composables/useAuth.js'
import { companyService } from '../../services/companyService.js'
import { routeService } from '../../services/routeService.js'
import { userService } from '../../services/userService.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { incidentService } from '../../services/incidentService.js'
import { auditLogService } from '../../services/auditLogService.js'

const route = useRoute()
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

const tabs = [
  { key: 'overview', label: 'Overview', icon: 'fas fa-info-circle' },
  { key: 'routes', label: 'Routes', icon: 'fas fa-road' },
  { key: 'finances', label: 'Finances', icon: 'fas fa-coins' },
  { key: 'users', label: 'Users', icon: 'fas fa-users' },
  { key: 'incidents', label: 'Incidents', icon: 'fas fa-exclamation-triangle' },
]

const activeTab = ref('overview')
const loading = ref(true)
const loadError = ref('')
const suspending = ref(false)

const company = ref(null)
const routes_ = ref([])
const routes = routes_
const users = ref([])
const fares = ref([])
const incidents = ref([])
const totalRevenue = ref(0)

const routeColumns = [
  { key: 'name', label: 'Route Name' },
  { key: 'origin', label: 'Origin' },
  { key: 'destination', label: 'Destination' },
  { key: 'isActive', label: 'Status', width: '100px' },
  { key: 'approvalStatus', label: 'Approval', width: '120px' },
]

const fareColumns = [
  { key: 'tripDate', label: 'Date', width: '130px' },
  { key: 'routeName', label: 'Route' },
  { key: 'amount', label: 'Amount', width: '140px' },
  { key: 'passengerCount', label: 'Passengers', width: '110px' },
]

const userColumns = [
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'role', label: 'Role', width: '140px' },
  { key: 'isActive', label: 'Status', width: '100px' },
]

const incidentColumns = [
  { key: 'createdAt', label: 'Date', width: '130px' },
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity', width: '100px' },
  { key: 'status', label: 'Status', width: '100px' },
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const id = route.params.id
    const [comp, rts, usrs, frs, incs] = await Promise.all([
      companyService.getById(id),
      routeService.getAll({ companyId: id }),
      userService.getAll({ companyId: id }),
      fareCollectionService.getByCompany(id),
      incidentService.getByCompany(id),
    ])
    company.value = comp
    routes_.value = rts
    users.value = usrs
    fares.value = frs
    incidents.value = incs
    totalRevenue.value = frs.reduce((s, f) => s + (f.amount || 0), 0).toLocaleString()
  } catch (e) {
    loadError.value = e.message || 'Failed to load company details'
  } finally {
    loading.value = false
  }
}

async function handleSuspend() {
  if (!confirm(`Suspend ${company.value.name}? This will deactivate the company.`)) return
  suspending.value = true
  try {
    await companyService.patch(company.value.id, { isActive: false, status: 'suspended' })
    company.value.isActive = false
    company.value.status = 'suspended'
    await auditLogService.log(
      auth.userId.value, 'rura', company.value.id,
      'suspend_company', 'company', company.value.id,
      `Suspended company "${company.value.name}"`
    )
  } catch {} finally { suspending.value = false }
}

async function handleReinstate() {
  suspending.value = true
  try {
    await companyService.patch(company.value.id, { isActive: true, status: 'active' })
    company.value.isActive = true
    company.value.status = 'active'
    await auditLogService.log(
      auth.userId.value, 'rura', company.value.id,
      'reinstate_company', 'company', company.value.id,
      `Reinstated company "${company.value.name}"`
    )
  } catch {} finally { suspending.value = false }
}

onMounted(load)
</script>

<style scoped>
.detail-loading { display: flex; flex-direction: column; gap: 16px; padding-top: 20px; }
.skel-block {
  height: 120px; border-radius: 14px; background: #141414;
  animation: shimmer 1.5s ease infinite;
}
.skel-block.short { height: 60px; width: 60%; }
@keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }

.section-error { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.4); }
.section-error i { font-size: 40px; color: #ef4444; display: block; margin-bottom: 12px; }
.retry-btn {
  padding: 10px 24px; border-radius: 10px; border: none;
  background: #22c55e; color: #fff; font-weight: 600; cursor: pointer;
}

.detail-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.back-link {
  display: inline-flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.5); text-decoration: none; font-size: 14px;
}
.back-link:hover { color: #22c55e; }

.header-actions { display: flex; gap: 8px; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: #22c55e; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.btn-primary:hover { background: #16a34a; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-danger {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: rgba(239,68,68,0.12); color: #ef4444;
  border: 1px solid rgba(239,68,68,0.2); border-radius: 10px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-danger:hover { background: rgba(239,68,68,0.2); }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.tab-bar {
  display: flex; gap: 4px; margin-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  padding-bottom: 0;
}
.tab-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 18px; border: none; background: transparent;
  color: rgba(255,255,255,0.4); font-size: 14px; font-weight: 500;
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.15s; margin-bottom: -1px;
}
.tab-btn:hover { color: rgba(255,255,255,0.7); }
.tab-btn.active { color: #22c55e; border-bottom-color: #22c55e; }

.tab-content { min-height: 200px; }

.info-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px; margin-bottom: 24px;
}
.info-card {
  background: #141414; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
}
.info-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px; }
.info-value { font-size: 14px; font-weight: 500; }

.stats-row-sm {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
</style>
