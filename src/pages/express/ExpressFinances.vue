<template>
  <PortalLayout
    :navItems="navItems"
    roleLabel="Express Admin"
    pageTitle="Finances"
    :userName="userName"
    :companyName="companyName"
    :unreadCount="unreadCount"
    @logout="handleLogout"
    @notifications="() => {}"
  >
    <div class="period-toggle">
      <button
        v-for="p in periods"
        :key="p.key"
        :class="{ active: period === p.key }"
        @click="period = p.key; loadData()"
      >{{ p.label }}</button>
    </div>

    <div class="stats-grid">
      <StatCard icon="fas fa-arrow-up" label="Revenue" :value="formatMoney(revenue)" :loading="loading" />
      <StatCard icon="fas fa-arrow-down" label="Expenses" :value="formatMoney(expenses)" :loading="loading" />
      <StatCard
        icon="fas fa-coins"
        label="Net Profit"
        :value="formatMoney(revenue - expenses)"
        :loading="loading"
        :highlight="revenue - expenses < 0"
      />
      <StatCard icon="fas fa-receipt" label="Transactions" :value="txCount" :loading="loading" />
    </div>

    <div class="panels">
      <div class="panel">
        <h3><i class="fas fa-arrow-up"></i> Revenue Breakdown</h3>
        <div v-if="loading" class="panel-loading"><i class="fas fa-spinner fa-spin"></i></div>
        <div v-else-if="!fareRows.length" class="panel-empty">No revenue data for this period</div>
        <table v-else class="mini-table">
          <thead><tr><th>Date</th><th>Route</th><th>Amount</th></tr></thead>
          <tbody>
            <tr v-for="f in fareRows.slice(0, 20)" :key="f.id">
              <td>{{ formatDate(f.tripDate || f.createdAt) }}</td>
              <td>{{ f.routeName || f.route || '—' }}</td>
              <td class="money green">RWF {{ Number(f.amount || 0).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel">
        <h3><i class="fas fa-arrow-down"></i> Expenses Breakdown</h3>
        <div v-if="loading" class="panel-loading"><i class="fas fa-spinner fa-spin"></i></div>
        <div v-else-if="!expenseRows.length" class="panel-empty">No expenses for this period</div>
        <table v-else class="mini-table">
          <thead><tr><th>Date</th><th>Category</th><th>Amount</th></tr></thead>
          <tbody>
            <tr v-for="e in expenseRows.slice(0, 20)" :key="e.id">
              <td>{{ formatDate(e.date || e.createdAt) }}</td>
              <td>{{ e.category || '—' }}</td>
              <td class="money red">RWF {{ Number(e.amount || 0).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </PortalLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PortalLayout from '../../components/shared/PortalLayout.vue'
import StatCard from '../../components/shared/StatCard.vue'
import { useAuth } from '../../composables/useAuth.js'
import { fareCollectionService } from '../../services/fareCollectionService.js'
import { expenseService } from '../../services/expenseService.js'
import { notificationService } from '../../services/notificationService.js'
import { companyService } from '../../services/companyService.js'
import { navItems } from './expressNav.js'

const auth = useAuth()
const cid = computed(() => auth.companyId.value)

const loading = ref(true)
const period = ref('today')
const revenue = ref(0)
const expenses = ref(0)
const txCount = ref(0)
const fareRows = ref([])
const expenseRows = ref([])
const unreadCount = ref(0)
const companyName = ref('')
const userName = computed(() => {
  const u = auth.currentUser.value
  return u ? `${u.firstName} ${u.lastName}` : ''
})

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

function getDateRange() {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  if (period.value === 'today') return { from: todayStr, to: todayStr }
  if (period.value === 'week') {
    const day = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    return { from: start.toISOString().split('T')[0], to: todayStr }
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: start.toISOString().split('T')[0], to: todayStr }
}

function formatMoney(v) {
  return `RWF ${Number(v || 0).toLocaleString()}`
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function filterByDate(items, dateField) {
  const { from, to } = getDateRange()
  return items.filter(item => {
    const d = (item[dateField] || item.createdAt || '').split('T')[0]
    return d >= from && d <= to
  })
}

async function loadData() {
  loading.value = true
  try {
    const [fares, exps, notifs, company] = await Promise.all([
      fareCollectionService.getByCompany(cid.value),
      expenseService.getByCompany(cid.value),
      notificationService.getUnread(auth.userId.value),
      companyService.getById(cid.value),
    ])

    const filteredFares = filterByDate(fares, 'tripDate')
    const filteredExps = filterByDate(exps, 'date')

    fareRows.value = filteredFares.sort((a, b) => new Date(b.tripDate || b.createdAt) - new Date(a.tripDate || a.createdAt))
    expenseRows.value = filteredExps.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))

    revenue.value = filteredFares.reduce((s, f) => s + (Number(f.amount) || 0), 0)
    expenses.value = filteredExps.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    txCount.value = filteredFares.length + filteredExps.length

    unreadCount.value = notifs.length
    companyName.value = company?.name || ''
  } catch {} finally {
    loading.value = false
  }
}

function handleLogout() { auth.logout('/express/login') }

onMounted(loadData)
</script>

<style scoped>
.period-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.period-toggle button {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.period-toggle button:hover { border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
.period-toggle button.active { background: #22c55e; color: #fff; border-color: #22c55e; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  overflow: hidden;
}

.panel h3 {
  margin: 0;
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.panel h3 i { margin-right: 8px; color: rgba(255,255,255,0.3); }

.panel-loading, .panel-empty {
  padding: 32px 20px;
  text-align: center;
  color: rgba(255,255,255,0.35);
  font-size: 13px;
}

.mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mini-table thead th {
  text-align: left;
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.02);
}
.mini-table tbody td {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
}
.money { font-weight: 600; font-family: monospace; }
.money.green { color: #22c55e; }
.money.red { color: #ef4444; }

@media (max-width: 768px) {
  .panels { grid-template-columns: 1fr; }
}
</style>
