/**
 * Type utilities for StatePort
 */

import type { StatePort } from "./state-port";

/**
 * Extract the value type from a StatePort
 */
export type StatePortValue<T> = T extends StatePort<infer V> ? V : never;

/**
 * Helper type to check if a value is a StatePort
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IsStatePort<T> = T extends StatePort<any> ? true : false;

// Re-export StatePort for convenience
export type { StatePort };
