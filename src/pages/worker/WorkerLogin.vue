<template>
  <div class="worker-login">
    <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
      <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </button>
    <div class="login-container">
      <div class="logo-area">
        <div class="logo-icon">
          <i class="fas fa-bus"></i>
        </div>
        <h1>On The Go</h1>
        <p class="tagline">Worker Portal</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="phone">Phone Number</label>
          <div class="input-wrapper">
            <i class="fas fa-phone"></i>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              placeholder="07X XXX XXXX"
              inputmode="tel"
              autocomplete="tel"
              required
            />
          </div>
        </div>

        <div class="input-group">
          <label for="pin">Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock"></i>
            <input
              id="pin"
              v-model="pin"
              type="password"
              placeholder="Enter password"
              autocomplete="current-password"
              required
            />
          </div>
        </div>

        <div v-if="error" class="error-banner">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <template v-else>
            <i class="fas fa-sign-in-alt"></i>
            Log In
          </template>
        </button>
      </form>

      <p class="footer-note">Contact your manager if you forgot your password</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { workerService } from '../../services/workerService.js'
import { useTheme } from '../../composables/useTheme.js'

const { isDark, toggle: toggleTheme } = useTheme()

const router = useRouter()

const phone = ref('')
const pin = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!pin.value) {
    error.value = 'Password is required'
    return
  }
  loading.value = true
  try {
    const worker = await workerService.login(phone.value.trim(), pin.value)
    if (!worker) {
      error.value = 'Invalid phone number or password'
      return
    }
    localStorage.setItem('workerSession', JSON.stringify(worker))
    router.push('/worker/dashboard')
  } catch {
    error.value = 'Connection error — check your network'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.worker-login {
  min-height: 100dvh;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
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

.login-container {
  width: 100%;
  max-width: 400px;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: #22c55e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
  margin-bottom: 16px;
}

.logo-area h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}

.tagline {
  margin: 4px 0 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.4);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 0 16px;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #22c55e;
}

.input-wrapper i {
  color: rgba(255, 255, 255, 0.25);
  font-size: 16px;
  flex-shrink: 0;
}

.input-wrapper input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 17px;
  padding: 16px 0;
  font-family: inherit;
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  color: #ef4444;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  padding: 18px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s;
  min-height: 56px;
  font-family: inherit;
}

.login-btn:active {
  background: #1da34d;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.footer-note {
  text-align: center;
  margin-top: 32px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.25);
}
</style>
