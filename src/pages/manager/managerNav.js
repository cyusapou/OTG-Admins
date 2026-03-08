// Manager: dashboard, teams (pair driver+worker), routes, drivers, workers, trips, buses, expenses, salaries, incidents.
export const navItems = [
  { path: '/manager', icon: 'fas fa-chart-pie', label: 'Dashboard', exact: true },
  { path: '/manager/teams', icon: 'fas fa-user-friends', label: 'Teams' },
  { path: '/manager/routes', icon: 'fas fa-road', label: 'Routes' },
  { path: '/manager/drivers', icon: 'fas fa-id-card', label: 'Drivers' },
  { path: '/manager/workers', icon: 'fas fa-hard-hat', label: 'Workers' },
  { path: '/manager/trips', icon: 'fas fa-route', label: 'Trips' },
  { path: '/manager/buses', icon: 'fas fa-bus', label: 'Buses' },
  { path: '/manager/expenses', icon: 'fas fa-receipt', label: 'Expenses' },
  { path: '/manager/salaries', icon: 'fas fa-money-bill-wave', label: 'Salaries' },
  { path: '/manager/incidents', icon: 'fas fa-exclamation-triangle', label: 'Incidents' },
]
