import { createService } from './api.js'

const service = createService('stops')

export const stopService = {
  ...service,

  getTerminals() {
    return service.getAll({ isTerminal: true })
  },

  getByCity(city) {
    return service.getAll({ city })
  },
}
