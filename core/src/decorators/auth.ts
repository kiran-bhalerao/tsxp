import { NextFunction, Request, Response } from "express";
import { CustomError, isInstanceofCustomError } from "../classes/error";
import { createSafeNextFN } from "../utils/createSafeNextFN";
import { Any } from "../utils/types";

interface AuthType<T extends string, K extends Any = string> {
  role?: T | T[];
  error?: string | CustomError | K;
  /**
   * @desc checkout Auth.extender abstract class
   */
  extends?: AuthExtender<T, K>;
}

const defaultUserTypeResolver = (req: Any): string | undefined => {
  return req.user?.userType;
};

const defaultAuthChecker = (
  req: Any,
  acceptedRole?: string[],
  currentRole?: string
) => {
  if (!acceptedRole) {
    // acceptedRole is not provided means there is no role based authorization
    // simply check for current user in req object
    return !!req.user;
  } else {
    if (!currentRole) {
      return false;
    }

    return acceptedRole.includes(currentRole);
  }
};

/**
 * @description
 * This decorator providers **Authentication** and **Authorization** features \
 * Before using this you need to setup **context**(optional) in App class \
 * or if you are using(planing to use) any third party Authentication lib. like passport.js \
 * make sure the third party lib. set **user** object in req like **req.user**
 *
 * for authorization there are certain condition needs to met
 * - you need to pass role option to Auth decorator
 * - by default Auth decorator checks user role by req.user.userType field
 * - but you can customize this behavior (Auth provider Auth.extender abstract class)
 *
 * @example
 * ```
 * ＠Auth() // use this if you only need authentication
 * ＠Auth({role: 'ADMIN'}) // authorization
 * ＠Auth({extends: new MyAuthExt({role: '..'}) }) // with custom auth class (extended from Auth.extender)
 *
 * // or with custom auth class(in this case MyAuthExt) you can create custom decorator
 * const MyAuth = new MyAuthExt().createDecorator()
 * ＠MyAuth({role: '..'})
 * ```
 * @note Method must be async route handler
 * @note use before `@Middlewares` decorator so the middlewares will be auth protected
 */
export function Auth<T extends string, K extends Any = string>(
  props?: AuthType<T, K>
) {
  return (_target: Any, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== "function") {
      throw new SyntaxError("Invalid use of @Auth Decorator");
    }

    descriptor.value = async function (
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      const safeNext = createSafeNextFN(next);

      const role = props?.role || props?.extends?.props?.role;
      const error =
        props?.error || props?.extends?.props?.error || "Invalid Permissions";
      const userTypeResolver =
        props?.extends?.userTypeResolver || defaultUserTypeResolver;
      const authChecker = props?.extends?.authChecker || defaultAuthChecker;

      const currentUserType = userTypeResolver(req);

      if (role) {
        const roles = [role].flat();

        if (!authChecker(req, roles, currentUserType)) {
          if (isInstanceofCustomError<Any>(error)) {
            return next(error);
          }

          return next(new CustomError(error, 401));
        }
      } else if (!authChecker(req)) {
        if (isInstanceofCustomError<Any>(error)) {
          return next(error);
        }

        return next(new CustomError(error, 401));
      }

      await safeNext(() => originalMethod.apply(this, [req, res, next]));
    };

    return descriptor;
  };
}

abstract class AuthExtender<T extends string = string, K extends Any = string> {
  /**
   * @params req: Request
   * @returns string | undefined
   * @example
   * ```
   * userTypeResolver(req: Request) {
   *  return req.user?.userType
   * }
   * ```
   */
  public userTypeResolver(req: Request) {
    return defaultUserTypeResolver(req);
  }

  /**
   * @params req: Request, acceptedRole?: string[], currentRole?: string
   * @returns boolean
   * @example
   * ```
   * authChecker(req: Request, acceptedRole?: string[], currentRole?: string) {
   *  ...
   * }
   * ```
   */
  public authChecker(
    req: Request,
    acceptedRole?: string[],
    currentRole?: string
  ) {
    return defaultAuthChecker(req, acceptedRole, currentRole);
  }

  /**
   * @description with this you can create custom auth decorator
   * @example
   * ```
   * class MyAuthExt extends Auth.extender<ROLES> {
   *   // override Auth methods
   * }
   * const MyAuth = new MyAuthExt().createDecorator()
   *
   * // now you can use this MyAuth as Decorator
   *  ＠MyAuth()
   *  ＠Get()
   *  async handler(req: Request, req: Response) {
   *   ...
   *  }
   * ```
   */
  public createDecorator() {
    return (props?: Omit<AuthType<T, K>, "extends">) => {
      return Auth<T, K>({ ...props, extends: this });
    };
  }

  constructor(
    public props?: { role?: T | T[]; error?: string | CustomError | K }
  ) {}
}

/**
 * @description extend capabilities of Auth decorator
 * @example
 * ```
 * // without Generics
 * class MyAuth extends Auth.extender {
 *  // can override authChecker() or userTypeResolver()
 * }
 *
 * // with Generics
 * class AnotherAuth extends Auth.extender<'USER' | 'ADMIN'> {
 *  // same
 * }
 *
 * // custom decorator example
 * const AdminOnly = new AnotherAuth({role: 'ADMIN'}).createDecorator()
 * ```
 */
Auth.extender = AuthExtender;
