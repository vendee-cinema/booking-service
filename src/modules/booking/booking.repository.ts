import { Injectable } from '@nestjs/common'
import { nanoid } from 'nanoid'

import { DatabaseService } from '@/infra/database'
import { ORDER_COMMANDS, TICKET_COMMANDS } from '@/infra/sql/commands'
import { ORDER_QUERIES, TICKET_QUERIES } from '@/infra/sql/queries'

import type { Order, Ticket } from './interfaces'

@Injectable()
export class BookingRepository {
	public constructor(private readonly database: DatabaseService) {}

	public async findUserPaidOrders(userId: string) {
		return await this.database.raw<Order>(
			ORDER_QUERIES.FIND_PAID_ORDERS_FOR_USER,
			[userId]
		)
	}

	public async findOrderById(orderId: string) {
		const rows = await this.database.raw<Order>(
			ORDER_QUERIES.FIND_ORDER_BY_ID,
			[orderId]
		)
		return rows[0] ?? null
	}

	public async findExistingTicket(sessionId: string, seatId: string) {
		const rows = await this.database.raw<Ticket>(
			TICKET_QUERIES.FIND_EXISTING_TICKET,
			[sessionId, seatId]
		)
		return rows[0] ?? null
	}

	public async findReservedSeatIds(hallId: string, sessionId: string) {
		return this.database.raw<{ seat_id: string }>(
			TICKET_QUERIES.LIST_RESERVED_SEATS,
			[hallId, sessionId]
		)
	}

	public async createOrder(input: Pick<Order, 'user_id' | 'amount'>) {
		const rows = await this.database.raw<Order>(ORDER_COMMANDS.CREATE_ORDER, [
			nanoid(),
			input.user_id,
			input.amount
		])
		return rows[0]
	}

	public async createTicket(
		input: Pick<
			Ticket,
			'session_id' | 'hall_id' | 'seat_id' | 'price' | 'order_id'
		>
	) {
		const rows = await this.database.raw(TICKET_COMMANDS.CREATE_TICKET, [
			nanoid(),
			input.session_id,
			input.hall_id,
			input.seat_id,
			input.price,
			input.order_id
		])
		return rows[0]
	}

	public async updateOrderQr(orderId: string, qrCode: string | null) {
		await this.database.raw(ORDER_COMMANDS.SAVE_QR, [qrCode, orderId])
	}

	public async markOrderPaid(orderId: string) {
		await this.database.raw(ORDER_COMMANDS.SET_ORDER_PAID, [orderId])
	}

	public async cancelOrder(orderId: string) {
		await this.database.raw(ORDER_COMMANDS.CANCEL_ORDER, [orderId])
	}

	public async markTicketsPaid(input: Pick<Ticket, 'order_id' | 'paid_at'>) {
		await this.database.raw(TICKET_COMMANDS.MARK_TICKETS_PAID, [
			input.paid_at,
			input.order_id
		])
	}

	public async deleteTicketsByOrderId(orderId: string) {
		await this.database.raw(TICKET_COMMANDS.DELETE_TICKETS_FOR_ORDER, [orderId])
	}
}
