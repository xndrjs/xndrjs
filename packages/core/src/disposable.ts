/**
 * Legacy Disposable interface (kept for type compatibility where needed).
 * New code should avoid Symbol.dispose cleanup in this package.
 */
export interface Disposable {
  [Symbol.dispose](): void;
}

/**
 * Helper type to decrement a number literal type
 */
type Prev = [never, 0, 1, 2, 3, 4];

/**
 * Type helper to extract all possible paths in an object, including nested paths.
 * Supports up to 4 levels of nesting for performance reasons.
 * Only includes string keys (excludes array indices and symbols).
 *
 * @example
 * ```typescript
 * type Example = {
 *   count: ReactiveValue<number>;
 *   meta: {
 *     user: { dispose: () => void };
 *     config: { value: number };
 *   };
 * };
 * // PathOf<Example> = "count" | "meta" | "meta.user" | "meta.config"
 * ```
 */
type PathOf<T, Depth extends number = 4> = Depth extends 0
  ? never
  : T extends object
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends object
            ? T[K] extends Array<unknown> | Function | Date | RegExp
              ? K
              : K | `${K}.${PathOf<T[K], Prev[Depth]>}`
            : K
          : never;
      }[keyof T]
    : never;

/**
 * Options for makeDisposableObject
 * @template T - The type of the object being made disposable
 */
export interface MakeDisposableObjectOptions<T extends object = object> {
  /**
   * Array of property paths to exclude from auto-disposal.
   * Supports nested paths using dot notation (e.g., "meta.user").
   * TypeScript will provide autocomplete for valid paths based on the object structure.
   */
  exclude?: Array<PathOf<T>>;
}

/**
 * Helper function to get a nested property value by path
 */
function getNestedProperty(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { value: any; exists: boolean } {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return { value: undefined, exists: false };
    }
    current = current[key];
  }

  return { value: current, exists: current !== undefined };
}

/**
 * Maximum depth for recursive disposal detection.
 * Matches the depth limit in the PathOf type (4 levels).
 */
const MAX_DISPOSAL_DEPTH = 4;

/**
 * Calculate the maximum depth of an object structure.
 * Used to warn if the object is deeper than MAX_DISPOSAL_DEPTH.
 */
function calculateMaxDepth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  currentDepth: number = 0,
  visited: WeakSet<object> = new WeakSet(),
): number {
  // Skip null, undefined, and non-objects
  if (obj == null || typeof obj !== "object") {
    return currentDepth;
  }

  // Skip arrays - we don't recurse into array elements
  if (Array.isArray(obj)) {
    return currentDepth;
  }

  // Prevent infinite loops with circular references
  if (visited.has(obj)) {
    return currentDepth;
  }
  visited.add(obj);

  let maxDepth = currentDepth;

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    const value = obj[key];

    // Skip if it's already disposable (we don't recurse into those)
    if (
      value &&
      typeof value === "object" &&
      typeof value[Symbol.dispose] === "function"
    ) {
      continue;
    }

    // Recurse into nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const depth = calculateMaxDepth(value, currentDepth + 1, visited);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Recursively find all properties with dispose() method in an object.
 * Checks all levels of nesting, not just first-level properties.
 * Limited to MAX_DISPOSAL_DEPTH levels for performance.
 */
function findDisposableProperties(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  excludePaths: string[] = [],
  currentPath: string = "",
  currentDepth: number = 0,
): string[] {
  const disposableKeys: string[] = [];

  // Skip null, undefined, and non-objects
  if (obj == null || typeof obj !== "object") {
    return disposableKeys;
  }

  // Skip arrays - we don't recurse into array elements
  if (Array.isArray(obj)) {
    return disposableKeys;
  }

  // Stop recursion at max depth
  if (currentDepth >= MAX_DISPOSAL_DEPTH) {
    return disposableKeys;
  }

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    const value = obj[key];

    // Skip if this path is excluded
    if (excludePaths.includes(fullPath)) {
      continue;
    }

    // Check if the value implements Disposable (has Symbol.dispose)
    if (
      value &&
      typeof value === "object" &&
      typeof value[Symbol.dispose] === "function"
    ) {
      disposableKeys.push(fullPath);
    }

    // Recurse into nested objects (but not if it's already disposable)
    // We check if it's a plain object (not a class instance with dispose)
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof value.dispose !== "function"
    ) {
      const nestedKeys = findDisposableProperties(
        value,
        excludePaths,
        fullPath,
        currentDepth + 1,
      );
      disposableKeys.push(...nestedKeys);
    }
  }

  return disposableKeys;
}

/**
 * Makes a plain object disposable by automatically detecting properties that implement `Disposable`
 * (have `Symbol.dispose`) and adding a `[Symbol.dispose]()` method that calls `[Symbol.dispose]()` on all detected properties.
 *
 * This provides automatic disposal for plain objects, similar to `DisposableResource` for classes.
 *
 * **Auto-detection**: Automatically finds all properties that implement `Disposable` (have `Symbol.dispose`).
 * Recursively checks all levels of nesting (not just first-level properties).
 *
 * **Exclude**: Use the `exclude` option to exclude specific properties from disposal,
 * even if they implement `Disposable`. Supports nested paths using dot notation.
 *
 * @param obj - The plain object to make disposable
 * @param options - Options for configuring disposal behavior
 * @returns The same object with a `[Symbol.dispose]()` method added
 *
 * @example
 * ```typescript
 * import { makeDisposableObject } from '@example/package/classes';
 * import { useDisposable } from '@example/package/client';
 *
 * function createCounterManager() {
 *   const count = new ReactiveValue(0);
 *   return makeDisposableObject({
 *     count,
 *     doubled: new ComputedValue(() => count.get() * 2, [count]),
 *     increment() {
 *       count.set(c => c + 1);
 *     }
 *   });
 *   // Automatically detects 'doubled' as disposable (via Symbol.dispose)
 *   // Note: ReactiveValue does NOT implement Disposable and does not need cleanup
 * }
 *
 * @example
 * ```typescript
 * // Excluding nested properties
 * function createManager() {
 *   return makeDisposableObject({
 *     count: new ReactiveValue(0),
 *     meta: {
 *       user: {
 *         [Symbol.dispose]: () => {} // Has Symbol.dispose but we don't want to auto-dispose it
 *       }
 *     }
 *   }, { exclude: ['meta.user'] });
 * }
 *
 * @example
 * ```typescript
 * // Usage with useDisposable
 * function Component() {
 *   const manager = useDisposable(() => createCounterManager());
 *   // manager[Symbol.dispose]() is called automatically on unmount
 * }
 * ```
 */
export function makeDisposableObject<T extends object>(
  obj: T,
  options: MakeDisposableObjectOptions<T> = {},
): T & Disposable {
  const { exclude = [] } = options;

  // Check if the object structure exceeds the maximum depth
  const maxDepth = calculateMaxDepth(obj);
  if (maxDepth > MAX_DISPOSAL_DEPTH) {
    console.warn(
      `[use-less-react] Object structure has a maximum depth of ${maxDepth} levels, but makeDisposableObject only performs auto-disposal up to ${MAX_DISPOSAL_DEPTH} levels. Properties deeper than ${MAX_DISPOSAL_DEPTH} levels will not be automatically disposed.`,
    );
  }

  // Find all disposable properties (recursively)
  // Type assertion: PathOf<T>[] is more specific than string[], but runtime is the same
  const disposablePaths = findDisposableProperties(obj, exclude as string[]);

  // Add Symbol.dispose method to the object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (obj as any)[Symbol.dispose] = function (this: T): void {
    for (const path of disposablePaths) {
      const { value } = getNestedProperty(this, path);

      // Check if the value implements Disposable
      if (
        value &&
        typeof value === "object" &&
        typeof value[Symbol.dispose] === "function"
      ) {
        try {
          value[Symbol.dispose]();
        } catch (error) {
          console.error(`Error disposing property "${path}":`, error);
        }
      }
    }
  };

  return obj as T & Disposable;
}
