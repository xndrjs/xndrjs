/**
 * Type helper to define what constitutes a Plain Old JavaScript Object (PlainObject).
 *
 * A PlainObject is:
 * - Primitives: string, number, boolean, null, undefined, symbol, bigint
 * - Arrays of PlainObject
 * - Plain objects with PlainObject properties
 *
 * Excludes: Map, Set, Date, RegExp, custom classes, functions
 *
 * **Usage**: Use this type to ensure that `toPlainObject` returns a PlainObject:
 *
 * @example
 * ```typescript
 * import { PlainObject } from 'use-less-react';
 *
 * const obj = new ReactiveObject({ tags: new Set(["a"]) }, {
 *   toPlainObject: (v) => {
 *     const toReturn = {
 *       ...v,
 *       tags: Array.from(v.tags)
 *     } satisfies PlainObject;
 *     return toReturn;
 *   }
 * });
 * ```
 */
export type PlainObject =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint
  | PlainObject[]
  | { [key: string]: PlainObject };
