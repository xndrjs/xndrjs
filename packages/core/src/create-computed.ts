/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Disposable } from "./disposable";
import type { StatePort } from "./state-port";
import type { ComputedValue } from "./computed-value";
import { SubscriptionsRegistry } from "./subscriptions-registry";

interface ComputedComputeBuilder<Ds extends readonly StatePort<any>[]> {
  as<T>(
    compute: (...values: { [K in keyof Ds]: ReturnType<Ds[K]["get"]> }) => T,
  ): ComputedOwnerBuilder<T>;
}

interface ComputedOwnerBuilder<T> {
  for(owner: Disposable): ComputedValue<T>;
}

interface MemoCache<T> {
  value: T;
  depValues: unknown[];
}

/**
 * Creates a computed value with pattern builder.
 * The computed value is automatically registered in SubscriptionsRegistry
 * for cleanup when the owner is disposed.
 * The type is automatically inferred from the return type of the compute function.
 *
 * @param dependencies - The StatePort dependencies to compute from
 * @returns Builder for chaining: `.as(compute).for(owner)`
 *
 * @example
 * ```typescript
 * class MyClass extends ViewModel {
 *   private _count = new ReactiveValue(10);
 *   private _doubled = createComputed(this._count)
 *     .as((count) => count * 2) // Type is inferred as number
 *     .for(this);
 * }
 * ```
 */
export function createComputed<Ds extends readonly StatePort<any>[]>(
  ...dependencies: Ds
): ComputedComputeBuilder<Ds> {
  return {
    as<T>(
      compute: (...values: { [K in keyof Ds]: ReturnType<Ds[K]["get"]> }) => T,
    ): ComputedOwnerBuilder<T> {
      return {
        for(owner: Disposable): ComputedValue<T> {
          // Default: memoized
          let memoCache: MemoCache<T> | null = null;

          const evalDeps = (): T => {
            const currentDepValues = dependencies.map((d) => d.get());

            if (memoCache) {
              // Check if dependencies have changed (using Object.is for comparison)
              const depsChanged = memoCache.depValues.some(
                (cached, i) => !Object.is(cached, currentDepValues[i]),
              );
              if (!depsChanged) {
                return memoCache.value; // Return cached value
              }
            }

            // Recompute value
            const newValue = compute(
              ...(currentDepValues as {
                [K in keyof Ds]: ReturnType<Ds[K]["get"]>;
              }),
            );

            // Update cache
            memoCache = { value: newValue, depValues: currentDepValues };

            return newValue;
          };

          const computed: ComputedValue<T> = {
            get: evalDeps,
            set: () => {
              throw new Error("Computed values are read-only");
            },
            subscribe: (callback) => {
              const unsubs: Array<() => void> = [];

              // For each subscriber, maintain a flag to track pending notifications
              let hasPendingNotification = false;

              const notify = () => {
                // If there's already a scheduled notification, do nothing
                // The already scheduled microtask will notify with the latest value
                if (hasPendingNotification) {
                  return;
                }

                // Schedule the notification for the next microtask
                hasPendingNotification = true;
                queueMicrotask(() => {
                  hasPendingNotification = false;
                  const newValue = evalDeps(); // Uses memoization if enabled
                  callback(newValue);
                });
              };

              for (const dep of dependencies) {
                if (dep.subscribe) {
                  unsubs.push(dep.subscribe(notify));
                }
              }

              const unsubscribe = () => {
                // Cancel any pending notifications when unsubscribing
                hasPendingNotification = false;
                unsubs.forEach((unsub) => unsub());
              };

              return unsubscribe;
            },
            dependencies,
          };

          // Register subscription in registry for cleanup
          // Subscribe to all dependencies and register the combined unsubscribe
          const unsubs: Array<() => void> = [];
          const notify = () => {
            evalDeps(); // Just to trigger evaluation, but we don't need to notify anyone here
          };
          for (const dep of dependencies) {
            if (dep.subscribe) {
              unsubs.push(dep.subscribe(notify));
            }
          }
          const combinedUnsubscribe = () => {
            unsubs.forEach((unsub) => unsub());
          };
          SubscriptionsRegistry.register(owner, combinedUnsubscribe);

          return computed;
        },
      };
    },
  };
}
