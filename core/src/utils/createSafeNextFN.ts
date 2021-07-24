import { NextFunction } from "express";
type ThrowableAsyncFunc = () => unknown | Promise<unknown>;

/**
 * @description Create safe next function
 */
export function createSafeNextFN(next: NextFunction) {
  return async function (fn: ThrowableAsyncFunc) {
    try {
      return await fn();
    } catch (error) {
      return next(error);
    }
  };
}
