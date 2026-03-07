<template>
  <div class="cp-page">
    <div class="cp-card">
      <div class="cp-icon"><i class="fas fa-key"></i></div>
      <h2>Set Your Password</h2>
      <p>You must set a new password before continuing.</p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label>New Password</label>
          <input v-model="pw" type="password" placeholder="Minimum 6 characters" required minlength="6" />
        </div>
        <div class="field">
          <label>Confirm Password</label>
          <input v-model="confirm" type="password" placeholder="Re-enter password" required />
        </div>
        <p v-if="err" class="err">{{ err }}</p>
        <button type="submit" class="btn-save" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <span v-else>Set Password & Continue</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['change'])
const props = defineProps({ loading: Boolean })

const pw = ref('')
const confirm = ref('')
const err = ref('')

function handleSubmit() {
  if (pw.value.length < 6) { err.value = 'Password must be at least 6 characters'; return }
  if (pw.value !== confirm.value) { err.value = 'Passwords do not match'; return }
  err.value = ''
  emit('change', pw.value)
}
</script>

<style scoped>
.cp-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #0a0a0a; padding: 24px;
}
.cp-card { width: 100%; max-width: 400px; text-align: center; }
.cp-icon {
  width: 60px; height: 60px; border-radius: 16px;
  background: rgba(34,197,94,0.12); color: #22c55e;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; margin: 0 auto 16px;
}
.cp-card h2 { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0 0 6px; }
.cp-card > p { font-size: 14px; color: rgba(255,255,255,0.4); margin: 0 0 28px; }

.field { margin-bottom: 16px; text-align: left; }
.field label { display: block; font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
.field input {
  width: 100%; padding: 13px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07);
  background: #141414; color: rgba(255,255,255,0.85); font-size: 15px; outline: none;
  transition: border-color 0.2s; box-sizing: border-box;
}
.field input:focus { border-color: #22c55e; }
.field input::placeholder { color: rgba(255,255,255,0.2); }
.err { color: #ef4444; font-size: 13px; margin-bottom: 12px; }
.btn-save {
  width: 100%; padding: 14px; border: none; border-radius: 10px;
  background: #22c55e; color: #fff; font-size: 16px; font-weight: 600;
  cursor: pointer; min-height: 48px;
}
.btn-save:hover:not(:disabled) { background: #16a34a; }
.btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
