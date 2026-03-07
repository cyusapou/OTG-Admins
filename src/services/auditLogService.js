import { createService } from './api.js'

const service = createService('auditLogs')

export const auditLogService = {
  ...service,

  log(userId, userRole, companyId, action, targetType, targetId, description, metadata = {}) {
    return service.create({
      userId, userRole, companyId, action, targetType, targetId,
      description, metadata, ipAddress: null,
      createdAt: new Date().toISOString(),
    })
  },

  getByCompany(companyId, params = {}) {
    return service.getAll({ companyId, _sort: 'createdAt', _order: 'desc', ...params })
  },

  getRecent(limit = 50) {
    return service.getAll({ _sort: 'createdAt', _order: 'desc', _limit: limit })
  },
}
