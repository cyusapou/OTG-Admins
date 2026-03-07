<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="RURA"
    pageTitle="Finances"
    :userName="auth.currentUser.value?.firstName"
    @logout="auth.logout('/rura/login')"
  >
    <div v-if="loadError" class="section-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ loadError }}</p>
      <button class="retry-btn" @click="loadAll"><i class="fas fa-redo"></i> Retry</button>
    </div>

    <template v-else>
      <div class="period-toggle">
        <button
          v-for="p in periods"
          :key="p.key"
          class="period-btn"
          :class="{ active: period === p.key }"
          @click="period = p.key"
        >{{ p.label }}</button>
      </div>

      <div class="stats-row">
        <StatCard icon="fas fa-coins" label="Revenue" :value="metrics.revenue" :loading="loading" />
        <StatCard icon="fas fa-receipt" label="Transactions" :value="metrics.transactions" :loading="loading" />
        <StatCard icon="fas fa-users" label="Passengers" :value="metrics.passengers" :loading="loading" />
        <StatCard icon="fas fa-chart-line" label="Avg per Trip" :value="metrics.avgPerTrip" :loading="loading" />
      </div>

      <div class="chart-area">
        <h3>Revenue Trend</h3>
        <div class="chart-placeholder">
          <i class="fas fa-chart-area"></i>
          <span v-if="loading">Loading chart data...</span>
          <span v-else-if="!fares.length">No revenue data for this period</span>
          <span v-else>Chart visualization — {{ fares.length }} transactions in period</span>
        </div>
      </div>

      <h3 class="section-title">Revenue by Company</h3>
      <DataTable
        :columns="companyColumns"
        :rows="companyRevenue"
        :loading="loading"
        emptyIcon="fas fa-coins"
        emptyTitle="No revenue data"
        emptySubtitle="Revenue will appear once fare collections are recorded"
      >
        <template #cell-revenue="{ value }">
          {{ (value || 0).toLocaleString() }} RWF
        </template>
        <template #cell-share="{ value }">
          <div class="share-bar">
            <div class="share-fill" :style="{ width: value + '%' }"></div>
            <span>{{ value }}%</span>
          </div>
        </template>
      </DataTable>
    </template>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import StatCard from '../../components/shared/StatCard.vue'
import DataTable from '../../components/shared/DataTable.vue'
import { useAuth } from '../../composables/useAuth.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { companyService } from '../../services/companyService.js'

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

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

const companyColumns = [
  { key: 'name', label: 'Company' },
  { key: 'transactions', label: 'Transactions', width: '130px' },
  { key: 'passengers', label: 'Passengers', width: '120px' },
  { key: 'revenue', label: 'Revenue', width: '160px' },
  { key: 'share', label: 'Share', width: '160px' },
]

const period = ref('today')
const loading = ref(true)
const loadError = ref('')
const fares = ref([])
const companies = ref([])

const metrics = computed(() => {
  const filtered = filteredFares.value
  const total = filtered.reduce((s, f) => s + (f.amount || 0), 0)
  const passengers = filtered.reduce((s, f) => s + (f.passengerCount || 1), 0)
  const avg = filtered.length ? Math.round(total / filtered.length) : 0
  return {
    revenue: total.toLocaleString() + ' RWF',
    transactions: filtered.length,
    passengers,
    avgPerTrip: avg.toLocaleString() + ' RWF',
  }
})

const filteredFares = computed(() => {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  if (period.value === 'today') {
    return fares.value.filter(f => (f.tripDate || f.createdAt || '').slice(0, 10) === todayStr)
  }
  if (period.value === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekStr = weekAgo.toISOString().slice(0, 10)
    return fares.value.filter(f => (f.tripDate || f.createdAt || '').slice(0, 10) >= weekStr)
  }
  const monthStr = todayStr.slice(0, 7)
  return fares.value.filter(f => (f.tripDate || f.createdAt || '').slice(0, 7) === monthStr)
})

const companyRevenue = computed(() => {
  const filtered = filteredFares.value
  const byCompany = {}
  filtered.forEach(f => {
    const cid = f.companyId || 'unknown'
    if (!byCompany[cid]) byCompany[cid] = { id: cid, revenue: 0, transactions: 0, passengers: 0 }
    byCompany[cid].revenue += f.amount || 0
    byCompany[cid].transactions++
    byCompany[cid].passengers += f.passengerCount || 1
  })
  const compMap = Object.fromEntries(companies.value.map(c => [c.id, c.name]))
  const totalRev = filtered.reduce((s, f) => s + (f.amount || 0), 0) || 1
  return Object.values(byCompany)
    .map(c => ({
      ...c,
      name: compMap[c.id] || 'Unknown',
      share: Math.round((c.revenue / totalRev) * 100),
    }))
    .sort((a, b) => b.revenue - a.revenue)
})

async function loadAll() {
  loading.value = true
  loadError.value = ''
  try {
    const [allFares, allCompanies] = await Promise.all([
      fareCollectionService.getAll(),
      companyService.getAll(),
    ])
    fares.value = allFares
    companies.value = allCompanies
  } catch (e) {
    loadError.value = e.message || 'Failed to load financial data'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.period-toggle {
  display: inline-flex; gap: 4px; margin-bottom: 20px;
  background: #141414; border-radius: 10px; padding: 4px;
  border: 1px solid rgba(255,255,255,0.07);
}
.period-btn {
  padding: 8px 18px; border: none; background: transparent;
  color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 500;
  border-radius: 8px; cursor: pointer; transition: all 0.15s;
}
.period-btn:hover { color: rgba(255,255,255,0.7); }
.period-btn.active { background: #22c55e; color: #fff; }

.stats-row {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; margin-bottom: 28px;
}

.chart-area {
  background: #141414; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px; padding: 20px; margin-bottom: 28px;
}
.chart-area h3 { margin: 0 0 16px; font-size: 15px; font-weight: 600; }
.chart-placeholder {
  height: 220px; border-radius: 10px; background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.08);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; color: rgba(255,255,255,0.25); font-size: 13px;
}
.chart-placeholder i { font-size: 36px; color: rgba(34,197,94,0.3); }

.section-title { font-size: 15px; font-weight: 600; margin: 0 0 14px; }

.share-bar {
  display: flex; align-items: center; gap: 10px;
}
.share-fill {
  height: 6px; border-radius: 3px; background: #22c55e;
  min-width: 4px; transition: width 0.3s;
}
.share-bar span { font-size: 12px; color: rgba(255,255,255,0.5); min-width: 36px; }

.section-error { text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.4); }
.section-error i { font-size: 40px; color: #ef4444; display: block; margin-bottom: 12px; }
.retry-btn {
  padding: 10px 24px; border-radius: 10px; border: none;
  background: #22c55e; color: #fff; font-weight: 600; cursor: pointer;
}
</style>
