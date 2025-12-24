import { produce, type Producer } from "immer";
import { AbstractReactiveValue } from "./abstract-reactive-value";
import { BatchContext } from "./batch-context";
import type { EqualityOptions } from "./equality-options";
import type { PlainObject } from "./plain-object";
import { isImmerNonDraftableError } from "./immer-helpers";
import isEqual from "fast-deep-equal";

/**
 * Type helper to check if TValue is a PlainObject.
 * This checks if TValue is exactly a PlainObject, not just assignable to it.
 * If TValue is a class or other non-PlainObject type, useImmer must be false.
 *
 * The check works by verifying:
 * 1. TValue extends PlainObject (TValue is assignable to PlainObject)
 * 2. PlainObject extends TValue (PlainObject is assignable to TValue)
 * 3. TValue is not a function (functions are not PlainObject)
 * 4. TValue is not a class constructor
 *
 * If all conditions are met, TValue is a PlainObject.
 */
type IsPlainObject<T> = T extends PlainObject
  ? PlainObject extends T
    ? T extends Function
      ? false
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        T extends new (...args: any[]) => any
        ? false
        : true
    : false
  : false;

/**
 * Type helper for useImmer option.
 * If TValue is not a PlainObject, useImmer must be false (Immer doesn't support classes).
 */
type UseImmerOption<TValue> =
  IsPlainObject<TValue> extends true ? boolean | undefined : false;

/**
 * Base options interface for ReactiveObject.
 * useImmer is conditionally typed: if TValue is not a PlainObject, it must be false.
 */
interface ReactiveObjectOptionsBase<TValue, TPlain = TValue> {
  /**
   * Equality comparison options.
   * Default: { deepEquals: true } (uses fast-deep-equal)
   */
  compare?: EqualityOptions<TValue>;

  /**
   * If true, disables Immer for updates. When disabled, you must manually
   * ensure immutability by always creating new object references.
   *
   * **WARNING**: When `useImmer: false`, you are responsible for maintaining
   * immutability. Mutating the object directly will not trigger change detection.
   *
   * **Type Safety**: If TValue is not a PlainObject (e.g., a custom class),
   * useImmer is automatically forced to false because Immer doesn't support classes.
   *
   * @default true (only if TValue is a PlainObject)
   *
   * @example
   * ```typescript
   * // With Immer (default for PlainObject)
   * const obj = new ReactiveObject({ count: 1 });
   * obj.set(draft => { draft.count = 2; }); // Works
   *
   * // Without Immer
   * const obj = new ReactiveObject({ count: 1 }, { useImmer: false });
   * obj.set((current) => ({ ...current, count: 2 })); // Must return new object
   *
   * // With custom class - useImmer is automatically false
   * class MyClass { value: number; }
   * const obj = new ReactiveObject(new MyClass());
   * // TypeScript error if you try to set useImmer: true
   * ```
   */
  useImmer?: UseImmerOption<TValue>;

  /**
   * Optional function to convert the object value to a plain object.
   * This is called when .toPlainObject() is invoked.
   *
   * **Important**: .get() always returns the original value unchanged.
   * Use .toPlainObject() to get the converted value.
   *
   * **Type Safety**: If you want to ensure the returned value is a PlainObject (Plain Old JavaScript Object),
   * use the exported `PlainObject` type as an annotation in your function:
   *
   * ```typescript
   * import { PlainObject } from 'use-less-react';
   *
   * toPlainObject: (v) => {
   *   const toReturn = {
   *     ...v,
   *     tags: Array.from(v.tags)
   *   } satisfies PlainObject;
   *   return toReturn;
   * }
   * ```
   *
   * This will give you compile-time type checking that the result is a PlainObject.
   *
   * @param value - The current object value (type: TValue)
   * @returns A plain object representation of the value (type: TPlain)
   */
  toPlainObject?: (value: TValue) => TPlain;
}

/**
 * Options for ReactiveObject with conditional useImmer type.
 * If TValue is not a PlainObject, useImmer must be false.
 */
export type ReactiveObjectOptions<TValue, TPlain> = ReactiveObjectOptionsBase<
  TValue,
  TPlain
>;

/**
 * ReactiveObject provides a convenient way to create objects
 * with multiple reactive properties using Immer for immutable updates.
 *
 * ReactiveObject extends AbstractReactiveValue<T>, so it can be used anywhere
 * a ReactiveValue is expected. Access the object via .value.
 *
 * **Supported types in properties:**
 * - Primitives (string, number, boolean, null, undefined, symbol, bigint)
 * - Plain objects (PlainObject)
 * - Arrays
 * - **Date objects** (supported and compared by timestamp using deep equality)
 * - RegExp objects
 *
 * **Not supported with fast-deep-equal (default):**
 * - Set (provide a custom equality function to use Set, or use ReactiveSet instead)
 * - Map (provide a custom equality function to use Map, or use ReactiveMap instead)
 *
 * @example
 * ```typescript
 * // Non-nullable object (type inferred from initial value)
 * const obj = new ReactiveObject({ name: "John" });
 * // obj.get() is { name: string }
 *
 * // Nullable object (explicit type with null)
 * const nullableObj = new ReactiveObject<{ name: string } | null>(null);
 * // nullableObj.get() is { name: string } | null
 *
 * // With Date objects
 * const obj = new ReactiveObject({
 *   createdAt: new Date("2024-01-01"),
 *   user: { name: "John" }
 * });
 *
 * // With custom equality
 * const obj = new ReactiveObject(
 *   { count: 10 },
 *   { compare: { equals: (a, b) => a.count === b.count } } // Only compare count
 * );
 *
 * // Without Immer (manual immutability)
 * const obj = new ReactiveObject({ count: 1 }, { useImmer: false });
 * obj.set((current) => ({ ...current, count: 2 }));
 * ```
 */
export class ReactiveObject<
  TValue extends object | null,
  TPlain = TValue,
> extends AbstractReactiveValue<TValue, TPlain> {
  private _equals: (a: TValue, b: TValue) => boolean;
  private _useImmer: boolean;
  private _toPlainObject?: (value: TValue) => TPlain;

  constructor(
    initialValues: TValue,
    options: ReactiveObjectOptions<TValue, TPlain> = {},
  ) {
    // Determine if we're using fast-deep-equal (default)
    const usingFastDeepEqual =
      !options.compare ||
      (!("equals" in options.compare) &&
        (!("deepEquals" in options.compare) ||
          options.compare.deepEquals !== false));

    // Runtime validation
    if (initialValues !== null && initialValues !== undefined) {
      if (typeof initialValues !== "object") {
        throw new Error(
          "ReactiveObject requires a plain object or null. Received: " +
            typeof initialValues,
        );
      }
      if (Array.isArray(initialValues)) {
        throw new Error(
          "ReactiveObject does not support arrays. Use ReactiveArray instead.",
        );
      }
      if (usingFastDeepEqual) {
        if (initialValues instanceof Set) {
          throw new Error(
            "ReactiveObject does not support Set when using fast-deep-equal. " +
              "Provide a custom equality function in the options to use Set/Map, " +
              "or use ReactiveSet instead.",
          );
        }
        if (initialValues instanceof Map) {
          throw new Error(
            "ReactiveObject does not support Map when using fast-deep-equal. " +
              "Provide a custom equality function in the options to use Set/Map, " +
              "or use ReactiveMap instead.",
          );
        }
      }

      // Check nested properties for Set/Map (only if using fast-deep-equal)
      if (usingFastDeepEqual) {
        ReactiveObject._validateNestedProperties(
          initialValues as Record<string, unknown>,
        );
      }
    }

    // Initialize with initialValues
    super(initialValues);

    // Setup Immer usage
    this._useImmer = options.useImmer !== false; // Default to true

    // Setup equality function
    if (options.compare && "equals" in options.compare) {
      this._equals = options.compare.equals;
    } else if (
      options.compare &&
      "deepEquals" in options.compare &&
      options.compare.deepEquals === false
    ) {
      // Shallow equality: Object.is for reference comparison
      this._equals = Object.is;
    } else {
      // Deep equality (default): use fast-deep-equal
      this._equals = (a, b) => isEqual(a, b);
    }

    // Setup toPlainObject function
    this._toPlainObject = options.toPlainObject;
  }

  /**
   * Recursively validate that nested properties don't contain Set or Map
   * Static method to avoid calling 'this' before 'super()'
   */
  private static _validateNestedProperties(
    obj: Record<string, unknown>,
    path: string = "",
  ): void {
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        continue;
      }

      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (value instanceof Set) {
        throw new Error(
          `ReactiveObject does not support Set in property "${currentPath}" when using fast-deep-equal. ` +
            `Provide a custom equality function in the options to use Set/Map, ` +
            `or use ReactiveSet instead.`,
        );
      }

      if (value instanceof Map) {
        throw new Error(
          `ReactiveObject does not support Map in property "${currentPath}" when using fast-deep-equal. ` +
            `Provide a custom equality function in the options to use Set/Map, ` +
            `or use ReactiveMap instead.`,
        );
      }

      // Recursively check nested objects
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof RegExp)
      ) {
        ReactiveObject._validateNestedProperties(
          value as Record<string, unknown>,
          currentPath,
        );
      }
    }
  }

  /**
   * Get the plain object representation of the value.
   * If toPlainObject is configured, returns the converted value (type: TPlain).
   * Otherwise, returns the original value (type: TValue, which equals TPlain when no conversion).
   *
   * This is called automatically when .toPlainObject() is invoked.
   *
   * @returns The plain object representation (type: TPlain)
   */
  toPlainObject(): TPlain {
    if (this._toPlainObject) {
      return this._toPlainObject(this.get());
    }
    return this.get() as unknown as TPlain;
  }

  /**
   * Set a new value or update using a callback function.
   *
   * When a callback is provided and `useImmer: true` (default), the callback
   * receives an Immer draft that can be mutated directly.
   *
   * When a callback is provided and `useImmer: false`, the callback receives
   * the current value and must return a new object reference.
   *
   * @example
   * ```typescript
   * // Direct value
   * const obj = new ReactiveObject({ count: 0, name: "John" });
   * obj.set({ count: 10, name: "Jane" });
   *
   * // Callback with Immer (default)
   * obj.set((draft) => {
   *   draft.count = 10;
   *   draft.name = "Jane";
   * });
   *
   * // Without Immer
   * const obj = new ReactiveObject({ count: 0 }, { useImmer: false });
   * obj.set((current) => ({ ...current, count: 10 }));
   *
   * // Nullable object
   * const nullableObj = new ReactiveObject<{ name: string } | null>(null);
   * nullableObj.set((draft) => {
   *   if (draft === null) {
   *     return { name: "John" };
   *   }
   *   draft.name = "Jane";
   * });
   * ```
   */
  override set(
    newValue: TValue | Producer<TValue> | ((current: TValue) => TValue),
  ): void {
    if (typeof newValue === "function") {
      // Callback provided
      const updater = newValue as
        | Producer<TValue>
        | ((current: TValue) => TValue);
      const currentValue = this.get();

      if (this._useImmer) {
        // Use Immer if enabled
        try {
          const nextValue = produce(currentValue, updater as Producer<TValue>);
          this._setValueInternal(nextValue);
        } catch (error) {
          if (isImmerNonDraftableError(error)) {
            console.error(
              "[ReactiveObject] Immer cannot handle this value type (likely a class instance). " +
                "Set `useImmer: false` in the ReactiveObject options, or convert the class to a plain object. " +
                "Original error:",
              error,
            );
          }
          throw error;
        }
      } else {
        // Call callback directly (must return new value)
        const nextValue = (updater as (current: TValue) => TValue)(
          currentValue,
        );
        this._setValueInternal(nextValue);
      }
    } else {
      // Direct value - base behavior
      this._setValueInternal(newValue);
    }
  }

  /**
   * Internal method to set value (override to use custom equality)
   */
  protected override _setValueInternal(newValue: TValue): void {
    if (!this._equals(this._value, newValue)) {
      // Update value (parent class will handle notification via BatchContext)
      this._value = newValue;
      this._shouldNotify = true;
      // Use BatchContext to handle batching (same as parent)
      BatchContext.markDirty(this);
    }
  }

  /**
   * Subscribe to changes in the object value
   * Compatible with StatePort interface
   */
  override subscribe(callback: (value: TValue) => void): () => void {
    // Use AbstractReactiveValue's subscribe for value-based notifications
    return super.subscribe(callback);
  }
}
