<template>
  <div class="selector-page">
    <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
      <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
    </button>
    <div class="selector-container">
      <div class="selector-brand">
        <div class="brand-icon"><i class="fas fa-bus"></i></div>
        <h1>On The Go</h1>
        <p class="brand-sub">Administration Portal</p>
      </div>

      <div class="portals-grid">
        <router-link to="/rura/login" class="portal-card">
          <div class="portal-icon rura"><i class="fas fa-landmark"></i></div>
          <h3>RURA</h3>
          <p>Regulatory Authority</p>
        </router-link>

        <router-link to="/express/login" class="portal-card">
          <div class="portal-icon express"><i class="fas fa-building"></i></div>
          <h3>Express Admin</h3>
          <p>Company Management</p>
        </router-link>

        <router-link to="/manager/login" class="portal-card">
          <div class="portal-icon manager"><i class="fas fa-user-tie"></i></div>
          <h3>Manager</h3>
          <p>Depot Operations</p>
        </router-link>

        <router-link to="/driver/login" class="portal-card">
          <div class="portal-icon driver"><i class="fas fa-id-card"></i></div>
          <h3>Driver</h3>
          <p>Trip Management</p>
        </router-link>

        <router-link to="/worker/login" class="portal-card">
          <div class="portal-icon worker"><i class="fas fa-qrcode"></i></div>
          <h3>Worker</h3>
          <p>Ticket Scanning</p>
        </router-link>
      </div>

      <div class="selector-footer">
        <p>On The Go Rwanda — Powered by RURA</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js'
const { isDark, toggle: toggleTheme } = useTheme()
</script>

<style scoped>
.selector-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  padding: 32px 16px;
  position: relative;
}
.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
  z-index: 10;
}
.theme-toggle:hover { color: #f59e0b; background: rgba(255,255,255,0.04); }

.selector-container {
  max-width: 720px;
  width: 100%;
  text-align: center;
}

.selector-brand {
  margin-bottom: 48px;
}
.brand-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 16px;
}
.selector-brand h1 {
  font-size: 28px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}
.brand-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
}

.portals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.portal-card {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 28px 16px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.portal-card:hover {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.04);
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.08);
  transform: translateY(-2px);
}
.portal-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.portal-card p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

.portal-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.portal-icon.rura { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.portal-icon.express { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.portal-icon.manager { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.portal-icon.driver { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.portal-icon.worker { background: rgba(34, 197, 94, 0.12); color: #22c55e; }

.selector-footer {
  margin-top: 48px;
}
.selector-footer p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
}

@media (max-width: 640px) {
  .portals-grid {
    grid-template-columns: 1fr 1fr;
  }
  .selector-brand { margin-bottom: 32px; }
}
</style>
