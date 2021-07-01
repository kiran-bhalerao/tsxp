import { NextFunction, Request, Response } from 'express'
type ThrowableAsyncFunc = () => unknown | Promise<unknown>

export function createThrowable(_req: Request, _res: Response, next: NextFunction) {
  return async function (fn: ThrowableAsyncFunc) {
    try {
      return await fn()
    } catch (error) {
      return next(error)
    }
  }
}
