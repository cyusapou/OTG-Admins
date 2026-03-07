import { createService } from './api.js'

const service = createService('routeApprovals')

export const routeApprovalService = {
  ...service,

  getPending() {
    return service.getAll({ status: 'pending', _sort: 'submittedAt', _order: 'desc' })
  },

  getByCompany(companyId) {
    return service.getAll({ companyId })
  },

  approve(id, reviewedBy) {
    return service.patch(id, {
      status: 'approved', reviewedAt: new Date().toISOString(),
      reviewedBy, approvedAt: new Date().toISOString(),
    })
  },

  reject(id, reviewedBy, rejectionReason) {
    return service.patch(id, {
      status: 'rejected', reviewedAt: new Date().toISOString(),
      reviewedBy, rejectionReason,
    })
  },
}
