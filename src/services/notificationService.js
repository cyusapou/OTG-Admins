import { createService } from './api.js'

const service = createService('notifications')

export const notificationService = {
  ...service,

  getByUser(userId) {
    return service.getAll({ userId, _sort: 'createdAt', _order: 'desc' })
  },

  getUnread(userId) {
    return service.getAll({ userId, isRead: false })
  },

  markRead(id) {
    return service.patch(id, { isRead: true })
  },
}
