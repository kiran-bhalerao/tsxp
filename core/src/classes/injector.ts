// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any

export interface ClassType<T> {
  new (...args: U[]): T
}

export class Injector {
  static resolve<T>(Target: ClassType<U>): T {
    const dependencies = Reflect.getMetadata('design:paramtypes', Target) || []
    const injections = dependencies.map((dep: ClassType<U>) => Injector.resolve<U>(dep))

    return new Target(...injections)
  }
}
