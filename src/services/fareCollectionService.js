import { createService } from './api.js'

const service = createService('fareCollections')

export const fareCollectionService = {
  ...service,

  getByCompany(companyId, params = {}) {
    return service.getAll({ companyId, ...params })
  },

  getByDepot(depotId, params = {}) {
    return service.getAll({ depotId, ...params })
  },

  getByDate(tripDate) {
    return service.getAll({ tripDate })
  },
}
