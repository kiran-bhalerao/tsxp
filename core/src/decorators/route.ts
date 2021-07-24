import { IRouterMatcher } from "express";
import { Any } from "../utils/types";

export type PathParams = Parameters<IRouterMatcher<unknown>>[0];

export interface RoutePropType {
  PATH?: PathParams;
  METHOD: "get" | "post" | "put" | "delete";
}

function Route(props: Required<RoutePropType>) {
  return function (
    target: Any,
    methodName: string,
    descriptor: PropertyDescriptor
  ) {
    if (typeof Reflect.getMetadata !== "function") return;

    const paramtypes = Reflect.getMetadata(
      "design:paramtypes",
      target,
      methodName
    );
    const args: string[] = paramtypes.map((a: Any) => a.name);

    if (args.length !== 2 || args[0] !== "Object" || args[1] !== "Object") {
      throw new Error(`
       ⚡️ Invalid route handler "${methodName}",
        Route handler must have 2 args(ex. handler(req: Request, res: Response)) 👈
       `);
    }

    Reflect.defineMetadata(
      `${target.constructor.name}:::${methodName}`,
      props,
      target
    );

    return descriptor;
  };
}

const handleUndefinedRoutePath = (path?: RoutePropType["PATH"]) => {
  if (typeof path === "undefined") {
    return {
      PATH: "",
    };
  }

  return {
    PATH: path,
  };
};

/**
 * @desc Routes HTTP GET requests to the specified path.
 * @example
 * ```js
 * ＠Get('/route-name' or 'route-name')
 * getHandler(req: Request, res: Response) {
 *   ...
 * }
 * ```
 */
export function Get(path?: RoutePropType["PATH"]) {
  return Route({ ...handleUndefinedRoutePath(path), METHOD: "get" });
}

/**
 * @desc Routes HTTP POST requests to the specified path.
 * @example
 * ```js
 * ＠Post('/route-name' or 'route-name')
 * createHandler(req: Request, res: Response) {
 *   ...
 * }
 * ```
 */
export function Post(path?: RoutePropType["PATH"]) {
  return Route({ ...handleUndefinedRoutePath(path), METHOD: "post" });
}

/**
 * @desc Routes HTTP PUT requests to the specified path.
 * @example
 * ```js
 * ＠Put('/route-name' or 'route-name')
 * updateHandler(req: Request, res: Response) {
 *   ...
 * }
 * ```
 */
export function Put(path?: RoutePropType["PATH"]) {
  return Route({ ...handleUndefinedRoutePath(path), METHOD: "put" });
}

/**
 * @desc Routes HTTP DELETE requests to the specified path.
 * @example
 * ```js
 * ＠Delete('/route-name' or 'route-name')
 * deleteHandler(req: Request, res: Response) {
 *   ...
 * }
 * ```
 */
export function Delete(path?: RoutePropType["PATH"]) {
  return Route({ ...handleUndefinedRoutePath(path), METHOD: "delete" });
}
