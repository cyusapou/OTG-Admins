<template>
  <div class="page">
    <div class="page-header">
      <h1><i class="fas fa-building"></i> Express Companies Registry</h1>
      <p class="subtitle">Manage and monitor all registered express operators</p>
    </div>

    <div class="card">
      <h3><i class="fas fa-building"></i> Active Express Companies</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>License #</th>
            <th>Headquarters</th>
            <th>Active Buses</th>
            <th>Employees</th>
            <th>Safety Rating</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>On The Go Express</strong></td>
            <td>EXPR-2020-001</td>
            <td>Nairobi</td>
            <td>28</td>
            <td>142</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge green"><i class="fas fa-check"></i> Compliant</span></td>
          </tr>
          <tr>
            <td><strong>Safaris East</strong></td>
            <td>EXPR-2019-002</td>
            <td>Mombasa</td>
            <td>22</td>
            <td>95</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge green"><i class="fas fa-check"></i> Compliant</span></td>
          </tr>
          <tr>
            <td><strong>Crown Coaches</strong></td>
            <td>EXPR-2021-003</td>
            <td>Kisumu</td>
            <td>18</td>
            <td>78</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></td>
            <td><span class="badge orange"><i class="fas fa-exclamation-triangle"></i> Under Review</span></td>
          </tr>
          <tr>
            <td><strong>Nyambera Travels</strong></td>
            <td>EXPR-2020-004</td>
            <td>Nakuru</td>
            <td>15</td>
            <td>64</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></td>
            <td><span class="badge green"><i class="fas fa-check"></i> Compliant</span></td>
          </tr>
          <tr>
            <td><strong>Swift Transit</strong></td>
            <td>EXPR-2022-005</td>
            <td>Nairobi</td>
            <td>12</td>
            <td>52</td>
            <td><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></td>
            <td><span class="badge red"><i class="fas fa-times"></i> Non-Compliant</span></td>
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
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.badge.green {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.orange {
  background: #fff3e0;
  color: #f57c00;
}

.badge.red {
  background: #ffebee;
  color: #c62828;
}
</style>
