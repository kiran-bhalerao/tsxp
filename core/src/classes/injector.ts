import { Any } from "../utils/types";

export interface ClassType<T> {
  new (...args: Any[]): T;
}

export class Injector {
  static resolve<T>(Target: ClassType<Any>, resolvedDeps = new Map()): T {
    const dependencies: any[] =
      Reflect.getMetadata("design:paramtypes", Target) || [];

    if (dependencies.includes(undefined)) {
      throw new Error(`Circular dependencies found at class ${Target.name}`);
    }

    const injections = dependencies.map((dep: ClassType<Any>) => {
      return Injector.resolve<Any>(dep, resolvedDeps);
    });

    const target = new Target(...injections);
    return target;
  }
}
