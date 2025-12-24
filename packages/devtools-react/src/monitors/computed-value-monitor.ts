/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComputedValue } from "@xndrjs/core";
import { getDevToolsHook } from "../core/hook";
import { getDevToolsStore } from "../core/store";
import {
  InstanceType,
  DevToolsEventType,
  type InstanceId,
  type SerializableMetadata,
} from "../core/types";
import { extractDependencies } from "./dependency-tracker";

interface MonitoredComputedValue {
  instanceId: InstanceId;
  unsubscribe: (() => void) | null;
}

const monitoredComputedValues = new WeakMap<
  ComputedValue<any>,
  MonitoredComputedValue
>();

export interface MonitorComputedValueOptions {
  name: string;
  metadata?: SerializableMetadata;
}

/**
 * Monitor a ComputedValue instance.
 * Registers the instance, tracks its dependencies, and emits recompute events.
 */
export function monitorComputedValue<T>(
  value: ComputedValue<T>,
  options: MonitorComputedValueOptions,
): InstanceId {
  const hook = getDevToolsHook();

  if (!hook.isEnabled()) {
    return "";
  }

  const existing = monitoredComputedValues.get(value);
  if (existing) {
    return existing.instanceId;
  }

  const instanceId = hook.registerInstance(
    InstanceType.COMPUTED_VALUE,
    value,
    options.name,
    options.metadata,
  );

  // Track dependencies in the store
  const store = getDevToolsStore();
  const dependencies = extractDependencies(value, instanceId);
  dependencies.forEach((dep) => store.addDependency(dep));

  // Subscribe to recomputations (if supported)
  const unsubscribe =
    typeof value.subscribe === "function"
      ? value.subscribe(() => {
          hook.emit({
            type: DevToolsEventType.COMPUTED_VALUE_RECOMPUTE,
            instanceId,
            timestamp: Date.now(),
            data: {
              dependencies: value.dependencies?.map((dep) =>
                hook.findInstanceId(dep),
              ),
              memoHit: false,
            },
          });
        })
      : null;

  monitoredComputedValues.set(value, { instanceId, unsubscribe });
  return instanceId;
}

/**
 * Stop monitoring a ComputedValue instance.
 */
export function unmonitorComputedValue<T>(value: ComputedValue<T>): void {
  const monitored = monitoredComputedValues.get(value);
  if (!monitored) {
    return;
  }

  const store = getDevToolsStore();
  // Remove dependencies targeting this instance
  store
    .getDependencies()
    .filter((dep) => dep.targetInstanceId === monitored.instanceId)
    .forEach((dep) => store.removeDependency(dep));

  // Unsubscribe from recompute events
  monitored.unsubscribe?.();

  // Unregister instance
  const hook = getDevToolsHook();
  hook.unregisterInstance(monitored.instanceId);

  monitoredComputedValues.delete(value);
}

/**
 * Check if a ComputedValue is monitored.
 */
export function isComputedValueMonitored<T>(value: ComputedValue<T>): boolean {
  return monitoredComputedValues.has(value);
}

/**
 * Get the instance ID of a monitored ComputedValue.
 */
export function getComputedValueInstanceId<T>(
  value: ComputedValue<T>,
): InstanceId | undefined {
  return monitoredComputedValues.get(value)?.instanceId;
}
