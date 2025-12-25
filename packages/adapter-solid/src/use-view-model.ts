import { onCleanup } from "solid-js";
import type { ViewModel } from "@xndrjs/core";

/**
 * Hook that creates and manages a ViewModel instance with automatic cleanup.
 * The ViewModel is created once and automatically disposed when the component is cleaned up.
 *
 * @param factory - Function that creates the ViewModel instance (called only once)
 * @returns The ViewModel instance
 *
 * @example
 * ```tsx
 * import { useViewModel } from '@xndrjs/adapter-solid';
 * import { useReactiveValue } from '@xndrjs/adapter-solid';
 *
 * class CounterVM extends ViewModel {
 *   count = new ReactiveValue(0);
 *   doubled = createComputed(this.count)
 *     .as((c) => c * 2)
 *     .for(this);
 *
 *   increment() {
 *     this.count.set((prev) => prev + 1);
 *   }
 * }
 *
 * function Counter() {
 *   const vm = useViewModel(() => new CounterVM());
 *   const count = useReactiveValue(() => vm.count);
 *   const doubled = useReactiveValue(() => vm.doubled);
 *
 *   return (
 *     <div>
 *       <div>Count: {count()}</div>
 *       <div>Doubled: {doubled()}</div>
 *       <button onClick={() => vm.increment()}>+</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewModel<T extends ViewModel>(factory: () => T): T {
  const vm = factory();

  onCleanup(() => {
    vm[Symbol.dispose]();
  });

  return vm;
}
