import { createService } from './api.js'

const service = createService('plannedTrips')

export const plannedTripService = {
  ...service,

  getUpcoming(userId) {
    return service.getAll({ userId, status: 'upcoming', _sort: 'date', _order: 'asc' })
  },
}
