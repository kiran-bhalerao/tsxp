import { Controller, CustomError, Get } from '@tsxp/core'
import { Request, Response } from 'express'
import { MovieService } from 'src/services/movie'

@Controller('/home')
export class Home {
  constructor(private movieService: MovieService) {}

  /**
   *
   * @desc Basic example
   */
  @Get('/')
  async basicExample(_req: Request, res: Response) {
    return res.send('Welcome to TSXP!')
  }

  /**
   * @desc DI service example
   * @url /home/movies/1997
   */
  @Get('/movie/:id')
  async getMovie(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params

    const movie = this.movieService.getMovie(id)
    return res.send(movie)
  }

  /**
   * @desc Pipe params & error handling example
   * @url /home/movies/1997/r-rated/false
   */
  @Get('/movies/:year|number/r-rated/:isRate|boolean')
  async getMoviesByYear(req: Request<{ year: number; isRate: boolean }>, res: Response) {
    const { year } = req.params

    // data validation
    if (typeof year !== 'number') {
      throw new CustomError('Invalid Year prams')
    }

    return res.send('🍊')
  }
}
