import { reactive } from 'vue'

export const store = reactive({
  user: null,
  token: null,
  userRole: null,
  isDarkMode: true,
  sidebarOpen: true,
})
