import { createEffect, createSignal, onCleanup } from "solid-js";
import type { StatePort } from "@xndrjs/core";

/**
 * Subscribe to a StatePort/ComputedValue and expose it as a Solid signal accessor.
 * The accessor always returns the latest value and triggers Solid reactivity.
 */
export function useReactiveValue<T>(port: StatePort<T>): () => T {
  const [value, setValue] = createSignal<T>(port.get());

  createEffect(() => {
    const currentPort = port;

    // If no subscription capability, keep value in sync once
    if (!currentPort.subscribe) {
      setValue(() => currentPort.get());
      return;
    }

    // For computed values, rely on their subscribe implementation (wired to deps)
    const unsubscribe = currentPort.subscribe((next) => {
      setValue(() => next);
    });

    // Ensure initial sync in case subscribe doesn't push immediately
    setValue(() => currentPort.get());

    onCleanup(() => {
      unsubscribe?.();
    });
  });

  return value;
}
