import { produce, type Producer } from "immer";
import { AbstractReactiveValue } from "./abstract-reactive-value";
import { BatchContext } from "./batch-context";
import type { EqualityOptions } from "./equality-options";
import { isImmerNonDraftableError } from "./immer-helpers";
import isEqual from "fast-deep-equal";

export interface ReactiveArrayOptions<
  TValueItem,
  TPlainItem = TValueItem,
  TPlain = TPlainItem[],
> {
  /**
   * Equality comparison options.
   * Default: { deepEquals: true } (uses fast-deep-equal)
   */
  compare?: EqualityOptions<TValueItem[]>;

  /**
   * If true, disables Immer for updates. When disabled, you must manually
   * ensure immutability by always creating new array references.
   *
   * **WARNING**: When `useImmer: false`, you are responsible for maintaining
   * immutability. Mutating the array directly will not trigger change detection.
   *
   * @default true
   *
   * @example
   * ```typescript
   * // With Immer (default)
   * const arr = new ReactiveArray([1, 2, 3]);
   * arr.set(draft => { draft.push(4); }); // Works
   *
   * // Without Immer
   * const arr = new ReactiveArray([1, 2, 3], { useImmer: false });
   * arr.set((current) => [...current, 4]); // Must create new array
   * ```
   */
  useImmer?: boolean;

  /**
   * Optional function to convert the array value to a plain array.
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
   * toPlainObject: (arr) => {
   *   const toReturn = arr.map(item => ({
   *     ...item,
   *     tags: Array.from(item.tags)
   *   })) satisfies PlainObject;
   *   return toReturn;
   * }
   * ```
   *
   * @param value - The current array value (type: TValueItem[])
   * @returns A plain array representation of the value (type: TPlain, default: TPlainItem[])
   */
  toPlainObject?: (value: TValueItem[]) => TPlain;
}

/**
 * ReactiveArray provides a convenient way to create reactive arrays
 * with Immer for immutable updates.
 *
 * ReactiveArray extends AbstractReactiveValue<T[]>, so it can be used anywhere
 * a ReactiveValue is expected. Access the array via .value.
 * Use an empty array [] as the initial value if you need an empty array.
 *
 * **Supported element types:**
 * - Primitives (string, number, boolean, null, undefined, symbol, bigint)
 * - Plain objects (PlainObject)
 * - Nested arrays
 * - **Date objects** (supported and compared by timestamp using deep equality)
 * - RegExp objects
 *
 * @example
 * ```typescript
 * // Array of primitives
 * const arr = new ReactiveArray([1, 2, 3]);
 *
 * // Array with Date objects
 * const dates = new ReactiveArray([
 *   new Date("2024-01-01"),
 *   new Date("2024-01-02")
 * ]);
 *
 * // Array of objects with Date properties
 * const items = new ReactiveArray([
 *   { id: 1, createdAt: new Date("2024-01-01") },
 *   { id: 2, createdAt: new Date("2024-01-02") }
 * ]);
 * ```
 */
export class ReactiveArray<
  TValueItem,
  TPlainItem = TValueItem,
  TPlain = TPlainItem[],
> extends AbstractReactiveValue<TValueItem[], TPlain> {
  private _equals: (a: TValueItem[], b: TValueItem[]) => boolean;
  private _useImmer: boolean;
  private _toPlainObject?: (value: TValueItem[]) => TPlain;

  constructor(
    initialValues: TValueItem[],
    options: ReactiveArrayOptions<TValueItem, TPlainItem, TPlain> = {},
  ) {
    // Runtime validation
    if (!Array.isArray(initialValues)) {
      throw new Error(
        "ReactiveArray requires an array. Received: " + typeof initialValues,
      );
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
   * Get the plain array representation of the value.
   * If toPlainObject is configured, returns the converted value (type: TPlain, default: TPlainItem[]).
   * Otherwise, returns the original value (type: TValueItem[], which equals TPlain when no conversion).
   *
   * This is called automatically when .toPlainObject() is invoked.
   *
   * @returns The plain array representation (type: TPlain, default: TPlainItem[])
   */
  toPlainObject(): TPlain {
    if (this._toPlainObject) {
      return this._toPlainObject(this.get());
    }
    return this.get() as unknown as TPlain;
  }

  /**
   * Set a new array or update using a callback function.
   *
   * When a callback is provided and `useImmer: true` (default), the callback
   * receives an Immer draft that can be mutated directly.
   *
   * When a callback is provided and `useImmer: false`, the callback receives
   * the current array and must return a new array reference.
   *
   * @example
   * ```typescript
   * // Direct value
   * const arr = new ReactiveArray([1, 2, 3]);
   * arr.set([4, 5, 6]);
   *
   * // Callback with Immer (default)
   * arr.set((draft) => {
   *   draft.push(4);
   *   draft[0] = 10;
   * });
   *
   * // Without Immer
   * const arr = new ReactiveArray([1, 2, 3], { useImmer: false });
   * arr.set((current) => [...current, 4]);
   * ```
   */
  override set(
    newValue:
      | TValueItem[]
      | Producer<TValueItem[]>
      | ((current: TValueItem[]) => TValueItem[]),
  ): void {
    if (typeof newValue === "function") {
      // Callback provided
      const updater = newValue as
        | Producer<TValueItem[]>
        | ((current: TValueItem[]) => TValueItem[]);
      const currentValue = this.get();

      if (this._useImmer) {
        // Use Immer if enabled
        try {
          const nextValue = produce(
            currentValue,
            updater as Producer<TValueItem[]>,
          );
          this._setValueInternal(nextValue);
        } catch (error) {
          if (isImmerNonDraftableError(error)) {
            console.error(
              "[ReactiveArray] Immer cannot handle this value type (likely a class instance in the array). " +
                "Set `useImmer: false` in the ReactiveArray options, or convert the classes to plain objects. " +
                "Original error:",
              error,
            );
          }
          throw error;
        }
      } else {
        // Call callback directly (must return new array)
        const nextValue = (updater as (current: TValueItem[]) => TValueItem[])(
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
  protected override _setValueInternal(newValue: TValueItem[]): void {
    if (!this._equals(this._value, newValue)) {
      this._value = newValue;
      this._shouldNotify = true;
      BatchContext.markDirty(this);
    }
  }

  /**
   * Subscribe to changes in the array value
   * Compatible with StatePort interface
   */
  override subscribe(callback: (value: TValueItem[]) => void): () => void {
    // Use AbstractReactiveValue's subscribe for value-based notifications
    return super.subscribe(callback);
  }
}
