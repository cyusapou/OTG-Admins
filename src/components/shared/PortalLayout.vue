<template>
  <div class="portal-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <aside class="portal-sidebar" :class="{ collapsed }">
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="fas fa-bus"></i></div>
        <div class="brand-text" v-if="!collapsed">
          <span class="brand-name">On The Go</span>
          <span class="brand-role">{{ roleLabel }}</span>
        </div>
      </div>

      <nav class="sidebar-links">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="sidebar-link"
          active-class="sidebar-link--active"
          :exact="item.exact"
        >
          <i :class="item.icon"></i>
          <span v-if="!collapsed">{{ item.label }}</span>
          <span v-if="!collapsed && item.badge" class="link-badge">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="sidebar-bottom">
        <button class="sidebar-toggle" @click="collapsed = !collapsed">
          <i :class="collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
        </button>
        <button class="sidebar-logout" @click="$emit('logout')">
          <i class="fas fa-sign-out-alt"></i>
          <span v-if="!collapsed">Logout</span>
        </button>
      </div>
    </aside>

    <div class="portal-main">
      <header class="portal-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <button class="theme-btn" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
          </button>
          <button class="notif-btn" @click="$emit('notifications')">
            <i class="fas fa-bell"></i>
            <span v-if="unreadCount" class="notif-badge">{{ unreadCount }}</span>
          </button>
          <div class="user-pill">
            <div class="user-avatar">{{ initials }}</div>
            <div class="user-info" v-if="userName">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ companyName || roleLabel }}</span>
            </div>
          </div>
        </div>
      </header>

      <main class="portal-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTheme } from '../../composables/useTheme.js'

const props = defineProps({
  navItems: { type: Array, default: () => [] },
  roleLabel: { type: String, default: '' },
  pageTitle: { type: String, default: '' },
  userName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  unreadCount: { type: Number, default: 0 },
})

defineEmits(['logout', 'notifications'])

const { isDark, toggle: toggleTheme } = useTheme()
const collapsed = ref(false)

const initials = computed(() => {
  if (!props.userName) return '?'
  return props.userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})
</script>

<style scoped>
.portal-shell {
  display: flex;
  min-height: 100vh;
  background: #0a0a0a;
  color: rgba(255,255,255,0.85);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.portal-sidebar {
  width: 240px;
  background: #141414;
  border-right: 1px solid rgba(255,255,255,0.07);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.25s ease;
}
.portal-sidebar.collapsed { width: 64px; }

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(34,197,94,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  font-size: 16px;
  flex-shrink: 0;
}
.brand-text { display: flex; flex-direction: column; }
.brand-name { font-weight: 700; font-size: 15px; }
.brand-role { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1px; }

.sidebar-links {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.sidebar-link:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); }
.sidebar-link--active { background: #22c55e; color: #fff !important; }
.sidebar-link--active:hover { background: #16a34a; }
.sidebar-link i { width: 20px; text-align: center; font-size: 15px; flex-shrink: 0; }
.link-badge {
  margin-left: auto;
  background: #22c55e;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}
.sidebar-link--active .link-badge { background: rgba(255,255,255,0.25); }

.sidebar-bottom {
  padding: 12px 8px;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sidebar-toggle, .sidebar-logout {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s ease;
}
.sidebar-toggle:hover, .sidebar-logout:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }

.portal-main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.25s ease;
}
.sidebar-collapsed .portal-main { margin-left: 64px; }

.portal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: #141414;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  position: sticky;
  top: 0;
  z-index: 50;
}
.page-title { font-size: 18px; font-weight: 700; margin: 0; }
.header-right { display: flex; align-items: center; gap: 16px; }

.theme-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}
.theme-btn:hover { background: rgba(255,255,255,0.04); color: #f59e0b; }

.notif-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s ease;
}
.notif-btn:hover { background: rgba(255,255,255,0.04); color: #22c55e; }
.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #22c55e;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #141414;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(34,197,94,0.15);
  color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 13px; font-weight: 600; }
.user-role { font-size: 11px; color: rgba(255,255,255,0.35); }

.portal-content { flex: 1; padding: 24px 28px; }

@media (max-width: 768px) {
  .portal-sidebar { width: 64px; }
  .portal-sidebar .brand-text,
  .portal-sidebar .sidebar-link span:not(.link-badge),
  .portal-sidebar .sidebar-logout span { display: none; }
  .portal-main { margin-left: 64px; }
  .portal-content { padding: 16px; }
  .user-info { display: none; }
}
</style>
