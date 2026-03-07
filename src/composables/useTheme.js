import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'otg-admin-theme'

const isDark = ref(true)

function init() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light') {
    isDark.value = false
  } else if (saved === 'dark') {
    isDark.value = true
  }
  apply()
}

function apply() {
  const html = document.documentElement
  if (isDark.value) {
    html.classList.remove('light')
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
    html.classList.add('light')
  }
}

function toggle() {
  isDark.value = !isDark.value
  localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  apply()
}

init()

export function useTheme() {
  return { isDark, toggle }
}
