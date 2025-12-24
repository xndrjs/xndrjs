import { useState } from "react";
import { useStatePort } from "./use-state-port";

/**
 * Create a StatePort from an initial value.
 * Returns the StatePort, reactive value, and setter for React.
 * The returned object is memoized to avoid unnecessary re-renders.
 *
 * This is a convenience wrapper around useState + useStatePort.
 */
export function useCreateStatePort<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  return useStatePort(value, setValue);
}
