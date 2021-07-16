import { Movie } from 'src/models/movie'

export class MovieService {
  public getMovie(id: string) {
    // query data from DB
    const movie = Movie.find(id)
    // do some extra processing on data
    // ..

    return movie
  }
}
