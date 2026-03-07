import { createService } from './api.js'

const service = createService('incidents')

export const incidentService = {
  ...service,

  getByCompany(companyId, params = {}) {
    return service.getAll({ companyId, ...params })
  },

  getByDepot(depotId, params = {}) {
    return service.getAll({ depotId, ...params })
  },

  getOpen(companyId) {
    return service.getAll({ companyId, status: 'open', _sort: 'createdAt', _order: 'desc' })
  },

  resolve(id, resolvedBy, resolution) {
    return service.patch(id, { status: 'resolved', resolvedBy, resolvedAt: new Date().toISOString(), resolution })
  },
}
