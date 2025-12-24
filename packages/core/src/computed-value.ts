/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StatePort } from "./state-port";

/**
 * Computed value that declares its dependencies.
 * Framework adapters (React, Solid, Svelte, ...) can use
 * these dependencies to build native computed values.
 */
export interface ComputedValue<T> extends StatePort<T> {
  /**
   * Dependencies of this computed value.
   * Used by framework adapters to subscribe and recompute.
   */
  dependencies: ReadonlyArray<StatePort<any>>;
}
