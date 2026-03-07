<template>
  <div class="driver-dashboard bg-white dark:bg-neutral-950 transition-colors">
    <div class="page-header">
      <h2><i class="fas fa-car"></i> Good morning, {{ driver.firstName }}</h2>
      <p class="subtitle">Here's your activity for today</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <StatsCard icon="fas fa-bus" label="Today's Trips" value="4" trend="2 completed" />
      <StatsCard icon="fas fa-star" label="Rating" value="4.8" trend="Excellent" />
      <StatsCard icon="fas fa-coins" label="Earnings Today" value="KES 3,240" trend="+12% vs avg" />
      <StatsCard icon="fas fa-map-marker-alt" label="Distance Covered" value="245 km" trend="On track" />
    </div>

    <!-- Status Toggle -->
    <div class="card status-card">
      <h3>Your Status</h3>
      <div class="status-buttons">
        <button
          v-for="s in ['Online', 'On Break', 'Offline']"
          :key="s"
          :class="['status-btn', { active: driverStatus === s }]"
          @click="setStatus(s)"
        >
          {{ s }}
        </button>
      </div>
    </div>

    <!-- Today's Trip -->
    <div class="card trip-card" v-if="todayTrip">
      <div class="trip-header">
        <h3><i class="fas fa-rocket"></i> Current Trip</h3>
        <span class="status-badge">In Progress</span>
      </div>
      <div class="trip-info">
        <p><strong>Route:</strong> {{ todayTrip.routeName }}</p>
        <p><strong>Departure:</strong> {{ todayTrip.departureTime }}</p>
        <p><strong>Passengers:</strong> {{ todayTrip.passengerCount }} / 50</p>
        <p><strong>Next Stop:</strong> Kigali Interchange - 15 km away</p>
      </div>
      <button
        class="trip-action-btn"
        :class="tripActive ? 'btn-end' : 'btn-start'"
        @click="toggleTrip"
      >
        <i :class="tripActive ? 'fas fa-stop-circle' : 'fas fa-rocket'"></i> {{ tripActive ? 'End Trip' : 'Start Trip' }}
      </button>
    </div>

    <div class="card" v-else>
      <p>No trip assigned for today.</p>
    </div>

    <!-- Recent Trips Summary -->
    <div class="card">
      <h3><i class="fas fa-clipboard-list"></i> Last 5 Trips Summary</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Route</th>
            <th>Passengers</th>
            <th>Rating</th>
            <th>Earnings</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Today</td>
            <td>Kigali → Muhanga</td>
            <td>45</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td>KES 800</td>
          </tr>
          <tr>
            <td>Yesterday</td>
            <td>Muhanga → Kigali</td>
            <td>48</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td>KES 850</td>
          </tr>
          <tr>
            <td>2 days ago</td>
            <td>Kigali → Butare</td>
            <td>50</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td>KES 1,200</td>
          </tr>
          <tr>
            <td>3 days ago</td>
            <td>Butare → Kigali</td>
            <td>42</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td>KES 900</td>
          </tr>
          <tr>
            <td>4 days ago</td>
            <td>Kigali → Musanze</td>
            <td>46</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td>KES 950</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '../../store/index.js'
import StatsCard from '../../components/admin/StatsCard.vue'

const driverStatus = ref('Online')
const tripActive = ref(false)

const driver = computed(() => store.user || { firstName: 'Driver' })

const todayTrip = ref({
  routeName: 'Kigali - Muhanga',
  departureTime: '08:00 AM',
  passengerCount: 45,
})

function setStatus(status) {
  driverStatus.value = status
}

function toggleTrip() {
  tripActive.value = !tripActive.value
}
</script>

<style scoped>
.driver-dashboard {
  display: grid;
  gap: 24px;
}

.page-header {
  margin-bottom: 12px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #1a202c;
}

.subtitle {
  margin: 0;
  color: #5a6c7d;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 12px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.trip-header h3 {
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-buttons {
  display: flex;
  gap: 12px;
}

.status-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e8ecf1;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.status-btn.active {
  background: #2E7D32;
  color: white;
  border-color: #2E7D32;
}

.status-btn:hover {
  border-color: #2E7D32;
}

.trip-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f6fa;
  border-radius: 8px;
}

.trip-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #1a202c;
}

.trip-action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.trip-action-btn.btn-start {
  background: #2E7D32;
  color: white;
}

.trip-action-btn.btn-start:hover {
  background: #1B5E20;
}

.trip-action-btn.btn-end {
  background: #ef4444;
  color: white;
}

.trip-action-btn.btn-end:hover {
  background: #dc2626;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: #f5f6fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #424242;
  border-bottom: 1px solid #e8ecf1;
  font-size: 12px;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.data-table tbody tr:hover {
  background: #fafafa;
}
</style>
