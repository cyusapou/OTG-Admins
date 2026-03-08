// Express Admin: only add managers and see express status (dashboard).
// Routes, fleet, drivers, workers, etc. are managed by Manager.
export const navItems = [
  { path: '/express', icon: 'fas fa-chart-pie', label: 'Dashboard', exact: true },
  { path: '/express/managers', icon: 'fas fa-user-tie', label: 'Managers' },
]
