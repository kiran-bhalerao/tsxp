export abstract class ErrorExtender<T = string> extends Error {
  statusCode: number;
  errors: T[];

  constructor(message: T | T[], code?: number) {
    super();

    this.errors = Array.isArray(message) ? message : [message];
    this.statusCode = code || 400;
  }
}

/**
 * @description
 * **CustomError** use to return error message from your api endpoint
 * @example
 * ```
 * throw new CustomError("Login credentials are wrong❗")
 *
 * // or you can pass status code(optional, default is 400) along with error message like this
 * throw new CustomError("Login credentials are wrong❗", 403)
 * ```
 */
export class CustomError extends ErrorExtender {
  /**
   * @description
   * **CustomError class** is good to handle error message, but it is not a generic it supports only **string | string[]** type of errors \
   * sometimes we need more than string to represent state of error \
   * best example come to my mind is, dealing with errors with form submission, lets look at a example so you will get the clear picture
   *
   * @example
   * ```
   * // define a new Error class
   * class FormError extends CustomError.extender<{
   *   field: string;
   *   error: string;
   * }> {}
   *
   * // use it
   * throw new FormError({ field: "email", error: "Email is required" });
   * ```
   */
  static extender = ErrorExtender;
}
