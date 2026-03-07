import { createService } from './api.js'

const service = createService('driverPerformance')

export const driverPerformanceService = {
  ...service,

  getByDriver(driverId, month) {
    return service.getAll({ driverId, month })
  },

  getByCompany(companyId, month) {
    return service.getAll({ companyId, month })
  },
}
