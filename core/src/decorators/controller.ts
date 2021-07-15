import express, { Request, Router } from "express";
import { ClassType } from "../classes/injector";
import { RoutePropType } from "../decorators/route";

export interface Controller {
  readonly path: string;
  readonly router: Router;
}

type ParamDict = {
  [key: string]: string | number | boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any;

/** Append slash(/) to the given string, if it doesn't have */
function appendSlash(str = "") {
  if (str.length > 1 && !str.startsWith("/")) {
    str = `/${str}`;
  }

  return str;
}

const supportedPipes = ["|number", "|string", "|boolean"] as const;
type PipeType = typeof supportedPipes[number];

// "/a/:num|number" here outcome will be /a/:num
function removeParamPipes(path: string | RegExp) {
  if (typeof path === "string") {
    supportedPipes.forEach((pipe) => {
      if (typeof path === "string") {
        path = path.replace(pipe, "");
      }
    });
  }

  return path;
}

// "/a/:num|number"
function detectTypeWithPipe(path: string | RegExp) {
  const params: { param: string; typ: PipeType }[] = [];

  if (typeof path === "string") {
    path
      .split("/")
      .filter((p) => p[0] === ":")
      .map((p) => {
        const paraT = p.split("|");

        if (paraT.length === 2) {
          let pipe = paraT[1];
          const typ = `|${pipe}` as PipeType;

          if (supportedPipes.includes(typ)) {
            params.push({
              param: paraT[0].slice(1),
              typ,
            });
          }
        }
      });

    path = removeParamPipes(path);

    if (params.length > 0) {
      return { path, params };
    }

    return null;
  }

  return null;
}

function convertParamTypeWithSupportedPipes(
  param: ParamDict[keyof ParamDict],
  typ: PipeType
) {
  switch (typ) {
    case "|string":
      return String(param);
    case "|number":
      return Number(param);
    case "|boolean":
      return param === "true";
    default:
      return param;
  }
}

/** check if given input is string or RegExp, if it's string then pass it to appendSlash*/
function withSlash(input: string | RegExp) {
  if (typeof input === "string") {
    return appendSlash(input);
  }

  return input;
}

export function isInstanceOfController(instance: U): instance is Controller {
  return (
    typeof instance.path === "string" &&
    !!instance.router &&
    Object.getPrototypeOf(instance.router) === Router
  );
}

export function Controller(path = "") {
  return function <T extends ClassType<U>>(Target: T) {
    // Here `implements Controller` is redundant b'cuz of the typescript issue as mention bellow
    // https://github.com/microsoft/TypeScript/issues/4881 😔
    // class extends Target implements Controller {

    return class extends Target {
      public readonly path = path;
      public readonly router: Router;

      constructor(...args: U[]) {
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
          const oldPath = [path].flat().map(withSlash);

          path = [...oldPath].map(removeParamPipes);

          // call the get, post ... of Express Router with `path` and `handler`
          this.router[option["METHOD"]](
            path,
            (req: Request<ParamDict>, res, next) => {
              // make typed params
              oldPath
                .map(detectTypeWithPipe)
                .filter(Boolean)
                .forEach((pt) => {
                  pt?.params.forEach(({ param, typ }) => {
                    if (req.params[param]) {
                      req.params[param] = convertParamTypeWithSupportedPipes(
                        req.params[param],
                        typ
                      );
                    }
                  });
                });

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
