<template>
  <div class="page bg-white dark:bg-neutral-950 transition-colors">
    <div class="page-header">
      <h1><i class="fas fa-file-alt"></i> Trip History</h1>
      <p class="subtitle">View all your completed trips</p>
    </div>

    <div class="card">
      <h3><i class="fas fa-file-alt"></i> Recent Trips</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Route</th>
            <th>Passengers</th>
            <th>Distance</th>
            <th>Earnings</th>
            <th>Rating</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mar 5, 2024</td>
            <td>Nairobi → Mombasa</td>
            <td>45</td>
            <td>145 km</td>
            <td>KES 2,100</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge">Completed</span></td>
          </tr>
          <tr>
            <td>Mar 4, 2024</td>
            <td>Mombasa → Nairobi</td>
            <td>48</td>
            <td>145 km</td>
            <td>KES 2,150</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge">Completed</span></td>
          </tr>
          <tr>
            <td>Mar 3, 2024</td>
            <td>Nairobi → Kisumu</td>
            <td>42</td>
            <td>245 km</td>
            <td>KES 2,950</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge">Completed</span></td>
          </tr>
          <tr>
            <td>Mar 2, 2024</td>
            <td>Kisumu → Nairobi</td>
            <td>50</td>
            <td>245 km</td>
            <td>KES 2,900</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge">Completed</span></td>
          </tr>
          <tr>
            <td>Mar 1, 2024</td>
            <td>Nairobi → Nakuru</td>
            <td>38</td>
            <td>168 km</td>
            <td>KES 1,890</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge">Completed</span></td>
          </tr>
        </tbody>
      </table>
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

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  background: #f5f6fa;
  padding: 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #424242;
  border-bottom: 1px solid #e8ecf1;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
</style>
