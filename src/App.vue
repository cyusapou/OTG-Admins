<template>
  <router-view />
  <AIChat />
</template>

<script setup>
import AIChat from './components/AIChat.vue'
</script>

<style>
html, body, #app {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}
</style>
