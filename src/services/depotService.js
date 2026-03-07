import { createService } from './api.js'

const service = createService('depots')

export const depotService = {
  ...service,

  getByCompany(companyId) {
    return service.getAll({ companyId })
  },
}
