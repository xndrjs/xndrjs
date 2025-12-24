import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { StatePort } from "@xndrjs/core";

/**
 * Create a StatePort from React useState
 * Returns a stable StatePort object that doesn't change reference when value changes.
 * The port remains reactive: subscribe() will notify when value changes.
 * The port.get() function is stable but always returns the current value via valueRef.
 */
export function useStatePort<T>(
  value: T,
  setValue: Dispatch<SetStateAction<T>>,
): StatePort<T> {
  const subscribersRef = useRef(new Set<(v: T) => void>());
  const valueRef = useRef(value);
  const setValueRef = useRef(setValue);

  // Update refs when they change
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    setValueRef.current = setValue;
  }, [setValue]);

  // Notify subscribers when value changes
  useEffect(() => {
    subscribersRef.current.forEach((callback) => {
      callback(value);
    });
  }, [value]);

  // Create stable set and subscribe functions
  const stableSet = useCallback((newValue: T | ((prev: T) => T)) => {
    // Update valueRef immediately so get() returns correct value synchronously
    if (typeof newValue === "function") {
      const updater = newValue as (prev: T) => T;
      valueRef.current = updater(valueRef.current);
    } else {
      valueRef.current = newValue;
    }
    setValueRef.current(newValue);
  }, []);

  const stableSubscribe = useCallback((callback: (value: T) => void) => {
    subscribersRef.current.add(callback);
    // Immediately call with current value (standard subscription pattern)
    callback(valueRef.current);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Create stable get function that always reads current value from ref
  // This allows the port object to remain stable while still being reactive
  const get = useCallback(() => valueRef.current, []);

  // Create stable port object that never changes reference
  // This allows it to be used in useRef/useMemo dependencies without causing re-renders
  const portRef = useRef<StatePort<T> | null>(null);
  if (!portRef.current) {
    portRef.current = {
      get,
      set: stableSet,
      subscribe: stableSubscribe,
    };
  }

  return portRef.current;
}
