import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ─── RURA PORTAL ─────────────────────
  { path: '/rura/login', component: () => import('./pages/rura/RuraLogin.vue') },
  { path: '/rura', component: () => import('./pages/rura/RuraDashboard.vue') },
  { path: '/rura/companies', component: () => import('./pages/rura/RuraCompanies.vue') },
  { path: '/rura/companies/new', component: () => import('./pages/rura/RuraCompanyNew.vue') },
  { path: '/rura/companies/:id', component: () => import('./pages/rura/RuraCompanyDetail.vue') },
  { path: '/rura/routes', redirect: '/rura' },
  { path: '/rura/finances', component: () => import('./pages/rura/RuraFinances.vue') },
  { path: '/rura/users', component: () => import('./pages/rura/RuraUsers.vue') },
  { path: '/rura/incidents', component: () => import('./pages/rura/RuraIncidents.vue') },
  { path: '/rura/audit', component: () => import('./pages/rura/RuraAudit.vue') },
  { path: '/rura/analytics', component: () => import('./pages/rura/RuraAnalytics.vue') },
  { path: '/rura/compliance', component: () => import('./pages/rura/RuraCompliance.vue') },
  { path: '/rura/announcements', component: () => import('./pages/rura/RuraAnnouncements.vue') },
  { path: '/rura/feedback', component: () => import('./pages/rura/RuraFeedback.vue') },
  { path: '/rura/expresses', component: () => import('./pages/rura/RuraExpresses.vue') },

  // ─── EXPRESS ADMIN PORTAL ─────────────
  { path: '/express/login', component: () => import('./pages/express/ExpressLogin.vue') },
  { path: '/express', component: () => import('./pages/express/ExpressDashboard.vue') },
  { path: '/express/managers', component: () => import('./pages/express/ExpressManagers.vue') },
  { path: '/express/managers/new', component: () => import('./pages/express/ExpressManagerNew.vue') },
  { path: '/express/depots', redirect: '/express' },
  { path: '/express/depots/new', redirect: '/express' },
  { path: '/express/routes', redirect: '/express' },
  { path: '/express/routes/new', redirect: '/express' },
  { path: '/express/buses', redirect: '/express' },
  { path: '/express/buses/new', redirect: '/express' },
  { path: '/express/drivers', redirect: '/express' },
  { path: '/express/workers', redirect: '/express' },
  { path: '/express/finances', redirect: '/express' },
  { path: '/express/incidents', redirect: '/express' },

  // ─── MANAGER PORTAL ───────────────────
  { path: '/manager/login', component: () => import('./pages/manager/ManagerLogin.vue') },
  { path: '/manager', component: () => import('./pages/manager/ManagerDashboard.vue') },
  { path: '/manager/drivers', component: () => import('./pages/manager/ManagerDrivers.vue') },
  { path: '/manager/drivers/new', component: () => import('./pages/manager/ManagerDriverNew.vue') },
  { path: '/manager/workers', component: () => import('./pages/manager/ManagerWorkers.vue') },
  { path: '/manager/workers/new', component: () => import('./pages/manager/ManagerWorkerNew.vue') },
  { path: '/manager/trips', component: () => import('./pages/manager/ManagerTrips.vue') },
  { path: '/manager/routes', component: () => import('./pages/manager/ManagerRoutes.vue') },
  { path: '/manager/routes/new', component: () => import('./pages/manager/ManagerRouteNew.vue') },
  { path: '/manager/buses', component: () => import('./pages/manager/ManagerBuses.vue') },
  { path: '/manager/buses/new', component: () => import('./pages/manager/ManagerBusNew.vue') },
  { path: '/manager/expenses', component: () => import('./pages/manager/ManagerExpenses.vue') },
  { path: '/manager/salaries', component: () => import('./pages/manager/ManagerSalaries.vue') },
  { path: '/manager/teams', component: () => import('./pages/manager/ManagerTeams.vue') },
  { path: '/manager/incidents', component: () => import('./pages/manager/ManagerIncidents.vue') },
  { path: '/manager/reports', component: () => import('./pages/manager/ManagerReports.vue') },
  { path: '/manager/schedule', component: () => import('./pages/manager/ManagerSchedule.vue') },
  // ─── DRIVER PORTAL ────────────────────
  { path: '/driver/login', component: () => import('./pages/driver/DriverLogin.vue') },
  { path: '/driver', component: () => import('./pages/driver/DriverDashboard.vue') },
  { path: '/driver/trip', component: () => import('./pages/driver/DriverTrip.vue') },
  { path: '/driver/history', component: () => import('./pages/driver/DriverHistory.vue') },
  { path: '/driver/profile', component: () => import('./pages/driver/DriverProfile.vue') },

  // ─── WORKER PORTAL ────────────────────
  { path: '/worker/login', component: () => import('./pages/worker/WorkerLogin.vue') },
  { path: '/worker', redirect: '/worker/dashboard' },
  { path: '/worker/dashboard', component: () => import('./pages/worker/WorkerDashboard.vue') },
  { path: '/worker/scan/:scheduleId', component: () => import('./pages/worker/WorkerScan.vue') },
  { path: '/worker/manifest/:scheduleId', component: () => import('./pages/worker/WorkerManifest.vue') },
  { path: '/worker/history', component: () => import('./pages/worker/WorkerHistory.vue') },

  // ─── PORTAL SELECTOR ─────────────────
  { path: '/', component: () => import('./pages/PortalSelector.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

import { createPinia } from 'pinia'
createApp(App).use(createPinia()).use(router).mount('#app')
