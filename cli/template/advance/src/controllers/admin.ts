import { Controller, Get } from '@tsxp/core'
import { Request, Response } from 'express'
import { AdminOnly } from 'src/helpers/auth'

@Controller('admin')
export class Admin {
  /**
   * Private route, Custom auth decorator
   */
  @Get('/admin')
  @AdminOnly({ error: 'This is admin only route' })
  async getAdminMovies(_req: Request, res: Response) {
    return res.send({ message: 'Hello Dear' })
  }
}
