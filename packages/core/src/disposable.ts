/**
 * Disposable interface for objects that need cleanup.
 */
export interface Disposable {
  [Symbol.dispose](): void;
}
