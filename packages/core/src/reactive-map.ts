import { produce, type Producer } from "immer";
import { AbstractReactiveValue } from "./abstract-reactive-value";
import { BatchContext } from "./batch-context";
import isEqual from "fast-deep-equal";

export interface ReactiveMapOptions<K, V, TPlain = Record<string, V>> {
  /**
   * Custom equality function for change detection.
   * If not provided, uses a Map-specific comparison (checks size, keys, and values with deep equality).
   */
  equals?: (a: unknown, b: unknown) => boolean;

  /**
   * Optional function to convert the map value to a plain object.
   * This is called when .toPlainObject() is invoked.
   *
   * **Important**: .get() always returns the original value unchanged.
   * Use .toPlainObject() to get the converted value.
   *
   * **Type Safety**: If you want to ensure the returned value is a PlainObject (Plain Old JavaScript Object),
   * use the exported `PlainObject` type as an annotation in your function.
   *
   * @param value - The current map value
   * @returns A plain object representation of the map (type: TPlain)
   */
  toPlainObject?: (value: Map<K, V>) => TPlain;
}

/**
 * ReactiveMap provides a convenient way to create reactive maps
 * with Immer for immutable updates.
 *
 * ReactiveMap extends AbstractReactiveValue<Map<K, V>>, so it can be used anywhere
 * a ReactiveValue is expected. Access the map via .value.
 * Use an empty map `new Map()` as the initial value if you need an empty map.
 */
export class ReactiveMap<
  K,
  V,
  TPlain = Record<string, V>,
> extends AbstractReactiveValue<Map<K, V>, TPlain> {
  private _equals: (a: unknown, b: unknown) => boolean;
  private _toPlainObject?: (value: Map<K, V>) => TPlain;

  constructor(
    initialValues: Map<K, V>,
    options: ReactiveMapOptions<K, V, TPlain> = {},
  ) {
    // Runtime validation
    if (!(initialValues instanceof Map)) {
      throw new Error(
        "ReactiveMap requires a Map. Received: " + typeof initialValues,
      );
    }

    // Initialize with initialValues
    super(initialValues);

    // Setup equality function
    if (options.equals) {
      this._equals = options.equals;
    } else {
      // Default: Map-specific comparison
      // fast-deep-equal doesn't handle Map correctly, so we use custom logic
      this._equals = (a, b) => {
        if (!(a instanceof Map) || !(b instanceof Map)) return false;
        if (a.size !== b.size) return false;
        for (const [key, value] of a) {
          if (!b.has(key)) return false;
          // Use deep equality for values if fast-deep-equal is available
          if (!isEqual(b.get(key), value)) return false;
        }
        return true;
      };
    }

    // Setup toPlainObject function
    this._toPlainObject = options.toPlainObject;
  }

  /**
   * Get the plain object representation of the value.
   * If toPlainObject is configured, returns the converted value (type: TPlain).
   * Otherwise, returns the default conversion (Map to object).
   *
   * This is called automatically when .toPlainObject() is invoked.
   *
   * @returns The plain object representation (type: TPlain)
   */
  toPlainObject(): TPlain {
    if (this._toPlainObject) {
      return this._toPlainObject(this.get());
    }
    // Default: convert Map to object (guaranteed to be PlainObject)
    return Object.fromEntries(this.get()) as TPlain;
  }

  /**
   * Set a new map or update using a callback function.
   *
   * When a callback is provided, it receives an Immer draft that can be mutated directly.
   * Note: Immer requires enableMapSet() to be called before using Set/Map.
   *
   * @example
   * ```typescript
   * import { enableMapSet } from "immer";
   * enableMapSet(); // Call this once at app initialization
   *
   * const map = new ReactiveMap(new Map([["key1", "value1"]]));
   *
   * // Direct value
   * map.set(new Map([["key2", "value2"]]));
   *
   * // Callback with Immer
   * map.set((draft) => {
   *   draft.set("key2", "value2");
   *   draft.delete("key1");
   * });
   * ```
   */
  override set(
    newValue: Map<K, V> | ((current: Map<K, V>) => Map<K, V>),
  ): void {
    if (typeof newValue === "function") {
      const currentValue = this.get();
      // Cast to Producer for Immer - the callback will receive an Immer draft
      const nextValue = produce(currentValue, newValue as Producer<Map<K, V>>);
      this._setValueInternal(nextValue);
    } else {
      this._setValueInternal(newValue);
    }
  }

  /**
   * Internal method to set value (override to use custom equality)
   */
  protected override _setValueInternal(newValue: Map<K, V>): void {
    if (!this._equals(this._value, newValue)) {
      this._value = newValue;
      this._shouldNotify = true;
      BatchContext.markDirty(this);
    }
  }

  /**
   * Subscribe to changes in the map value
   * Compatible with StatePort interface
   */
  override subscribe(callback: (value: Map<K, V>) => void): () => void {
    // Use AbstractReactiveValue's subscribe for value-based notifications
    return super.subscribe(callback);
  }
}
