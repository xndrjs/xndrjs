import { BatchContext } from "./batch-context";

/**
 * Batch multiple ReactiveValue updates together.
 * All updates inside the callback will be batched and flushed together.
 *
 * **Note on Framework Integration:**
 * Most modern frameworks (React 18+, SolidJS, Svelte) have their own batching
 * mechanisms and optimizations. In these contexts, `batched()` may have
 * limited impact:
 *
 * - **React 18+**: Automatically batches all state updates, so `batched()` is
 *   often unnecessary (React handles batching internally).
 *
 * - **SolidJS**: Uses fine-grained reactivity where each change triggers an
 *   update (this is by design for optimal performance). `batched()` doesn't
 *   change this behavior.
 *
 * - **Svelte**: Has its own reactivity system that handles updates efficiently.
 *
 * **When to use `batched()`:**
 * - Vanilla JavaScript contexts where you're using ReactiveValues without
 *   a framework
 * - Custom reactive systems that don't have built-in batching
 * - Testing scenarios where you need to control notification timing
 * - Libraries that provide reactive primitives for framework-agnostic use
 *
 * Supports synchronous functions:
 * ```typescript
 * batched(() => {
 *   count1.set(11);
 *   count2.set(21);
 *   count3.set(31);
 * });
 * // All notifications are sent together after the callback
 * ```
 *
 * Supports async functions:
 * ```typescript
 * await batched(async () => {
 *   count1.set(11);
 *   await someAsyncOperation();
 *   count2.set(21);
 * });
 * // All notifications are sent together after the async callback completes
 * ```
 */
export function batched<T>(fn: () => T): T;
export function batched<T>(fn: () => Promise<T>): Promise<T>;
export function batched<T>(fn: () => T | Promise<T>): T | Promise<T> {
  BatchContext.startBatch();
  try {
    const result = fn();
    // If it's a Promise, we need to handle it specially
    if (result instanceof Promise) {
      return result
        .then((value) => {
          BatchContext.endBatch();
          return value;
        })
        .catch((error) => {
          BatchContext.endBatch();
          throw error;
        }) as Promise<T>;
    }
    // Synchronous function
    BatchContext.endBatch();
    return result;
  } catch (error) {
    BatchContext.endBatch();
    throw error;
  }
}

/**
 * Batch multiple ReactiveValue updates using a generator.
 * Flushes notifications at every `yield` and at the end (`return`).
 *
 * Useful when you need multiple batches separated by async operations:
 * ```typescript
 * await batchedGenerator(async function*() {
 *   count1.set(11);
 *   count2.set(21);
 *   yield; // Flush here (count1, count2)
 *
 *   await someAsyncOperation();
 *
 *   count3.set(31);
 *   count4.set(41);
 *   // Return → flush finale (count3, count4)
 * });
 * ```
 *
 * Supports synchronous generators:
 * ```typescript
 * batchedGenerator(function*() {
 *   count1.set(11);
 *   yield; // Flush
 *   count2.set(21);
 *   // Return → flush finale
 * });
 * ```
 */
export function batchedGenerator<T>(fn: () => Generator<void, T, unknown>): T;
export function batchedGenerator<T>(
  fn: () => AsyncGenerator<void, T, unknown>,
): Promise<T>;
export function batchedGenerator<T>(
  fn: () => Generator<void, T, unknown> | AsyncGenerator<void, T, unknown>,
): T | Promise<T> {
  const generator = fn();
  const isAsync = Symbol.asyncIterator in generator;

  if (isAsync) {
    return batchedAsyncGenerator(generator as AsyncGenerator<void, T, unknown>);
  } else {
    return batchedSyncGenerator(generator as Generator<void, T, unknown>);
  }
}

/**
 * Internal helper for synchronous generators
 */
function batchedSyncGenerator<T>(generator: Generator<void, T, unknown>): T {
  BatchContext.startBatch();
  let result: IteratorResult<void, T>;

  try {
    do {
      result = generator.next();

      // Flush at every yield
      if (result.done === false) {
        BatchContext.endBatch();
        BatchContext.startBatch(); // Start new batch for next iteration
      }
    } while (!result.done);

    // Flush final batch at return
    BatchContext.endBatch();

    return result.value;
  } catch (error) {
    BatchContext.endBatch();
    throw error;
  }
}

/**
 * Internal helper for async generators
 */
async function batchedAsyncGenerator<T>(
  generator: AsyncGenerator<void, T, unknown>,
): Promise<T> {
  BatchContext.startBatch();
  let result: IteratorResult<void, T>;

  try {
    do {
      result = await generator.next();

      // Flush at every yield
      if (result.done === false) {
        BatchContext.endBatch();
        BatchContext.startBatch(); // Start new batch for next iteration
      }
    } while (!result.done);

    // Flush final batch at return
    BatchContext.endBatch();

    return result.value;
  } catch (error) {
    BatchContext.endBatch();
    throw error;
  }
}
