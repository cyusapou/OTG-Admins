import { createService } from './api.js'

const service = createService('companies')

export const companyService = {
  ...service,

  getActive() {
    return service.getAll({ isActive: true })
  },

  getWithRoutes(id) {
    return service.getById(id, { _embed: 'routes' })
  },
}
