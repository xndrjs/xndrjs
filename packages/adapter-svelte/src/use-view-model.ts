import { onDestroy } from "svelte";
import type { ViewModel } from "@xndrjs/core";

/**
 * Hook that creates and manages a ViewModel instance with automatic cleanup.
 * The ViewModel is created once and automatically disposed when the component is destroyed.
 *
 * @param factory - Function that creates the ViewModel instance (called only once)
 * @returns The ViewModel instance
 *
 * @example
 * ```svelte
 * <script>
 *   import { useViewModel } from '@xndrjs/adapter-svelte';
 *   import { reactiveValue } from '@xndrjs/adapter-svelte';
 *
 *   class CounterVM extends ViewModel {
 *     count = new ReactiveValue(0);
 *     doubled = createComputed(this.count)
 *       .as((c) => c * 2)
 *       .for(this);
 *
 *     increment() {
 *       this.count.set((prev) => prev + 1);
 *     }
 *   }
 *
 *   const vm = useViewModel(() => new CounterVM());
 *   const count = reactiveValue(() => vm.count);
 *   const doubled = reactiveValue(() => vm.doubled);
 * </script>
 *
 * <div>
 *   <div>Count: {$count}</div>
 *   <div>Doubled: {$doubled}</div>
 *   <button on:click={() => vm.increment()}>+</button>
 * </div>
 * ```
 */
export function useViewModel<T extends ViewModel>(factory: () => T): T {
  const vm = factory();

  onDestroy(() => {
    vm[Symbol.dispose]();
  });

  return vm;
}
