import cleanStack from "clean-stacktrace";
import { NextFunction, Request, Response } from "express";
import { isInstanceofCustomError } from "../classes/error";

export interface ErrorHandlerOptions {
  /**
   *
   * @desc
   * - This function gets called when application throws non CustomError.
   * - You can use this as Logging or Reporting purpose.
   */
  onError?: (error: Error) => void;
  /**
   * @desc When application throws an error this key will be used to send error response.
   * @default "errors"
   */
  errorKey?: string;
  /**
   * @desc This error message will be used when application throws non CustomError.
   * @default
   * message: "Something went wrong, Please try again."
   * statusCode: 500
   */
  serverError?: {
    message?: string;
    statusCode?: number;
  };
}

export function createErrorHandler(options?: ErrorHandlerOptions) {
  const errorKey = options?.errorKey || "errors";
  const serverErrorMessage =
    options?.serverError?.message || "Something went wrong, Please try again.";
  const serverErrorStatusCode = options?.serverError?.statusCode || 500;
  const onError =
    options?.onError ||
    function (err) {
      console.error(cleanStack(err.stack || err.message || ""));
    };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function defaultErrorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    if (isInstanceofCustomError(err)) {
      return res.status(err.statusCode).send({ [errorKey]: err.errors });
    }

    onError(err);

    return res
      .status(serverErrorStatusCode)
      .send({ [errorKey]: [serverErrorMessage] });
  };
}
