import { createService } from './api.js'

const service = createService('drivers')
const usersService = createService('users')

function normalizePhone(raw) {
  return raw.replace(/[\s\-().]/g, '')
}

export const driverService = {
  ...service,

  getByPhone(phone) {
    return usersService.getAll({ phone: normalizePhone(phone), role: 'driver' }).then(d => d[0] || null)
  },

  async login(phone, password) {
    const clean = normalizePhone(phone)
    let users = await usersService.getAll({ phone: clean, role: 'driver' })

    if (!users.length) {
      const all = await usersService.getAll({ role: 'driver' })
      users = all.filter(u => normalizePhone(u.phone || '') === clean)
    }

    const user = users[0]
    if (!user || user.password !== password) return null
    if (!user.isActive && user.status !== 'active') return null
    return user
  },
}

export const tripStatusService = createService('tripStatuses')
export const driverSessionService = createService('driverSessions')
