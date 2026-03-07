<template>
  <ChangePassword
    v-if="showChangePassword"
    :loading="changingPw"
    @change="handleChangePassword"
  />
  <PortalLogin
    v-else
    portalLabel="RURA Admin"
    :error="auth.error.value"
    :loading="auth.isLoading.value"
    @submit="handleLogin"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PortalLogin from '../../components/shared/PortalLogin.vue'
import ChangePassword from '../../components/shared/ChangePassword.vue'
import { useAuth } from '../../composables/useAuth.js'

const router = useRouter()
const auth = useAuth()
const showChangePassword = ref(false)
const changingPw = ref(false)

async function handleLogin({ username, password }) {
  const ok = await auth.login(username, password, 'rura')
  if (!ok) return
  if (auth.mustChangePassword.value) {
    showChangePassword.value = true
    return
  }
  router.push('/rura')
}

async function handleChangePassword(newPassword) {
  changingPw.value = true
  try {
    await auth.changePassword(newPassword)
    router.push('/rura')
  } catch {
    changingPw.value = false
  }
}
</script>
