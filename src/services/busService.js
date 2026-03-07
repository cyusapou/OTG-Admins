import { createService } from './api.js'

const service = createService('buses')

export const busService = {
  ...service,

  getByCompany(companyId) {
    return service.getAll({ companyId, isActive: true })
  },
}
