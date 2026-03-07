import { createService } from './api.js'

const service = createService('bookings')
const routesService = createService('routes')
const schedulesService = createService('schedules')

export const bookingService = {
  ...service,

  getByUser(userId) {
    return service.getAll({ userId, _sort: 'bookedAt', _order: 'desc' })
  },

  getByScheduleAndDate(scheduleId, date) {
    return service.getAll({ scheduleId, date })
  },

  getRecent(userId, limit = 10) {
    return service.getAll({ userId, _sort: 'bookedAt', _order: 'desc', _limit: limit })
  },
}

const BookingService = {
  calculateFare(baseFare, passengerType) {
    const multipliers = { adult: 1, child: 0.5, student: 0.7, senior: 0.6 }
    return Math.round((baseFare || 0) * (multipliers[passengerType] || 1))
  },

  async getRoutes() {
    return routesService.getAll({ isActive: true })
  },

  async getTrips() {
    return schedulesService.getAll({ isActive: true })
  },

  async getAvailableSeats(tripId) {
    const schedule = await schedulesService.getById(tripId)
    const booked = await service.getAll({ scheduleId: tripId, status: 'confirmed' })
    const bookedSeats = booked.map(b => b.seatNumber)
    const allSeats = Array.from({ length: schedule.totalSeats }, (_, i) => i + 1)
    return allSeats.filter(s => !bookedSeats.includes(s))
  },

  async createBooking(data) {
    const booking = await service.create({
      ...data,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return booking
  },

  formatCurrency(amount) {
    return `${Number(amount || 0).toLocaleString()} RWF`
  },
}

export default BookingService
