import { createService } from './api.js'

const service = createService('workers')
const usersService = createService('users')

function normalizePhone(raw) {
  return raw.replace(/[\s\-().]/g, '')
}

export const workerService = {
  ...service,

  getByPhone(phone) {
    return usersService.getAll({ phone: normalizePhone(phone), role: 'worker' }).then(w => w[0] || null)
  },

  async login(phone, password) {
    const clean = normalizePhone(phone)
    let users = await usersService.getAll({ phone: clean, role: 'worker' })

    if (!users.length) {
      const all = await usersService.getAll({ role: 'worker' })
      users = all.filter(u => normalizePhone(u.phone || '') === clean)
    }

    const user = users[0]
    if (!user || user.password !== password) return null
    if (!user.isActive && user.status !== 'active') return null
    return user
  },
}

export const scanLogService = createService('scanLogs')
export const workerSessionService = createService('workerSessions')
