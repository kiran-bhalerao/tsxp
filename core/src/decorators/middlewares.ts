import { NextFunction, Request, RequestHandler, Response } from "express";
import { __prod__ } from "../utils/constants";
import { createSafeNextFN } from "../utils/createSafeNextFN";
import { Any } from "../utils/types";

/**
 * @description
 * 📢 Comma separated middlewares
 *
 * @example
 * `@Middlewares( logger, handler, .. )`
 */
export function Middlewares(...handlers: RequestHandler[]) {
  return (_target: Any, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      throw new SyntaxError("Invalid use of @Middlewares Decorator");
    }

    descriptor.value = async function (
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      const withNext = createSafeNextFN(next);

      /**
       *
       * @desc If someone pass error object to next function from middleware
       */
      function nextArgsWarn(args: Error) {
        if (args instanceof Error) {
          if (!__prod__)
            console.warn(
              "⚠️  There is no need to pass error to next function, you can directly throw it..."
            );

          throw args;
        }
      }

      async function handle(handler: typeof handlers[0], nextFn: () => void) {
        await withNext(() => {
          return handler(req, res, (args) => {
            nextArgsWarn(args);
            nextFn();
          });
        });
      }

      const chain = async (handler: typeof handlers[0], index = 0) => {
        const nextIndex = index + 1;

        if (handlers[nextIndex]) {
          await handle(handler, () => chain(handlers[nextIndex], nextIndex));
        } else {
          await handle(handler, () =>
            withNext(() => originalMethod.apply(this, [req, res, next]))
          );
        }

        return;
      };

      await chain(handlers[0]);
    };

    return descriptor;
  };
}
