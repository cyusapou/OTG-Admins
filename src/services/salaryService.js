import { createService } from './api.js'

const service = createService('salaries')

export const salaryService = {
  ...service,

  getByCompany(companyId, month) {
    return service.getAll({ companyId, month })
  },

  getByDepot(depotId, month) {
    return service.getAll({ depotId, month })
  },

  markPaid(id, paidBy) {
    return service.patch(id, { status: 'paid', paidAt: new Date().toISOString(), paidBy })
  },
}
