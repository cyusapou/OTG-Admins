import { createService } from './api.js'

const service = createService('schedules')

export const scheduleService = {
  ...service,

  getByRoute(routeId) {
    return service.getAll({ routeId, isActive: true })
  },

  getByCompany(companyId) {
    return service.getAll({ companyId, isActive: true })
  },

  getDetailed(id) {
    return service.getById(id)
  },
}
