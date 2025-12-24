import { BatchContext } from "./batch-context";
import type { StatePort } from "./state-port";

export type ReactiveValueSubscriber<T> = (value: T) => void;

/**
 * Symbol used for type inference of TPlain in AbstractReactiveValue.
 * This symbol is used internally by type helpers and should not be accessed directly.
 * It does not appear in normal autocomplete, keeping the API clean.
 */
export const PLAIN_TYPE = Symbol("_plainType");

/**
 * Abstract base class for all reactive values.
 * Contains all the common logic for reactive capabilities.
 *
 * @template T - The type of the value
 * @template TPlain - The type of the plain representation (defaults to T).
 *                    Used by subclasses that support toPlainObject conversion.
 */
export abstract class AbstractReactiveValue<
  T,
  TPlain = T,
> implements StatePort<T> {
  protected _value: T;
  /**
   * Symbol property for type inference only.
   * Used by ExtractReactiveValue type helper to infer TPlain.
   * Never actually used at runtime.
   */
  readonly [PLAIN_TYPE]!: TPlain;
  private _subscribers = new Set<ReactiveValueSubscriber<T>>();
  protected _shouldNotify: boolean = false;

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  /**
   * Get the current value
   *
   * @example
   * ```typescript
   * const count = new ReactiveValue(10);
   * const current = count.get(); // 10
   * ```
   */
  get(): T {
    return this._value;
  }

  /**
   * Set a new value (triggers notifications if changed).
   *
   * Accepts either a direct value or a callback function that receives
   * the current value and returns the new value.
   *
   * @example
   * ```typescript
   * const count = new ReactiveValue(10);
   * count.set(20); // Direct value
   * count.set(current => current + 1); // Callback function
   * ```
   */
  set(newValue: T | ((current: T) => T)): void {
    const valueToSet =
      typeof newValue === "function"
        ? (newValue as (current: T) => T)(this._value)
        : newValue;
    this._setValueInternal(valueToSet);
  }

  /**
   * Internal method to set value (protected for subclasses like ComputedValue)
   */
  protected _setValueInternal(newValue: T): void {
    // For primitive values, use Object.is for comparison
    if (!Object.is(this._value, newValue)) {
      this._value = newValue;
      this._shouldNotify = true;
      // Use BatchContext to handle batching
      BatchContext.markDirty(this);
    }
  }

  /**
   * Subscribe to value changes.
   * Implements StatePort interface.
   */
  subscribe(callback: (value: T) => void): () => void {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  /**
   * Manually trigger notification (useful for complex mutations)
   */
  notify(): void {
    this._shouldNotify = true;
    this._flushNotifications();
  }

  /**
   * Flush pending notifications (called by BatchContext).
   * Internal method - do not call directly.
   */
  _flushNotifications(): void {
    if (this._shouldNotify) {
      this._shouldNotify = false;
      const currentValue = this._value;
      this._subscribers.forEach((callback) => {
        try {
          callback(currentValue);
        } catch (error) {
          console.error("Error in ReactiveValue subscriber:", error);
        }
      });
    }
  }
}
