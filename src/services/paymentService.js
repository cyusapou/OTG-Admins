import { createService } from './api.js'

const service = createService('payments')

export const paymentService = {
  ...service,

  getByUser(userId) {
    return service.getAll({ userId, _sort: 'paidAt', _order: 'desc' })
  },

  getByBooking(bookingId) {
    return service.getAll({ bookingId })
  },
}
