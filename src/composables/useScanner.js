import { ref } from 'vue'
import { bookingService } from '../services/bookingService.js'
import { scanLogService } from '../services/workerService.js'

export function useScanner(scheduleId, currentWorker) {
  const lastResult = ref(null)
  const scanStatus = ref('idle')
  const boardedCount = ref(0)

  function formatTime(isoString) {
    if (!isoString) return 'unknown'
    return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  function validateTicket(booking, ticketData, currentScheduleId) {
    if (booking.paymentStatus !== 'paid')
      return { valid: false, reason: 'unpaid', message: 'Payment not confirmed' }

    if (booking.status !== 'confirmed')
      return { valid: false, reason: 'invalid', message: 'Booking is not confirmed' }

    if (booking.qrScanned)
      return { valid: false, reason: 'already_scanned', message: `Already scanned at ${formatTime(booking.scannedAt)}` }

    if (booking.scheduleId !== currentScheduleId)
      return { valid: false, reason: 'wrong_trip', message: 'Wrong trip — ticket is for a different schedule' }

    const today = new Date().toISOString().split('T')[0]
    if (booking.date !== today)
      return { valid: false, reason: 'expired', message: `Ticket is for ${booking.date}, not today` }

    return { valid: true }
  }

  async function handleScan(rawQRValue) {
    let ticketData
    try {
      ticketData = JSON.parse(rawQRValue)
    } catch {
      scanStatus.value = 'invalid'
      lastResult.value = { reason: 'QR code is corrupted or unreadable' }
      return
    }

    if (!ticketData.bookingId) {
      scanStatus.value = 'invalid'
      lastResult.value = { reason: 'Invalid QR code format' }
      return
    }

    let booking
    try {
      booking = await bookingService.getById(ticketData.bookingId)
    } catch {
      scanStatus.value = 'invalid'
      lastResult.value = { reason: 'Booking not found in system' }
      return
    }

    const validation = validateTicket(booking, ticketData, scheduleId)

    if (validation.valid) {
      await bookingService.patch(booking.id, {
        qrScanned: true,
        scannedAt: new Date().toISOString(),
        scannedByWorkerId: currentWorker.id,
      })

      await scanLogService.create({
        workerId: currentWorker.id,
        bookingId: booking.id,
        scheduleId,
        scannedAt: new Date().toISOString(),
        result: 'valid',
        reason: null,
      })

      boardedCount.value++
      scanStatus.value = 'valid'
      lastResult.value = {
        passengerName: ticketData.passengerName,
        seatNumber: ticketData.seatNumber,
      }
    } else {
      try {
        await scanLogService.create({
          workerId: currentWorker.id,
          bookingId: booking.id,
          scheduleId,
          scannedAt: new Date().toISOString(),
          result: validation.reason,
          reason: validation.message,
        })
      } catch { /* offline — skip logging */ }

      scanStatus.value = 'invalid'
      lastResult.value = { reason: validation.message }
    }
  }

  function reset() {
    scanStatus.value = 'idle'
    lastResult.value = null
  }

  return { lastResult, scanStatus, boardedCount, handleScan, reset }
}
