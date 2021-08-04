import { NextFunction, Request, Response } from "express";
import { CustomError } from "../classes/error";
import { createSafeNextFN } from "../utils/createSafeNextFN";
import { Any } from "../utils/types";

interface AuthType<T extends string> {
  role?: T | T[];
  error?: string;
  /**
   * @desc checkout Auth.extender abstract class
   */
  extends?: AuthExtender<T>;
}

const defaultUserTypeResolver = (req: Any) => req.user?.userType;
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
export function Auth<T extends string>(props?: AuthType<T>) {
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
      /** Error handler */
      const withNext = createSafeNextFN(next);

      const role = props?.extends?.props?.role || props?.role;
      const error =
        props?.extends?.props?.error || props?.error || "Invalid Permissions";
      const userTypeResolver =
        props?.extends?.userTypeResolver || defaultUserTypeResolver;
      const authChecker = props?.extends?.authChecker || defaultAuthChecker;

      const currentUserType = userTypeResolver(req);

      if (role) {
        const roles = [role].flat();

        if (!authChecker(req, roles, currentUserType)) {
          return next(new CustomError(error, 401));
        }
      } else if (!authChecker(req)) {
        return next(new CustomError(error, 401));
      }

      await withNext(() => originalMethod.apply(this, [req, res, next]));
    };

    return descriptor;
  };
}

abstract class AuthExtender<T extends string = string> {
  /** `userTypeResolver(req: Request): string | undefined` */
  public userTypeResolver(req: Request) {
    return defaultUserTypeResolver(req);
  }

  /** `authChecker(req: Request, acceptedRole: string[], currentRole?: string | undefined): boolean` */
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
    return (props?: Omit<AuthType<T>, "extends">) => {
      return Auth<T>({ ...props, extends: this });
    };
  }

  constructor(public props?: { role?: T | T[]; error?: string }) {}
}

Auth.extender = AuthExtender;
