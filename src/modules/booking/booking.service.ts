import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { RpcStatus } from '@vendee-cinema/common'
import type {
	CancelBookingRequest,
	ConfirmBookingRequest,
	CreateReservationRequest,
	GetUserBookingsRequest,
	ListReservedSeatsRequest
} from '@vendee-cinema/contracts/booking'
import QRCode from 'qrcode'
import { lastValueFrom } from 'rxjs'

import {
	HallClientGrpc,
	MovieClientGrpc,
	SeatClientGrpc,
	SessionClientGrpc,
	TheaterClientGrpc
} from '@/clients'

import { BookingRepository } from './booking.repository'
import { OrderStatus } from './enums'
import { Order } from './interfaces'

@Injectable()
export class BookingService {
	public constructor(
		private readonly bookingRepository: BookingRepository,
		private readonly theaterClient: TheaterClientGrpc,
		private readonly hallClient: HallClientGrpc,
		private readonly seatClient: SeatClientGrpc,
		private readonly movieClient: MovieClientGrpc,
		private readonly sessionClient: SessionClientGrpc
	) {}

	private async getSession(id: string, ctx: any) {
		if (!ctx.sessions.has(id)) {
			const { session } = await lastValueFrom(
				this.sessionClient.getSession({ id })
			)
			ctx.session.set(id, session)
		}
		return ctx.sessions.get(id)
	}

	private async getMovie(id: string | undefined, ctx: any) {
		if (!id) return null
		if (!ctx.movies.has(id)) {
			const { movie } = await lastValueFrom(this.movieClient.getMovie({ id }))
			ctx.movie.set(id, movie)
		}
		return ctx.movies.get(id)
	}

	private async getHall(id: string, ctx: any) {
		if (!ctx.halls.has(id)) {
			const { hall } = await lastValueFrom(this.hallClient.getHall({ id }))
			ctx.hall.set(id, hall)
		}
		return ctx.halls.get(id)
	}

	private async getTheater(id: string | undefined, ctx: any) {
		if (!id) return null
		if (!ctx.theaters.has(id)) {
			const { theater } = await lastValueFrom(
				this.theaterClient.getTheater({ id })
			)
			ctx.theater.set(id, theater)
		}
		return ctx.theaters.get(id)
	}

	private async getSeat(id: string, ctx: any) {
		if (!ctx.seats.has(id)) {
			const { seat } = await lastValueFrom(this.seatClient.getSeat({ id }))
			ctx.seat.set(id, seat)
		}
		return ctx.seats.get(id)
	}

	private createRequestContext() {
		return {
			sessions: new Map<string, any[]>(),
			halls: new Map<string, any[]>(),
			seats: new Map<string, any[]>(),
			movies: new Map<string, any[]>(),
			theaters: new Map<string, any[]>()
		}
	}

	private async enrichOrders(
		orders: Order[],
		ctx: ReturnType<typeof this.createRequestContext>
	) {
		return Promise.all(
			orders.map(async order => {
				const ticket = order.tickets[0]
				if (!ticket) return null

				const session = await this.getSession(ticket.session_id, ctx)
				if (!session) return null

				const [movie, hall, theater] = await Promise.all([
					this.getMovie(session.movie.id, ctx),
					this.getHall(session.movie.id, ctx),
					this.getTheater(session.movie.id, ctx)
				])

				const seats = await Promise.all(
					order.tickets.map(async ticket => {
						const seat = await this.getSeat(ticket.seat_id, ctx)
						return {
							id: ticket.seat_id,
							row: seat?.row ?? 0,
							number: seat?.number ?? 0
						}
					})
				)

				return {
					id: order.id,
					sessionDate: session.startAt.split('T')[0],
					sessionTime: new Date(session.startAt).toLocaleTimeString('ua-UA', {
						hour: '2-digit',
						minute: '2-digit'
					}),
					movie,
					hall,
					theater,
					seats,
					qrCode: order.qr_code ?? ''
				}
			})
		)
	}

	public async getUserBookings(data: GetUserBookingsRequest) {
		const { userId } = data

		const orders = await this.bookingRepository.findUserPaidOrders(userId)
		if (!orders.length) return { bookings: [] }

		const context = this.createRequestContext()
		const bookings = await this.enrichOrders(orders, context)

		return { bookings }
	}

	public async createReservation(data: CreateReservationRequest) {
		const { userId, sessionId, seats } = data

		const { session } = await lastValueFrom(
			this.sessionClient.getSession({ id: sessionId })
		)
		if (!session)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Session not found'
			})

		const amount = seats.reduce((acc, seat) => acc + seat.price, 0)

		const order = await this.bookingRepository.createOrder({
			user_id: userId,
			amount
		})

		const tickets = await Promise.all(
			seats.map(async seat => {
				const existing = await this.bookingRepository.findExistingTicket(
					sessionId,
					seat.seatId
				)

				if (existing)
					throw new RpcException({
						code: RpcStatus.ALREADY_EXISTS,
						details: `Seat ${seat.seatId} is already reserved`
					})

				return await this.bookingRepository.createTicket({
					session_id: session.id,
					hall_id: session.hall?.id,
					seat_id: seat.seatId,
					price: seat.price,
					order_id: order.id
				})
			})
		)

		return {
			orderId: order.id,
			ticketIds: tickets.map(ticket => ticket.id),
			amount
		}
	}

	public async confirmBooking(data: ConfirmBookingRequest) {
		const { bookingId } = data

		await this.bookingRepository.markOrderPaid(bookingId)

		const now = new Date()

		await this.bookingRepository.markTicketsPaid({
			order_id: bookingId,
			paid_at: now
		})

		const qrDataUrl = await QRCode.toDataURL(bookingId)
		await this.bookingRepository.updateOrderQr(bookingId, qrDataUrl)

		return { ok: true }
	}

	public async cancelBooking(data: CancelBookingRequest) {
		const { bookingId, userId } = data

		const order = await this.bookingRepository.findOrderById(bookingId)
		if (!order)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Order not found'
			})

		if (order.user_id !== userId)
			throw new RpcException({
				code: RpcStatus.PERMISSION_DENIED,
				details: 'You have no rights to cancel this booking'
			})

		if (order.status === OrderStatus.CANCELLED) return { ok: true }

		if (order.status !== OrderStatus.PAID)
			throw new RpcException({
				code: RpcStatus.FAILED_PRECONDITION,
				details: 'Reservation not paid or already cancelled'
			})

		await this.bookingRepository.cancelOrder(bookingId)
		await this.bookingRepository.deleteTicketsByOrderId(bookingId)
	}

	public async listReservedSeats(data: ListReservedSeatsRequest) {
		const { hallId, sessionId } = data
		const seats = await this.bookingRepository.findReservedSeatIds(
			hallId,
			sessionId
		)
		return { reservedSeatIds: seats.map(seat => seat.seat_id) }
	}
}
