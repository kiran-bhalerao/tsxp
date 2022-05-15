import express, { Request, Router } from "express";
import { ClassType } from "../classes/injector";
import { RoutePropType } from "../decorators/route";
import { Any } from "../utils/types";

export interface Controller {
  readonly path: string;
  readonly router: Router;
}

type ParamDict = {
  [key: string]: string | number | boolean;
};

/** Append slash(/) to the given string, if it doesn't have */
function appendSlash(str = "") {
  if (str.length > 1 && !str.startsWith("/")) {
    str = `/${str}`;
  }

  return str;
}

/** check if given input is string or RegExp, if it's string then pass it to appendSlash*/
function withSlash(input: string | RegExp) {
  if (typeof input === "string") {
    return appendSlash(input);
  }

  return input;
}

export function isInstanceOfController(instance: Any): instance is Controller {
  return (
    typeof instance.path === "string" &&
    !!instance.router &&
    Object.getPrototypeOf(instance.router) === Router
  );
}

export function Controller(path = "") {
  return function <T extends ClassType<Any>>(Target: T) {
    // Here `implements Controller` is redundant b'cuz of the typescript issue as mention bellow
    // https://github.com/microsoft/TypeScript/issues/4881 😔
    // class extends Target implements Controller {

    return class extends Target {
      public readonly path = path;
      public readonly router: Router;

      constructor(...args: Any[]) {
        super(...args);
        Object.setPrototypeOf(this, Target.prototype);

        // create instance of Express Router
        this.router = express.Router();

        // figure out the route handlers
        const RouteHandlers = Object.getOwnPropertyNames(
          Object.getPrototypeOf(this)
        ).filter((method) => {
          return Reflect.hasMetadata(
            `${this.constructor.name}:::${method}`,
            this
          );
        });

        for (const routeHandler of RouteHandlers) {
          // Collect the metadata
          const option: Required<RoutePropType> = Reflect.getMetadata(
            `${Target.name}:::${routeHandler}`,
            this
          );

          // handler
          const handler = this[routeHandler];

          // check for slash(/)
          let path: any = option["PATH"];
          path = [path].flat().map(withSlash);

          // call the get, post ... of Express Router with `path` and `handler`
          this.router[option["METHOD"]](
            path,
            (req: Request<ParamDict>, res, next) => {
              return handler.call(this, req, res, next);
            }
          );

          // Now clear the metadata (/The work is done, It always will be --Thanos 🎃/)
          Reflect.deleteMetadata(`${Target.name}:::${routeHandler}`, this);
        }
      }
    };
  };
}
