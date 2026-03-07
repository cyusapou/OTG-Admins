import { createService, request } from './api.js'

const service = createService('sessions')
const usersService = createService('users')

export const sessionService = {
  ...service,

  async login(username, password) {
    const users = await usersService.getAll({ username })
    const user = users[0]
    if (!user || user.password !== password) return null
    if (!user.isActive) return null

    const session = await service.create({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
      depotId: user.depotId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    })

    await usersService.patch(user.id, { lastLoginAt: new Date().toISOString() })

    return { session, user }
  },

  async validate(sessionId) {
    try {
      const session = await service.getById(sessionId)
      if (new Date(session.expiresAt) < new Date()) {
        await service.remove(sessionId)
        return null
      }
      return session
    } catch {
      return null
    }
  },

  async logout(sessionId) {
    try { await service.remove(sessionId) } catch {}
  },
}
