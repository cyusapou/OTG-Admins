import axios from 'axios'
// For admins, assume global window.apiBase or localStorage token - adjust if store exists
// For now, simple with optional token from localStorage

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const GEMINI_API_KEY = 'AIzaSyCeQBlgEW8Ql1LCg3bcgh0lRrWZ7mOXx04'

const aiService = axios.create({
  baseURL: `${BASE}/ai`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

aiService.interceptors.request.use((config) => {
  const sessionData = localStorage.getItem('otg_session')
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData)
      const token = session.session?.id
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      // Invalid session data, continue without token
    }
  }
  return config
})

export default {
  async chat(data) {
    const response = await aiService.post('/chat', data)
    return response.data
  }
}

