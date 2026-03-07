import { ref, onUnmounted } from 'vue'
import { tripStatusService } from '../services/driverService.js'
import { scanLogService } from '../services/workerService.js'

export function useTrip(tripStatusId, scheduleId) {
  const tripStatus = ref(null)
  const passengersBoarded = ref(0)
  const isLoading = ref(true)
  let pollInterval = null

  async function fetchStatus() {
    try {
      tripStatus.value = await tripStatusService.getById(tripStatusId)
    } catch { /* offline fallback */ }
  }

  async function fetchBoardedCount() {
    try {
      const logs = await scanLogService.getAll({ scheduleId, result: 'valid' })
      passengersBoarded.value = logs.length
    } catch { /* offline fallback */ }
  }

  async function init() {
    isLoading.value = true
    await Promise.all([fetchStatus(), fetchBoardedCount()])
    isLoading.value = false

    pollInterval = setInterval(() => {
      fetchBoardedCount()
    }, 10000)
  }

  async function handleStatusChange(newStatus) {
    const patch = { status: newStatus, updatedAt: new Date().toISOString() }
    if (newStatus === 'in_progress') patch.startedAt = new Date().toISOString()
    if (newStatus === 'arrived') patch.arrivedAt = new Date().toISOString()

    try {
      tripStatus.value = await tripStatusService.patch(tripStatusId, patch)
    } catch (err) {
      localStorage.setItem(`pending_status_${tripStatusId}`, JSON.stringify(patch))
    }
  }

  async function addNote(note) {
    const existing = tripStatus.value?.notes || ''
    const updated = existing ? `${existing}\n${note}` : note
    await tripStatusService.patch(tripStatusId, { notes: updated })
    if (tripStatus.value) tripStatus.value.notes = updated
  }

  onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval)
  })

  return { tripStatus, passengersBoarded, isLoading, init, handleStatusChange, addNote }
}
