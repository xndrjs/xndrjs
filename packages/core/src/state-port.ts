/**
 * Minimal state abstraction that works with any state management system
 * Compatible with: React useState, Solid Signals, Svelte Runes, ReactiveValue, etc.
 */
export interface StatePort<T> {
  /**
   * Get current value
   */
  get(): T;

  /**
   * Set new value (supports both direct value and updater function)
   */
  set(value: T | ((prev: T) => T)): void;

  /**
   * Subscribe to changes. Returns unsubscribe function.
   * Optional: some systems (like React) might not support subscriptions
   */
  subscribe?(callback: (value: T) => void): () => void;
}
