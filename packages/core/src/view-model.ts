import type { Disposable } from "./disposable";
import { SubscriptionsRegistry } from "./subscriptions-registry";

/**
 * Base class for ViewModels that provides automatic cleanup of resources and subscriptions.
 * ViewModels are intended for the presentation layer and should be used with framework-specific
 * hooks (e.g., `useViewModel` in React) for automatic lifecycle management.
 *
 * Classes that extend ViewModel do not need to manually implement
 * [Symbol.dispose]() - it's done automatically.
 *
 * When [Symbol.dispose]() is called, all subscriptions registered
 * via SubscriptionsRegistry are automatically cleaned up.
 *
 * @example
 * ```typescript
 * class MyComponentVM extends ViewModel {
 *   private _computed: ComputedValue<number>;
 *
 *   constructor() {
 *     super();
 *     this._computed = createComputed(dep1, dep2)
 *       .as((d1, d2) => d1 + d2)
 *       .for(this);
 *   }
 *
 *   // No need to implement [Symbol.dispose]() - it's done automatically
 * }
 * ```
 *
 * @example
 * ```typescript
 * // If additional cleanup is needed, you can override and call super._cleanup()
 * class MyViewModelWithCleanup extends ViewModel {
 *   [Symbol.dispose](): void {
 *     super._cleanup(); // Call the base class cleanup
 *     // ... additional cleanup ...
 *   }
 * }
 * ```
 */
export abstract class ViewModel implements Disposable {
  private _isDisposed: boolean = false;

  /**
   * Returns whether this ViewModel has been disposed.
   * Used by framework hooks to detect if the instance needs to be recreated
   * (e.g., in React Strict Mode where cleanup runs twice).
   */
  get disposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Protected method for cleaning up subscriptions.
   * Derived classes can call super._cleanup() when
   * overriding [Symbol.dispose]() to execute the base class
   * cleanup before additional cleanup.
   *
   * This method is idempotent - calling it multiple times has no effect.
   */
  protected _cleanup(): void {
    if (this._isDisposed) {
      return; // Already disposed, exit early
    }
    this._isDisposed = true;
    SubscriptionsRegistry.cleanup(this);
  }

  /**
   * Automatic cleanup: removes all subscriptions registered
   * via SubscriptionsRegistry.
   *
   * This method is idempotent - calling it multiple times has no effect.
   */
  [Symbol.dispose](): void {
    this._cleanup();
  }
}
