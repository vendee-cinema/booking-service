import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import postgres from 'postgres'

import { getDatabaseConfig } from '@/config/database.config'

import { DatabaseService } from './database.service'

export const PG = Symbol('PG')

@Global()
@Module({
	providers: [
		{
			provide: PG,
			useFactory: (configService: ConfigService) => {
				const options = getDatabaseConfig(configService)
				return postgres(options)
			},
			inject: [ConfigService]
		},
		DatabaseService
	],
	exports: [PG, DatabaseService]
})
export class DatabaseModule {}
