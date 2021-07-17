import { NextFunction, Request, Response } from "express";
import { ErrorExtender } from "../classes/error";
import { __prod__ } from "../utils/constants";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function defaultErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ErrorExtender) {
    return res.status(err.statusCode).send({ errors: err.errors });
  }

  if (!__prod__) {
    console.log(err);
  }

  return res
    .status(500)
    .send({ errors: ["Something went wrong, Please try again."] });
}
