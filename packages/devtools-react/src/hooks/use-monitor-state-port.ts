"use client";

import { useEffect } from "react";
import { monitor } from "../monitors/monitor";
import type { StatePort } from "@xndrjs/core";
import type { ComputedValue } from "@xndrjs/core";
import type { ReactiveValue } from "@xndrjs/core";
import type { MonitorReactiveValueOptions } from "../monitors/reactive-value-monitor";
import type { MonitorComputedValueOptions } from "../monitors/computed-value-monitor";

type MonitorStatePortOptions =
  | MonitorReactiveValueOptions
  | MonitorComputedValueOptions;

/**
 * Type guard to check if a StatePort is a ComputedValue
 */
function isComputedValue<T>(value: StatePort<T>): value is ComputedValue<T> {
  return (
    value &&
    typeof value === "object" &&
    "dependencies" in value &&
    Array.isArray((value as ComputedValue<T>).dependencies)
  );
}

/**
 * Type guard to check if a StatePort is a ReactiveValue (or AbstractReactiveValue)
 */
function isReactiveValue<T>(value: StatePort<T>): value is ReactiveValue<T> {
  return (
    value &&
    typeof value === "object" &&
    "_subscribers" in value &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value as any)._subscribers instanceof Set
  );
}

/**
 * Generic hook to monitor a StatePort, automatically detecting its type.
 * Supports ComputedValue and ReactiveValue (and subclasses).
 *
 * @example
 * ```tsx
 * useMonitorStatePort(todoListManager.canUndo, { name: "canUndo" });
 * useMonitorStatePort(todoListManager.todos, { name: "todos" });
 * ```
 */
export function useMonitorStatePort<T>(
  value: StatePort<T> | null | undefined,
  options: MonitorStatePortOptions,
) {
  const metadataKey = options.metadata
    ? JSON.stringify(options.metadata)
    : undefined;

  useEffect(() => {
    if (!value) return;

    // Check if it's a ComputedValue first
    if (isComputedValue(value)) {
      monitor.computedValue.track(value, options);
      return () => {
        monitor.computedValue.untrack(value);
      };
    }

    // Check if it's a ReactiveValue (or AbstractReactiveValue subclass)
    if (isReactiveValue(value)) {
      monitor.reactiveValue.track(value, options);
      return () => {
        monitor.reactiveValue.untrack(value);
      };
    }

    // If we can't determine the type, log a warning but don't crash
    console.warn(
      `[DevTools] Cannot monitor StatePort "${options.name}": unknown type. ` +
        `Only ComputedValue and ReactiveValue are supported.`,
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.name, metadataKey]);
}
