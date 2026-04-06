import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	GetSeatRequest,
	SeatServiceClient
} from '@vendee-cinema/contracts/seat'

@Injectable()
export class SeatClientGrpc implements OnModuleInit {
	private seatService: SeatServiceClient

	public constructor(
		@Inject('SEAT_PACKAGE') private readonly client: ClientGrpc
	) {}

	public onModuleInit() {
		this.seatService = this.client.getService<SeatServiceClient>('SeatService')
	}

	public getSeat(request: GetSeatRequest) {
		return this.seatService.getSeat(request)
	}
}
