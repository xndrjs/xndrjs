import { produce, type Producer } from "immer";
import { AbstractReactiveValue } from "./abstract-reactive-value";
import { BatchContext } from "./batch-context";

export interface ReactiveSetOptions<T, TPlain = T[]> {
  /**
   * Custom equality function for change detection.
   * If not provided, uses a Set-specific comparison (checks size and all items).
   */
  equals?: (a: unknown, b: unknown) => boolean;

  /**
   * Optional function to convert the set value to a plain array.
   * This is called when .toPlainObject() is invoked.
   *
   * **Important**: .get() always returns the original value unchanged.
   * Use .toPlainObject() to get the converted value.
   *
   * **Type Safety**: If you want to ensure the returned value is a PlainObject (Plain Old JavaScript Object),
   * use the exported `PlainObject` type as an annotation in your function.
   *
   * @param value - The current set value
   * @returns A plain array representation of the set (type: TPlain)
   */
  toPlainObject?: (value: Set<T>) => TPlain;
}

/**
 * ReactiveSet provides a convenient way to create reactive sets
 * with Immer for immutable updates.
 *
 * ReactiveSet extends AbstractReactiveValue<Set<T>>, so it can be used anywhere
 * a ReactiveValue is expected. Access the set via .value.
 * Use an empty set `new Set()` as the initial value if you need an empty set.
 */
export class ReactiveSet<T, TPlain = T[]> extends AbstractReactiveValue<
  Set<T>,
  TPlain
> {
  private _equals: (a: unknown, b: unknown) => boolean;
  private _toPlainObject?: (value: Set<T>) => TPlain;

  constructor(
    initialValues: Set<T>,
    options: ReactiveSetOptions<T, TPlain> = {},
  ) {
    // Runtime validation
    if (!(initialValues instanceof Set)) {
      throw new Error(
        "ReactiveSet requires a Set. Received: " + typeof initialValues,
      );
    }

    // Initialize with initialValues
    super(initialValues);

    // Setup equality function
    if (options.equals) {
      this._equals = options.equals;
    } else {
      // Default: Set-specific comparison
      // fast-deep-equal doesn't handle Set correctly, so we use custom logic
      this._equals = (a, b) => {
        if (!(a instanceof Set) || !(b instanceof Set)) return false;
        if (a.size !== b.size) return false;
        for (const item of a) {
          if (!b.has(item)) return false;
        }
        return true;
      };
    }

    // Setup toPlainObject function
    this._toPlainObject = options.toPlainObject;
  }

  /**
   * Get the plain array representation of the value.
   * If toPlainObject is configured, returns the converted value (type: TPlain).
   * Otherwise, returns the default conversion (Set to array).
   *
   * This is called automatically when .toPlainObject() is invoked.
   *
   * @returns The plain array representation (type: TPlain)
   */
  toPlainObject(): TPlain {
    if (this._toPlainObject) {
      return this._toPlainObject(this.get());
    }
    // Default: convert Set to array (guaranteed to be PlainObject)
    return Array.from(this.get()) as TPlain;
  }

  /**
   * Set a new set or update using a callback function.
   *
   * When a callback is provided, it receives an Immer draft that can be mutated directly.
   * Note: Immer requires enableMapSet() to be called before using Set/Map.
   *
   * @example
   * ```typescript
   * import { enableMapSet } from "immer";
   * enableMapSet(); // Call this once at app initialization
   *
   * const set = new ReactiveSet(new Set([1, 2, 3]));
   *
   * // Direct value
   * set.set(new Set([4, 5, 6]));
   *
   * // Callback with Immer
   * set.set((draft) => {
   *   draft.add(4);
   *   draft.delete(2);
   * });
   * ```
   */
  override set(newValue: Set<T> | ((current: Set<T>) => Set<T>)): void {
    if (typeof newValue === "function") {
      const currentValue = this.get();
      // Cast to Producer for Immer - the callback will receive an Immer draft
      const nextValue = produce(currentValue, newValue as Producer<Set<T>>);
      this._setValueInternal(nextValue);
    } else {
      this._setValueInternal(newValue);
    }
  }

  /**
   * Internal method to set value (override to use custom equality)
   */
  protected override _setValueInternal(newValue: Set<T>): void {
    if (!this._equals(this._value, newValue)) {
      this._value = newValue;
      this._shouldNotify = true;
      BatchContext.markDirty(this);
    }
  }

  /**
   * Subscribe to changes in the set value
   * Compatible with StatePort interface
   */
  override subscribe(callback: (value: Set<T>) => void): () => void {
    // Use AbstractReactiveValue's subscribe for value-based notifications
    return super.subscribe(callback);
  }
}
