import { useRef } from "react";

/**
 * Create a stable reference to a value that is computed only once.
 * The factory function is called only on the first render, and the same
 * reference is returned on subsequent renders.
 *
 * This is useful for creating objects that should be stable across renders,
 * such as managers or services that depend on stable dependencies.
 *
 * @param factory - Function that returns the value to store (called only once)
 * @returns The stable reference to the value
 *
 * @example
 * ```tsx
 * const manager = useStableReference(() =>
 *   new TodoListManager(todosPort, historyPort, eventBus)
 * );
 * ```
 */
export function useStableReference<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);
  if (ref.current === null) {
    ref.current = factory();
  }
  return ref.current;
}
