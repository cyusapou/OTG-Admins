<template>
  <div class="driver-login">
    <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
      <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </button>
    <div class="login-card">
      <div class="logo-section">
        <div class="logo-icon">
          <i class="fas fa-bus"></i>
        </div>
        <h1>On The Go</h1>
        <p class="subtitle">Driver Portal</p>
      </div>

      <div v-if="isOffline" class="offline-banner">
        <i class="fas fa-wifi"></i> No internet connection
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Phone Number</label>
          <div class="input-wrapper">
            <i class="fas fa-phone"></i>
            <input
              v-model="phone"
              type="tel"
              placeholder="+250 788 xxx xxx"
              required
              autocomplete="tel"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock"></i>
            <input
              v-model="pin"
              type="password"
              placeholder="Enter password"
              required
            />
          </div>
        </div>

        <p v-if="error" class="error-msg">
          <i class="fas fa-exclamation-circle"></i> {{ error }}
        </p>

        <button type="submit" class="btn-login" :disabled="isLoading">
          <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
          <span v-else>Log In</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { driverService } from '../../services/driverService.js'
import { useOffline } from '../../composables/useOffline.js'
import { useTheme } from '../../composables/useTheme.js'

const { isDark, toggle: toggleTheme } = useTheme()

const router = useRouter()
const { isOffline } = useOffline()

const phone = ref('')
const pin = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
  error.value = ''
  isLoading.value = true
  try {
    const driver = await driverService.login(phone.value.trim(), pin.value)
    if (!driver) {
      error.value = 'Invalid phone number or password'
      return
    }
    const session = {
      ...driver,
      loginAt: new Date().toISOString(),
      role: 'driver',
    }
    localStorage.setItem('driverSession', JSON.stringify(session))
    router.push('/driver')
  } catch {
    error.value = 'Network error. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.driver-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #0a0a0a;
  position: relative;
}
.theme-toggle {
  position: absolute; top: 20px; right: 20px;
  width: 44px; height: 44px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.07); background: transparent;
  color: rgba(255,255,255,0.5); cursor: pointer; font-size: 18px;
  transition: all 0.2s ease; z-index: 10;
}
.theme-toggle:hover { color: #f59e0b; background: rgba(255,255,255,0.04); }
.login-card {
  width: 100%;
  max-width: 400px;
}
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}
.logo-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(34, 197, 94, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 32px;
  color: #22c55e;
}
.logo-section h1 {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  margin: 0;
}
.logo-section .subtitle {
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
}
.offline-banner {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  padding: 10px 16px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 20px;
  font-size: 14px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  color: rgba(255,255,255,0.4);
  font-size: 13px;
  margin-bottom: 8px;
  font-weight: 500;
}
.input-wrapper {
  display: flex;
  align-items: center;
  background: #141414;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 0 16px;
  transition: border-color 0.2s;
}
.input-wrapper:focus-within {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
}
.input-wrapper i {
  color: rgba(255,255,255,0.3);
  font-size: 16px;
  margin-right: 12px;
}
.input-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: rgba(255,255,255,0.85);
  font-size: 16px;
  padding: 14px 0;
  min-height: 48px;
}
.input-wrapper input::placeholder {
  color: rgba(255,255,255,0.25);
}
.error-msg {
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}
.btn-login {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: #22c55e;
  color: #fff;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  min-height: 52px;
  transition: background 0.2s;
}
.btn-login:hover:not(:disabled) {
  background: #16a34a;
}
.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
