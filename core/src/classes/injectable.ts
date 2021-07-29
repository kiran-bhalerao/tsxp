import { ClassType } from "./injector";

/**
 * Class decorator factory that allows the class' dependencies to be injected
 * at runtime.
 *
 * @return {Function} The class decorator
 */
export function Injectable<T>(): (target: ClassType<T>) => void {
  return function (_target: ClassType<T>): void {};
}
