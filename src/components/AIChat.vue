<template>
  <div class="ai-chat-container fixed bottom-6 right-6 z-50 w-80 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl transition-all duration-300" v-if="aiStore.isOpen">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <i class="fas fa-robot text-sm"></i>
          </div>
          <div>
            <h3 class="font-semibold text-sm">AI Assistant</h3>
            <p class="text-xs opacity-90">Gemini powered - Admin</p>
          </div>
        </div>
        <button @click="aiStore.closeChat" class="p-1 hover:bg-white/20 rounded-full transition">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div class="h-80 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      <div v-if="aiStore.messages.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
        <i class="fas fa-robot text-3xl mb-2 opacity-50"></i>
        <p class="text-sm">Admin: Register companies, drivers, buses... or ask for help!</p>
      </div>
      <div v-else v-for="msg in aiStore.messages" :key="msg.timestamp" :class="['p-3 rounded-lg text-sm max-w-[90%]', msg.role === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-100 dark:bg-gray-700 text-gray-900']">
        <div v-html="msg.content.replace(/\n/g, '<br>')"></div>
        <div class="text-xs opacity-70 mt-1">{{ formatTime(msg.timestamp) }}</div>
      </div>
      <div v-if="aiStore.loading" class="flex space-x-1 text-sm text-gray-500">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
      </div>
      <div v-if="aiStore.error" class="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
        {{ aiStore.error }}
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div class="flex space-x-2">
        <input 
          v-model="inputText" 
          @keyup.enter="send"
          :disabled="aiStore.loading"
          placeholder="Type message... (Create company Acme Corp)"
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800"
        >
        <button @click="send" :disabled="aiStore.loading || !inputText.trim()" class="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center">
          <i v-if="!aiStore.loading" class="fas fa-paper-plane text-sm"></i>
          <i v-else class="fas fa-spinner fa-spin text-sm"></i>
        </button>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Fast entity registration & system help</p>
    </div>
  </div>

  <!-- Floating Button -->
  <button 
    @click="aiStore.toggleChat" 
    class="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-2xl border-4 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-3xl active:scale-95"
    :class="{ 'animate-ping': !aiStore.isOpen }"
    title="AI Assistant"
  >
    <i class="fas fa-robot text-xl"></i>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAIStore } from '../stores/ai.js'

const aiStore = useAIStore()
const inputText = ref('')

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const send = () => {
  if (inputText.value.trim() && !aiStore.loading) {
    aiStore.sendMessage(inputText.value)
    inputText.value = ''
  }
}

onMounted(() => {
  // Preload
})
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}
</style>

