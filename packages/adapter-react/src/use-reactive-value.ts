import { useSyncExternalStore, useEffect, useRef, useState } from "react";
import type { ComputedValue, StatePort } from "@xndrjs/core";

/**
 * Helper function for shallow equality check (for objects)
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!Object.is((a as any)[key], (b as any)[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Type guard to check if a port is a ComputedValue
 */
function isComputedValue<T>(port: StatePort<T>): port is ComputedValue<T> {
  return "dependencies" in port && Array.isArray(port.dependencies);
}

/**
 * Internal hook for ComputedValue with shallow equality check
 * Note: This hook must always be called (even with null) to satisfy rules-of-hooks
 */
function useComputedValue<T>(
  computedValue: ComputedValue<T> | null,
): T | undefined {
  // Optimize: use ref instead of state when port is null (no re-renders needed)
  const valueRef = useRef<T | undefined>(
    computedValue ? computedValue.get() : undefined,
  );
  const computedValueRef = useRef(computedValue);
  const previousValueRef = useRef<T | undefined>(valueRef.current);

  // Keep latest computed value
  computedValueRef.current = computedValue;

  // Only use useState if we have a computedValue (need re-renders on changes)
  // Otherwise use ref (no re-renders needed, value is always undefined)
  const [value, setValue] = useState<T | undefined>(() => {
    if (!computedValue) return undefined;
    const initialValue = computedValue.get();
    previousValueRef.current = initialValue;
    valueRef.current = initialValue;
    return initialValue;
  });

  useEffect(() => {
    if (!computedValue) {
      // No subscriptions if not a computed port - early return (minimal overhead)
      return;
    }

    const unsubscribers: (() => void)[] = [];

    function handleDepChange() {
      if (!computedValueRef.current) return;
      const newValue = computedValueRef.current.get();
      // Only update if the value actually changed (shallow equality for objects)
      if (!shallowEqual(previousValueRef.current, newValue)) {
        previousValueRef.current = newValue;
        setValue(newValue);
      }
    }

    const dependencies = computedValue.dependencies;
    for (const dep of dependencies) {
      if (dep.subscribe) {
        const unsub = dep.subscribe(handleDepChange);
        unsubscribers.push(unsub);
      }
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
    // We intentionally depend on computedValue and its dependencies array reference
    // This ensures we re-subscribe if dependencies change
  }, [computedValue]);

  return value;
}

/**
 * Subscribe to a reactive value and return its current value.
 * The component will re-render when the reactive value changes.
 *
 * When a class exposes a value (whether it's a StatePort, ComputedValue, or AbstractReactiveValue),
 * it should be interpreted as a "reactive value" - something that can change over time and trigger
 * reactivity. The hook works with any value that implements the StatePort interface.
 *
 * Automatically handles ComputedValue with shallow equality to prevent infinite loops
 * when computed values return objects.
 *
 * Uses React's `useSyncExternalStore` for regular StatePort (more efficient).
 * Uses internal state management for ComputedValue to handle object equality correctly.
 *
 * @param reactiveValue - The reactive value (StatePort, ComputedValue, or AbstractReactiveValue) to subscribe to
 * @returns The current value from the reactive value
 *
 * @example
 * ```tsx
 * const todosPort = useCreateStatePort([]);
 * const todos = useReactiveValue(todosPort);
 *
 * // Works with ComputedValue too
 * const timePort = stopwatchFSM.timePort; // ComputedValue
 * const time = useReactiveValue(timePort);
 *
 * // Works with ReactiveValue directly
 * const count = new ReactiveValue(10);
 * const countValue = useReactiveValue(count);
 *
 * return <div>{todos.length} todos, time: {time.hours}, count: {countValue}</div>;
 * ```
 */
export function useReactiveValue<T>(reactiveValue: StatePort<T>): T {
  // Check if it's a ComputedValue (but always call both hooks to satisfy rules-of-hooks)
  const isComputed = isComputedValue(reactiveValue);
  const computedValue = useComputedValue(
    isComputed ? reactiveValue : (null as unknown as ComputedValue<T>),
  );

  // For ComputedValue, we don't need useSyncExternalStore (we use useComputedValue instead)
  // But we must call it to satisfy rules-of-hooks. We optimize by not subscribing for ComputedValue.
  const syncValue = useSyncExternalStore(
    (onStoreChange) => {
      // Don't subscribe if it's a ComputedValue (we handle it via useComputedValue)
      if (isComputed || !reactiveValue.subscribe) {
        return () => {};
      }
      return reactiveValue.subscribe(onStoreChange);
    },
    () => {
      // Only call get() if not ComputedValue (to avoid unnecessary object creation)
      if (isComputed) {
        // Return a stable value for ComputedValue (will be ignored anyway)
        return undefined as unknown as T;
      }
      return reactiveValue.get();
    },
    () => {
      // Server snapshot - same logic
      if (isComputed) {
        return undefined as unknown as T;
      }
      return reactiveValue.get();
    },
  );

  // Return the appropriate value based on reactive value type
  // If isComputed is true, computedValue will be defined (not undefined)
  return (isComputed ? computedValue : syncValue) as T;
}
