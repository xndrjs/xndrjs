export interface Disposable {
  [Symbol.dispose](): void;
}

/**
 * Wraps event handler registration and automatically unsubscribes on dispose.
 *
 * The callback is called immediately to register the handler(s) and must return
 * an unsubscribe function that will be called when the subscription is disposed.
 *
 * @example
 * ```typescript
 * import { DisposableResource } from "@xndrjs/core";
 *
 * class UserManager extends DisposableResource {
 *   private eventSubscriptions = new EventSubscription(() => {
 *     return eventBus.registerLocalHandler("UserCreated", (event) => {
 *       // Handle event
 *     });
 *   });
 *   // eventSubscriptions is automatically cleaned up via SubscriptionsRegistry when disposed
 *
 *   // Custom cleanup logic can be added by overriding [Symbol.dispose]() if needed
 * }
 * ```
 *
 * @example Multiple subscriptions
 * ```typescript
 * private eventSubscriptions = new EventSubscription(() => {
 *   const unsub1 = eventBus.registerLocalHandler("UserCreated", handler1);
 *   const unsub2 = eventBus.registerLocalHandler("UserDeleted", handler2);
 *   return () => {
 *     unsub1();
 *     unsub2();
 *   };
 * });
 * // Automatically cleaned up via SubscriptionsRegistry when disposed
 * ```
 */
export class EventSubscription implements Disposable {
  private _unsubscribe: (() => void) | null;
  private _disposed: boolean = false;

  /**
   * @param registerCallback - Function that registers the handler(s) and returns an unsubscribe function
   */
  constructor(registerCallback: () => () => void) {
    this._unsubscribe = registerCallback();
  }

  [Symbol.dispose](): void {
    if (this._disposed || !this._unsubscribe) {
      return;
    }
    this._unsubscribe();
    this._unsubscribe = null;
    this._disposed = true;
  }

  get disposed(): boolean {
    return this._disposed;
  }
}
