import { NextFunction, Request, Response } from "express";
import { CustomError } from "../classes/error";
import { createThrowable } from "../utils/createThrowable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any;

interface AuthType<T extends string> {
  role?: T | T[];
  error?: string;
  extends?: AuthExtender<T>;
}

const defaultUserTypeResolver = (req: U) => req.user?.userType;
const defaultAuthChecker = (
  req: U,
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
 * 🔒 Method must be async route handler
 * @note use before `@Middlewares` decorator so the middlewares will be auth protected
 */
export function Auth<T extends string>(props?: AuthType<T>) {
  return (_target: U, _key: string, descriptor: PropertyDescriptor) => {
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
      const throwable = createThrowable(req, res, next);

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
          return next(new CustomError(error));
        }
      } else if (!authChecker(req)) {
        return next(new CustomError(error));
      }

      await throwable(
        async () => await originalMethod.apply(this, [req, res, next])
      );
    };

    return descriptor;
  };
}

abstract class AuthExtender<T extends string> {
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

  constructor(public props?: { role: T | T[]; error?: string }) {}
}

Auth.extender = AuthExtender;
