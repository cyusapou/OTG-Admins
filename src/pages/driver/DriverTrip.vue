<template>
  <div class="page bg-white dark:bg-neutral-950 transition-colors">
    <div class="page-header">
      <h1><i class="fas fa-bus"></i> My Active Trip</h1>
      <p class="subtitle">Real-time trip tracking and management</p>
    </div>

    <div class="trip-container">
      <!-- Trip Header -->
      <div class="card trip-header-card">
        <div class="trip-title">
          <h2>Nairobi Airport → Mombasa CBD</h2>
          <span class="trip-status">In Progress - 45 km remaining</span>
        </div>
        <div class="trip-meta">
          <div class="meta-item">
            <span class="label">Trip ID:</span>
            <span class="value">TRP001</span>
          </div>
          <div class="meta-item">
            <span class="label">Started:</span>
            <span class="value">02:00 PM</span>
          </div>
          <div class="meta-item">
            <span class="label">Estimated Arrival:</span>
            <span class="value">04:15 PM</span>
          </div>
        </div>
      </div>

      <!-- Trip Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Passengers Onboard</div>
          <div class="stat-value">45</div>
          <div class="stat-sub">out of 50 seats</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Distance Covered</div>
          <div class="stat-value">120 km</div>
          <div class="stat-sub">145 km total</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Speed</div>
          <div class="stat-value">95 km/h</div>
          <div class="stat-sub">Speed limit: 120</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Trip Time</div>
          <div class="stat-value">1h 16m</div>
          <div class="stat-sub">ETA: 2h 15m</div>
        </div>
      </div>

      <!-- Route Info -->
      <div class="card">
        <h3><i class="fas fa-sticky-note"></i> Route Information</h3>
        <div class="route-info">
          <div class="route-stop">
            <span class="stop-number">1</span>
            <div class="stop-details">
              <div class="stop-name">Nairobi Airport</div>
              <div class="stop-time">14:00 - Departed</div>
            </div>
          </div>
          <div class="route-connector"></div>
          <div class="route-stop current">
            <span class="stop-number">2</span>
            <div class="stop-details">
              <div class="stop-name">Mombasa Rest Stop</div>
              <div class="stop-time">15:45 - Upcoming (23 km away)</div>
            </div>
          </div>
          <div class="route-connector"></div>
          <div class="route-stop">
            <span class="stop-number">3</span>
            <div class="stop-details">
              <div class="stop-name">Mombasa CBD</div>
              <div class="stop-time">16:15 - Final destination</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card actions-card">
        <h3><i class="fas fa-bolt"></i> Emergency Actions</h3>
        <div class="action-buttons">
          <button class="btn btn-primary">Report Issue</button>
          <button class="btn btn-warning">Request Assistance</button>
          <button class="btn btn-danger">Emergency Stop</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.subtitle {
  margin: 0;
  color: #757575;
  font-size: 13px;
}

.trip-container {
  display: grid;
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e8ecf1;
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.trip-header-card {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  color: white;
  padding: 32px;
}

.trip-title h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
}

.trip-status {
  display: block;
  font-size: 13px;
  opacity: 0.9;
}

.trip-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-item .label {
  font-size: 12px;
  opacity: 0.8;
}

.meta-item .value {
  font-size: 16px;
  font-weight: 600;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e8ecf1;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #757575;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2e7d32;
  margin-bottom: 4px;
}

.stat-sub {
  font-size: 11px;
  color: #b0bec5;
}

.route-info {
  display: grid;
  gap: 0;
}

.route-stop {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.route-stop:last-child {
  border-bottom: none;
}

.route-stop.current {
  background: #f5f6fa;
  padding: 16px;
  border-radius: 8px;
  border-bottom: none;
  margin-bottom: 8px;
}

.stop-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #2e7d32;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.route-stop.current .stop-number {
  background: #ff9800;
}

.stop-details {
  flex: 1;
}

.stop-name {
  font-weight: 600;
  color: #212121;
  margin-bottom: 4px;
}

.stop-time {
  font-size: 12px;
  color: #757575;
}

.route-connector {
  height: 8px;
  width: 2px;
  background: #e8ecf1;
  margin-left: 16px;
}

.actions-card {
  border: 2px solid #fff3e0;
  background: #fffaf0;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-primary {
  background: #2e7d32;
  color: white;
}

.btn-primary:hover {
  background: #1b5e20;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-warning:hover {
  background: #f57c00;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}
</style>
