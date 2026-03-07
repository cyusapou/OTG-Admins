const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }

  const response = await fetch(url, config)
  if (!response.ok) {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

export function createService(resource) {
  return {
    getAll(params = {}) {
      const query = new URLSearchParams(params).toString()
      return request(`/${resource}${query ? `?${query}` : ''}`)
    },

    getById(id, params = {}) {
      const query = new URLSearchParams(params).toString()
      return request(`/${resource}/${id}${query ? `?${query}` : ''}`)
    },

    create(payload) {
      return request(`/${resource}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    update(id, payload) {
      return request(`/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    },

    patch(id, payload) {
      return request(`/${resource}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    },

    remove(id) {
      return request(`/${resource}/${id}`, { method: 'DELETE' })
    },

    search(q, params = {}) {
      return request(`/${resource}?q=${encodeURIComponent(q)}&${new URLSearchParams(params)}`)
    },
  }
}

export { BASE_URL, request }
