import express, {
  Application,
  ErrorRequestHandler,
  Request,
  RequestHandler,
} from "express";
import "express-async-errors";
import { Controller, isInstanceOfController } from "../decorators/controller";
import { defaultErrorHandler } from "../utils/defaultErrorHandler";
import { Any } from "../utils/types";
import { ClassType, Injector } from "./injector";

interface AppProps {
  controllers: ClassType<unknown>[];
  port?: string | number;
  middlewares?: RequestHandler[];

  /**
   * @description
   * with this you can add App level prefix
   *
   * @example
   * ```
   * prefix: '/api' // now every end point will have this prefix attached
   * ```
   */
  prefix?: string;
  /**
   * @description
   * This is static path to serve static assets from **public folder** \
   * Lets say our public folder contains **index.html** file and we've set assetsPath to **\/assets** \
   * Now we can access the index.html file on http://localhost:5000/assets/index.html
   *
   * @example
   * ```
   * assetsPath: '/assets'
   * ```
   * @default
   * assetsPath: ''
   */
  assetsPath?: string;
  /**
   * @description
   * if you want to customize error handling this is a right place \
   * Dont know express's error handler, checkout 👇
   *
   * https://gist.github.com/CallbacKiran/bb0e70855480c4f90d22bc774d13ce97
   */
  errorHandler?: ErrorRequestHandler;
  /**
   *
   * tl;dr `@Auth` decorator needs user object in req.  so just return { user: {...} } object from context
   *
   * @description
   * if you are not using on third party solution for authentication like passport.js
   * basically the third party soln just validate user jwt token and attach current user to req.user object
   * if you are doing this by your own way, we suggest to do this in context body
   *
   * @example
   * ```
   * context(req) {
   *   const jwtToken = req.headers['Authorization']
   *   const user = getUserFromToken(jwtToken)
   *   return { user }
   * }
   * ```
   */
  context?: (req: Request) => Promise<Record<string, Any>>;
}

export class App {
  public app: Application;

  private port: number;
  private prefix: string;
  private assetsPath: string;

  constructor(props: AppProps) {
    const {
      port = 5000,
      middlewares = [],
      prefix = "",
      assetsPath = "",
      errorHandler = defaultErrorHandler,
      context,
    } = props;

    if (isNaN(Number(port))) {
      throw new Error("Invalid PORT env 🔴");
    }

    this.app = express();
    this.port = Number(port);
    this.prefix = prefix;
    this.assetsPath = assetsPath;

    // setup request context
    this.app.use(async (...args: Any[]) => {
      if (context) {
        const ctx = await context(args[0]);
        for (const key in ctx) {
          args[0][key] = ctx[key];
        }
      }
      args[2]();
    });

    this.middlewares(middlewares);
    this.assets();
    this.routes(props.controllers);

    /** Error handler middleware */
    this.app.use(errorHandler);

    /** Bind Listen method */
    this.listen = this.listen.bind(this);
  }

  private mapPath(path: string) {
    if (path.length > 1 && !path.startsWith("/")) {
      path = `/${path}`.trim();
    } else {
      path = path.trim();
    }

    return `${this.prefix}${path}`;
  }

  private middlewares(middlewares: RequestHandler[]) {
    middlewares.forEach((middleWare: RequestHandler) =>
      this.app.use(middleWare)
    );
  }

  private routes(controllers: ClassType<unknown>[]) {
    controllers.forEach((controller, i) => {
      // Resolve the Injected dependencies
      controller = Injector.resolve(controller);

      if (isInstanceOfController(controller)) {
        this.app.use(this.mapPath(controller.path), controller.router);
      } else {
        if (controller instanceof Object) {
          throw new Error(
            `😲 I think you forgot to decorate \`${controller.constructor.name}\` class with \`@${Controller.name}()\`.`
          );
        }

        throw new Error(
          `😧 Invalid Controller passed to controllers array, check the n=${
            i + 1
          } item.`
        );
      }
    });
  }

  private assets() {
    this.app.use(this.assetsPath, express.static("public"));
  }

  public async listen({ silent } = { silent: false }) {
    await new Promise<void>((res) => this.app.listen(this.port, res));

    if (!silent) {
      console.log(`\n🚀 Ready at http://localhost:${this.port} \n`);
    }
  }
}
