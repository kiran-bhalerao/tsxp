import express, { Application, ErrorRequestHandler, Request, RequestHandler } from 'express'
import 'express-async-errors'
import { Controller, isInstanceOfController } from '../decorators/controller'
import { defaultErrorHandler } from '../utils/defaultErrorHandler'
import { ClassType, Injector } from './injector'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any

interface AppProps {
  controllers: ClassType<unknown>[]
  port?: string | number
  middlewares?: RequestHandler[]
  prefix?: string
  assetsPath?: string
  errorHandler?: ErrorRequestHandler
  context?: (req: Request) => Promise<Record<string, U>>
}

export class App {
  public app: Application
  private port: number
  private prefix: string
  private assetsPath: string

  constructor(props: AppProps) {
    const {
      port = 5000,
      middlewares = [],
      prefix = '',
      assetsPath = 'public',
      errorHandler = defaultErrorHandler,
      context
    } = props

    if (isNaN(Number(port))) {
      throw new Error('Invalid PORT env 🔴')
    }

    this.app = express()
    this.port = Number(port)
    this.prefix = prefix
    this.assetsPath = assetsPath

    // setup request context
    this.app.use(async (...args: U[]) => {
      if (context) {
        const ctx = await context(args[0])
        for (const key in ctx) {
          args[0][key] = ctx[key]
        }
      }
      args[2]()
    })

    this.middlewares(middlewares)
    this.assets()
    this.routes(props.controllers)

    /** Error handler middleware */
    this.app.use(errorHandler)

    /** Bind Listen method */
    this.listen = this.listen.bind(this)
  }

  private mapPath(path: string) {
    if (path.length > 1 && !path.startsWith('/')) {
      path = `/${path}`.trim()
    } else {
      path = path.trim()
    }

    return `${this.prefix}${path}`
  }

  private middlewares(middlewares: RequestHandler[]) {
    middlewares.forEach((middleWare: RequestHandler) => this.app.use(middleWare))
  }

  private routes(controllers: ClassType<unknown>[]) {
    controllers.forEach((controller, i) => {
      // Resolve the Injected dependencies
      controller = Injector.resolve(controller)

      if (isInstanceOfController(controller)) {
        this.app.use(this.mapPath(controller.path), controller.router)
      } else {
        if (controller instanceof Object) {
          throw new Error(
            `😲 I think you forgot to decorate \`${controller.constructor.name}\` class with \`@${Controller.name}()\`.`
          )
        }

        throw new Error(`😧 Invalid Controller passed to controllers array, check the n=${i + 1} item.`)
      }
    })
  }

  private assets() {
    this.app.use(this.mapPath(this.assetsPath), express.static('public'))
  }

  public async listen({ silent } = { silent: false }) {
    await new Promise<void>((res) => this.app.listen(this.port, res))

    if (!silent) {
      console.log(`\n🚀 Ready at http://localhost:${this.port} \n`)
    }
  }
}
