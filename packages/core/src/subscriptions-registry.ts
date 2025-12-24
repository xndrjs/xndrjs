import type { Disposable } from "./disposable";

/**
 * Global registry for managing cleanup of all subscriptions.
 * Tracks all subscriptions (computed values, event handlers, etc.)
 * associated with a Disposable object to enable automatic cleanup.
 */
export class SubscriptionsRegistry {
  private static _subscriptions = new WeakMap<Disposable, Array<() => void>>();

  /**
   * Registers an unsubscribe function for a Disposable owner.
   * When the owner is disposed, all registered subscriptions
   * are automatically cancelled.
   *
   * @param owner - The Disposable object that owns the subscription
   * @param unsubscribe - Function to cancel the subscription
   */
  static register(owner: Disposable, unsubscribe: () => void): void {
    const existing = this._subscriptions.get(owner) || [];
    existing.push(unsubscribe);
    this._subscriptions.set(owner, existing);
  }

  /**
   * Removes all registered subscriptions for an owner and executes them.
   * Called automatically by DisposableResource[Symbol.dispose]().
   *
   * @param owner - The Disposable object to clean up subscriptions for
   */
  static cleanup(owner: Disposable): void {
    const unsubscribes = this._subscriptions.get(owner);
    if (unsubscribes) {
      unsubscribes.forEach((unsub) => unsub());
      this._subscriptions.delete(owner);
    }
  }
}
