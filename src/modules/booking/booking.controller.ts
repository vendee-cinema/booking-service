import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import type {
	CancelBookingRequest,
	CancelBookingResponse,
	ConfirmBookingRequest,
	ConfirmBookingResponse,
	CreateReservationRequest,
	CreateReservationResponse,
	GetUserBookingsRequest,
	GetUserBookingsResponse,
	ListReservedSeatsRequest,
	ListReservedSeatsResponse
} from '@vendee-cinema/contracts/booking'

import { BookingService } from './booking.service'

@Controller()
export class BookingController {
	public constructor(private readonly bookingService: BookingService) {}

	@GrpcMethod('BookingService', 'GetUserBookings')
	public async getUserBookings(
		data: GetUserBookingsRequest
	): Promise<GetUserBookingsResponse> {
		return await this.bookingService.getUserBookings(data)
	}

	@GrpcMethod('BookingService', 'CreateReservation')
	public async createReservation(
		data: CreateReservationRequest
	): Promise<CreateReservationResponse> {
		return await this.bookingService.createReservation(data)
	}

	@GrpcMethod('BookingService', 'ConfirmBooking')
	public async confirmBooking(
		data: ConfirmBookingRequest
	): Promise<ConfirmBookingResponse> {
		return await this.bookingService.confirmBooking(data)
	}

	@GrpcMethod('BookingService', 'CancelBooking')
	public async cancelBooking(
		data: CancelBookingRequest
	): Promise<CancelBookingResponse> {
		return await this.bookingService.cancelBooking(data)
	}

	@GrpcMethod('BookingService', 'ListReservedSeats')
	public async listReservedSeats(
		data: ListReservedSeatsRequest
	): Promise<ListReservedSeatsResponse> {
		return await this.bookingService.listReservedSeats(data)
	}
}
