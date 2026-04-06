import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { PROTO_PATHS } from '@vendee-cinema/contracts'

import {
	HallClientGrpc,
	MovieClientGrpc,
	SeatClientGrpc,
	SessionClientGrpc,
	TheaterClientGrpc
} from '@/clients'

import { BookingController } from './booking.controller'
import { BookingService } from './booking.service'

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'THEATER_PACKAGE',
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'theater.v1',
						protoPath: PROTO_PATHS.THEATER,
						url: configService.getOrThrow<string>('THEATER_GRPC_URL')
					}
				}),
				inject: [ConfigService]
			},
			{
				name: 'HALL_PACKAGE',
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'hall.v1',
						protoPath: PROTO_PATHS.HALL,
						url: configService.getOrThrow<string>('THEATER_GRPC_URL')
					}
				}),
				inject: [ConfigService]
			},
			{
				name: 'THEATER_PACKAGE',
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'theater.v1',
						protoPath: PROTO_PATHS.THEATER,
						url: configService.getOrThrow<string>('THEATER_GRPC_URL')
					}
				}),
				inject: [ConfigService]
			},
			{
				name: 'SEAT_PACKAGE',
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'seat.v1',
						protoPath: PROTO_PATHS.SEAT,
						url: configService.getOrThrow<string>('THEATER_GRPC_URL')
					}
				}),
				inject: [ConfigService]
			},
			{
				name: 'MOVIE_PACKAGE',
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'movie.v1',
						protoPath: PROTO_PATHS.MOVIE,
						url: configService.getOrThrow<string>('MOVIE_GRPC_URL')
					}
				}),
				inject: [ConfigService]
			},
			{
				name: 'SESSION_PACKAGE',
				useFactory: (configService: ConfigService) => ({
					transport: Transport.GRPC,
					options: {
						package: 'session.v1',
						protoPath: PROTO_PATHS.SESSION,
						url: configService.getOrThrow<string>('SESSION_GRPC_URL')
					}
				}),
				inject: [ConfigService]
			}
		])
	],
	controllers: [BookingController],
	providers: [
		BookingService,
		TheaterClientGrpc,
		HallClientGrpc,
		SeatClientGrpc,
		MovieClientGrpc,
		SessionClientGrpc
	]
})
export class BookingModule {}
