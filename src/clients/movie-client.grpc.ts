import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import type { ClientGrpc } from '@nestjs/microservices'
import type {
	GetMovieRequest,
	MovieServiceClient
} from '@vendee-cinema/contracts/movie'

@Injectable()
export class MovieClientGrpc implements OnModuleInit {
	private movieService: MovieServiceClient

	public constructor(
		@Inject('MOVIE_PACKAGE') private readonly client: ClientGrpc
	) {}

	public onModuleInit() {
		this.movieService =
			this.client.getService<MovieServiceClient>('MovieService')
	}

	public getMovie(request: GetMovieRequest) {
		return this.movieService.getMovie(request)
	}
}
