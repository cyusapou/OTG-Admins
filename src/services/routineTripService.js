import { createService } from './api.js'

const service = createService('routineTrips')

export const routineTripService = {
  ...service,

  getByUser(userId) {
    return service.getAll({ userId, isActive: true })
  },
}
