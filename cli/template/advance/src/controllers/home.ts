import { Auth, Controller, CustomError, Get, Middlewares, Post } from '@tsxp/core'
import { NextFunction, Request, Response } from 'express'
import { MovieService } from 'src/services/movie'
import { Movie } from 'src/types/movie'

async function log(_req: Request, _res: Response, next: NextFunction) {
  console.log('::: inside log')
  next()
}

@Controller('/home')
export class Home {
  constructor(private movieService: MovieService) {}

  /**
   * @desc Basic example
   */
  @Get('/')
  async basicExample(_req: Request, res: Response) {
    return res.send('Welcome to TSXP!')
  }

  /**
   * @desc DI service & error handing example
   * @url /home/movies/1997
   */
  @Get('/movie/:id')
  @Middlewares(log)
  async getMovie(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params

    const movie = this.movieService.getMovie(id)
    if (!movie) {
      throw new CustomError('Movie not found', 404)
    }

    return res.send(movie)
  }


  /**
   * @desc Post call & Auth decorator example
   * @note @Auth() is more powerful than this, checkout its docs by hover over it
   */
  @Auth()
  @Post('/movie')
  async createMovie(req: Request<never, never, { movie: Movie }>, res: Response) {
    const { movie } = req.body

    const createdMovie = this.movieService.create(movie)
    return res.send(createdMovie)
  }
}
