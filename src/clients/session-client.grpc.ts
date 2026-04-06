import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	GetSessionRequest,
	SessionServiceClient
} from '@vendee-cinema/contracts/session'

@Injectable()
export class SessionClientGrpc implements OnModuleInit {
	private sessionService: SessionServiceClient

	public constructor(
		@Inject('SESSION_PACKAGE') private readonly client: ClientGrpc
	) {}

	public onModuleInit() {
		this.sessionService =
			this.client.getService<SessionServiceClient>('SessionService')
	}

	public getSession(request: GetSessionRequest) {
		return this.sessionService.getSession(request)
	}
}
