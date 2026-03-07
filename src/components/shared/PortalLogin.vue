<template>
  <div class="login-page">
    <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
      <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </button>
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-circle"><i class="fas fa-bus"></i></div>
        <h1>On The Go</h1>
        <p class="portal-label">{{ portalLabel }}</p>
      </div>

      <form @submit.prevent="$emit('submit', { username, password })" class="login-form">
        <div class="field">
          <label>Username</label>
          <div class="input-box">
            <i class="fas fa-user"></i>
            <input v-model="username" type="text" placeholder="Enter username" required autocomplete="username" />
          </div>
        </div>
        <div class="field">
          <label>Password</label>
          <div class="input-box">
            <i class="fas fa-lock"></i>
            <input v-model="password" type="password" placeholder="Enter password" required autocomplete="current-password" />
          </div>
        </div>

        <p v-if="error" class="err"><i class="fas fa-exclamation-circle"></i> {{ error }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <span v-else>Log In</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from '../../composables/useTheme.js'

const { isDark, toggle: toggleTheme } = useTheme()

defineProps({
  portalLabel: { type: String, default: 'Admin Portal' },
  error: String,
  loading: Boolean,
})
defineEmits(['submit'])

const username = ref('')
const password = ref('')
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 24px; background: #0a0a0a; position: relative;
}
.theme-toggle {
  position: absolute; top: 20px; right: 20px;
  width: 44px; height: 44px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.07); background: transparent;
  color: rgba(255,255,255,0.5); cursor: pointer; font-size: 18px;
  transition: all 0.2s ease; z-index: 10;
}
.theme-toggle:hover { color: #f59e0b; background: rgba(255,255,255,0.04); }
.login-card { width: 100%; max-width: 400px; }
.login-logo { text-align: center; margin-bottom: 36px; }
.logo-circle {
  width: 64px; height: 64px; border-radius: 18px;
  background: rgba(34,197,94,0.12); color: #22c55e;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; margin: 0 auto 14px;
}
.login-logo h1 { font-size: 26px; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0; }
.portal-label { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px; }

.field { margin-bottom: 18px; }
.field label { display: block; font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 6px; font-weight: 500; }
.input-box {
  display: flex; align-items: center; background: #141414;
  border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 0 14px;
  transition: border-color 0.2s;
}
.input-box:focus-within { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
.input-box i { color: rgba(255,255,255,0.25); font-size: 14px; margin-right: 10px; }
.input-box input {
  flex: 1; background: transparent; border: none; outline: none;
  color: rgba(255,255,255,0.85); font-size: 15px; padding: 13px 0; min-height: 46px;
}
.input-box input::placeholder { color: rgba(255,255,255,0.2); }

.err { color: #ef4444; font-size: 13px; text-align: center; margin-bottom: 14px; }

.btn-login {
  width: 100%; padding: 14px; border: none; border-radius: 10px;
  background: #22c55e; color: #fff; font-size: 16px; font-weight: 600;
  cursor: pointer; min-height: 48px; transition: background 0.2s;
}
.btn-login:hover:not(:disabled) { background: #16a34a; }
.btn-login:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
