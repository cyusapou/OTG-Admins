import { createService } from './api.js'

const service = createService('routes')

export const routeService = {
  ...service,

  getByCompany(companyId) {
    return service.getAll({ companyId, isActive: true })
  },

  getWithCompany(id) {
    return service.getById(id, { _expand: 'company' })
  },
}
