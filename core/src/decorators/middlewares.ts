import { NextFunction, Request, RequestHandler, Response } from "express";
import { createThrowable } from "../utils/createThrowable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any;

/**
 * @description
 * 📢 Comma separated middlewares
 *
 * @example
 * `@Middlewares( logger, handler, .. )`
 */
export function Middlewares(...handlers: RequestHandler[]) {
  return (_target: U, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      throw new SyntaxError("Invalid use of @Middlewares Decorator");
    }

    descriptor.value = async function (
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      /** Store middlewares with configured next function */
      const table: Record<string, () => unknown> = {};

      /** Error handler */
      const throwable = createThrowable(req, res, next);

      /** Create middleware chain */
      handlers.forEach((fn, i) => {
        if (handlers[i + 1]) {
          table[i] = () =>
            fn(req, res, async () => await throwable(table[i + 1]));
        } else
          table[i] = () =>
            fn(
              req,
              res,
              async () =>
                await throwable(
                  async () => await originalMethod.apply(this, [req, res, next])
                )
            );
      });

      return await throwable(table[0]);
    };

    return descriptor;
  };
}
