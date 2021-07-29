import { Injectable } from '@tsxp/core'
import { MovieModel } from 'src/models/movie'
import { Movie } from 'src/types/movie'

@Injectable()
export class MovieService {
  constructor(private movieModel: MovieModel) {}

  public getMovie(id: string) {
    // query data from DB
    const movie = this.movieModel.find(id)
    // do some extra processing on data
    // ..

    return movie
  }

  public create(movie: Movie) {
    return {
      id: '2',
      ...movie
    }
  }
}
