import type { Disposable } from "./disposable";
import { SubscriptionsRegistry } from "./subscriptions-registry";

/**
 * Abstract base class that implements Disposable with automatic cleanup.
 * Classes that extend DisposableResource do not need to manually implement
 * [Symbol.dispose]() - it's done automatically.
 *
 * When [Symbol.dispose]() is called, all subscriptions registered
 * via SubscriptionsRegistry are automatically cleaned up.
 *
 * @example
 * ```typescript
 * class MyBusinessLogic extends DisposableResource {
 *   private _computed: ComputedValue<number>;
 *
 *   constructor() {
 *     super();
 *     this._computed = createComputed(this)
 *       .from(dep1, dep2)
 *       .as((d1, d2) => d1 + d2);
 *   }
 *
 *   // No need to implement [Symbol.dispose]() - it's done automatically
 * }
 * ```
 *
 * @example
 * ```typescript
 * // If additional cleanup is needed, you can override and call super._cleanup()
 * class MyClassWithCleanup extends DisposableResource {
 *   [Symbol.dispose](): void {
 *     super._cleanup(); // Call the base class cleanup
 *     // ... additional cleanup ...
 *   }
 * }
 * ```
 */
export abstract class DisposableResource implements Disposable {
  /**
   * Protected method for cleaning up subscriptions.
   * Derived classes can call super._cleanup() when
   * overriding [Symbol.dispose]() to execute the base class
   * cleanup before additional cleanup.
   */
  protected _cleanup(): void {
    SubscriptionsRegistry.cleanup(this);
  }

  /**
   * Automatic cleanup: removes all subscriptions registered
   * via SubscriptionsRegistry.
   */
  [Symbol.dispose](): void {
    this._cleanup();
  }
}
