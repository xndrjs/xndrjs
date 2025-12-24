import { AbstractReactiveValue } from "./abstract-reactive-value";

// Re-export for backward compatibility
export type { ReactiveValueSubscriber } from "./abstract-reactive-value";
export { AbstractReactiveValue } from "./abstract-reactive-value";

/**
 * ReactiveValue wraps a value and provides reactive capabilities
 * for primitive values.
 *
 * ReactiveValue extends AbstractReactiveValue<T, T> and adds runtime validation
 * to ensure only primitive values are used (rejects arrays and objects).
 *
 * ReactiveValue is designed for primitive values (number, string, boolean, null, undefined).
 * For complex data structures, use ReactiveObject, ReactiveArray, ReactiveSet, or ReactiveMap.
 *
 * @template T - The type of the value
 */
export class ReactiveValue<T> extends AbstractReactiveValue<T, T> {
  constructor(initialValue: T) {
    // Runtime validation: reject arrays (use ReactiveArray instead)
    if (Array.isArray(initialValue)) {
      throw new Error(
        "ReactiveValue does not support arrays. Use ReactiveArray instead.",
      );
    }
    // Runtime validation: reject objects (use ReactiveObject instead)
    if (typeof initialValue === "object" && initialValue) {
      throw new Error(
        "ReactiveValue does not support objects. Use ReactiveObject instead.",
      );
    }

    super(initialValue);
  }
}
