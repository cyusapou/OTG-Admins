import { createService } from './api.js'

const service = createService('expenses')

export const expenseService = {
  ...service,

  getByCompany(companyId, params = {}) {
    return service.getAll({ companyId, ...params })
  },

  getByDepot(depotId, params = {}) {
    return service.getAll({ depotId, ...params })
  },
}
