import { defineStore } from 'pinia'
import { ref } from 'vue'
import aiService from '../services/ai.js'

export const useAIStore = defineStore('ai', () => {
  const isOpen = ref(false)
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)

  const toggleChat = () => {
    isOpen.value = !isOpen.value
  }

  const addMessage = (role, content) => {
    messages.value.push({ role, content, timestamp: new Date() })
  }

  const sendMessage = async (text) => {
    if (loading.value) return
    loading.value = true
    error.value = null
    addMessage('user', text)

    try {
      const response = await aiService.chat({ message: text })
      addMessage('assistant', response.message || JSON.stringify(response))
      if (response.result) addMessage('system', `Created: ${JSON.stringify(response.result)}`)
      if (response.confirmation) addMessage('assistant', response.confirmation)
    } catch (err) {
      error.value = err.message
      addMessage('assistant', 'Error: ' + err.message)
    } finally {
      loading.value = false
    }
  }

  const closeChat = () => {
    isOpen.value = false
    messages.value = []
  }

  return { isOpen, messages, loading, error, toggleChat, sendMessage, closeChat, addMessage }
})

