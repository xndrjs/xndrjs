import type { StatePort, ComputedValue } from "@xndrjs/core";
import { writable, type Writable } from "svelte/store";

/**
 * Type guard to check if a port is a ComputedValue
 */
function isComputedValue<T>(port: StatePort<T>): port is ComputedValue<T> {
  return "dependencies" in port && Array.isArray(port.dependencies);
}

/**
 * Creates a store from a StatePort.
 */
function createStoreFromPort<T>(port: StatePort<T>): Writable<T> {
  const store = writable<T>(port.get());

  // Handle ComputedValue with dependency tracking
  if (isComputedValue(port)) {
    const dependencies = port.dependencies;
    const unsubscribers: (() => void)[] = [];

    function updateValue() {
      const newValue = port.get();
      store.set(newValue);
    }

    // Subscribe to all dependencies
    for (const dep of dependencies) {
      if (dep.subscribe) {
        const unsubscribe = dep.subscribe(updateValue);
        unsubscribers.push(unsubscribe);
      }
    }

    // Initial sync
    updateValue();

    // Return a custom store that cleans up subscriptions
    return {
      subscribe: store.subscribe,
      set: (value: T) => {
        if ("set" in port && typeof port.set === "function") {
          port.set(value);
        } else {
          store.set(value);
        }
      },
      update: (updater: (value: T) => T) => {
        const currentValue = port.get();
        const newValue = updater(currentValue);
        if ("set" in port && typeof port.set === "function") {
          port.set(newValue);
        } else {
          store.set(newValue);
        }
      },
    };
  }

  // Handle regular StatePort
  if (port.subscribe) {
    port.subscribe((value) => {
      store.set(value);
    });

    // Initial sync
    store.set(port.get());

    return {
      subscribe: store.subscribe,
      set: (value: T) => {
        if ("set" in port && typeof port.set === "function") {
          port.set(value);
        } else {
          store.set(value);
        }
      },
      update: (updater: (value: T) => T) => {
        const currentValue = port.get();
        const newValue = updater(currentValue);
        if ("set" in port && typeof port.set === "function") {
          port.set(newValue);
        } else {
          store.set(newValue);
        }
      },
    };
  }

  // If no subscribe capability, return a simple writable that reads from port
  return {
    subscribe: store.subscribe,
    set: (value: T) => {
      if ("set" in port && typeof port.set === "function") {
        port.set(value);
      } else {
        store.set(value);
      }
    },
    update: (updater: (value: T) => T) => {
      const currentValue = port.get();
      const newValue = updater(currentValue);
      if ("set" in port && typeof port.set === "function") {
        port.set(newValue);
      } else {
        store.set(newValue);
      }
    },
  };
}

/**
 * Converts a Svelte reactive value ($state) into a StatePort.
 * This allows using Svelte runes with APIs that expect StatePort.
 *
 * @param getState - A function that returns the reactive state value
 * @param setState - A function that sets the reactive state value
 * @returns A StatePort that wraps the Svelte reactive value
 *
 * @example
 * ```html
 * <script>
 *   const text = $state("");
 *   const textPort = toStatePort(() => text, (v) => text = v);
 *   // Now textPort can be used with APIs that expect StatePort
 * </script>
 * ```
 */
export function toStatePort<T>(
  getState: () => T,
  setState: (value: T) => void,
): StatePort<T> {
  const subscribers = new Set<(value: T) => void>();
  let previousValue = getState();

  // Track changes using $effect - this will re-run when getState() changes
  $effect(() => {
    const currentValue = getState();
    if (currentValue !== previousValue) {
      previousValue = currentValue;
      subscribers.forEach((callback) => callback(currentValue));
    }
  });

  return {
    get() {
      return getState();
    },
    set(value: T | ((prev: T) => T)) {
      if (typeof value === "function") {
        const updater = value as (prev: T) => T;
        setState(updater(getState()));
      } else {
        setState(value);
      }
      // Update previousValue to avoid duplicate notifications
      previousValue = getState();
    },
    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);
      callback(getState());
      return () => {
        subscribers.delete(callback);
      };
    },
  };
}

/**
 * Subscribe to a StatePort/ComputedValue and expose it as a Svelte store.
 * Returns a Writable store that stays in sync with the StatePort.
 *
 * Requires a function that returns the port. This ensures reactive tracking
 * of props and eliminates the need for `$derived` and resolves the
 * "state_referenced_locally" warning.
 *
 * For ComputedValue, subscribes to all dependencies to track changes.
 * For regular StatePort, subscribes directly to the port.
 *
 * @param getPort - A function that returns the StatePort/ComputedValue
 * @returns A Svelte Writable store that stays in sync with the port
 *
 * @example
 * ```html
 * <script>
 *   import { reactiveValue } from "@xndrjs/adapter-svelte";
 *   import { ReactiveValue } from "@xndrjs/core";
 *
 *   // For static ports
 *   const count = new ReactiveValue(1);
 *   const countStore = reactiveValue(() => count);
 *
 *   // For reactive props (no $derived needed!)
 *   let { todoListService } = $props();
 *   const todosStore = reactiveValue(() => todoListService.todos);
 * </script>
 *
 * <div>{$countStore}</div>
 * <div>{$todosStore}</div>
 * ```
 */
export function reactiveValue<T>(getPort: () => StatePort<T>): Writable<T> {
  const port = getPort();
  return createStoreFromPort(port);
}
