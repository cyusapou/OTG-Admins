import { createService } from './api.js'

const service = createService('users')

export const userService = {
  ...service,

  getByEmail(email) {
    return service.getAll({ email }).then(users => users[0] || null)
  },

  getByPhone(phone) {
    return service.getAll({ phone }).then(users => users[0] || null)
  },

  updateWallet(id, walletBalance) {
    return service.patch(id, { walletBalance })
  },
}
