import { Movie } from 'src/controllers/home'
import { MovieModel } from 'src/models/movie'

export class MovieService {
  public getMovie(id: string) {
    // query data from DB
    const movie = MovieModel.find(id)
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
