/**
 * Options for equality comparison in reactive collections.
 * Either provide a custom equality function, or specify whether to use deep equality.
 * Default: { deepEquals: true }
 */
export type EqualityOptions<T = unknown> =
  | { equals: (a: T, b: T) => boolean }
  | { deepEquals: boolean };
