import { Any } from "../utils/types";

export interface ClassType<T> {
  new (...args: Any[]): T;
}

export class Injector {
  static resolve<T>(Target: ClassType<Any>): T {
    const dependencies = Reflect.getMetadata("design:paramtypes", Target) || [];
    const injections = dependencies.map((dep: ClassType<Any>) =>
      Injector.resolve<Any>(dep)
    );

    return new Target(...injections);
  }
}
