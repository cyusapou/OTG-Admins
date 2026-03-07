import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { sessionService } from '../services/sessionService.js'
import { createService } from '../services/api.js'
import { auditLogService } from '../services/auditLogService.js'

const usersService = createService('users')

const SESSION_KEY = 'otg_session'

function getStored() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function useAuth() {
  const router = useRouter()
  const session = ref(getStored())
  const isLoading = ref(false)
  const error = ref('')

  const isLoggedIn = computed(() => !!session.value)
  const currentUser = computed(() => session.value?.user || null)
  const role = computed(() => session.value?.user?.role || null)
  const companyId = computed(() => session.value?.user?.companyId || null)
  const depotId = computed(() => session.value?.user?.depotId || null)
  const userId = computed(() => session.value?.user?.id || null)
  const mustChangePassword = computed(() => session.value?.user?.mustChangePassword === true)

  async function login(username, password, expectedRole) {
    isLoading.value = true
    error.value = ''
    try {
      const result = await sessionService.login(username, password)
      if (!result) {
        error.value = 'Invalid username or password'
        return false
      }
      if (expectedRole && result.user.role !== expectedRole) {
        error.value = 'Access denied for this portal'
        await sessionService.logout(result.session.id)
        return false
      }
      const data = { session: result.session, user: result.user }
      localStorage.setItem(SESSION_KEY, JSON.stringify(data))
      session.value = data

      await auditLogService.log(
        result.user.id, result.user.role, result.user.companyId,
        'login', 'session', result.session.id, `${result.user.firstName} logged in`
      )

      return true
    } catch {
      error.value = 'Network error. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout(redirectTo = '/') {
    if (session.value?.session?.id) {
      try {
        await auditLogService.log(
          session.value.user.id, session.value.user.role, session.value.user.companyId,
          'logout', 'session', session.value.session.id, `${session.value.user.firstName} logged out`
        )
        await sessionService.logout(session.value.session.id)
      } catch {}
    }
    localStorage.removeItem(SESSION_KEY)
    session.value = null
    router.push(redirectTo)
  }

  async function changePassword(newPassword) {
    if (!session.value?.user?.id) return
    await usersService.patch(session.value.user.id, {
      password: newPassword,
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    })
    session.value.user.mustChangePassword = false
    localStorage.setItem(SESSION_KEY, JSON.stringify(session.value))
  }

  function getLoginUrl() {
    const r = role.value
    if (r === 'rura') return '/rura/login'
    if (r === 'express_admin') return '/express/login'
    if (r === 'manager') return '/manager/login'
    if (r === 'driver') return '/driver/login'
    if (r === 'worker') return '/worker/login'
    return '/'
  }

  return {
    session, isLoading, error, isLoggedIn, currentUser, role,
    companyId, depotId, userId, mustChangePassword,
    login, logout, changePassword, getLoginUrl,
  }
}
