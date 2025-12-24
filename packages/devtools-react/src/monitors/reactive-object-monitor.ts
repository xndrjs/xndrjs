/**
 * ReactiveObject Monitor
 * Tracks ReactiveObject instances and updates
 *
 * @example
 * ```ts
 * const obj = new ReactiveObject({ count: 0 });
 * monitorReactiveObject(obj, {
 *   name: "MyObject",
 *   metadata: { version: "1.0" }
 * });
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ReactiveObject } from "@xndrjs/core";
import { getDevToolsHook } from "../core/hook";
import type { SerializableMetadata } from "../core/types";
import { InstanceType, DevToolsEventType } from "../core/types";
import type { InstanceId, ReactiveObjectUpdateEvent } from "../core/types";

interface MonitoredReactiveObject {
  instanceId: InstanceId;
  unsubscribe: (() => void) | null;
}

const monitoredInstances = new WeakMap<
  ReactiveObject<any>,
  MonitoredReactiveObject
>();

/**
 * Options for monitoring a ReactiveObject instance
 */
export interface MonitorReactiveObjectOptions {
  /** Instance name (required) */
  name: string;
  /** Optional metadata (must be JSON-serializable - no functions, classes, bigint, symbol, etc.) */
  metadata?: SerializableMetadata;
}

/**
 * Monitor a ReactiveObject instance
 */
export function monitorReactiveObject<T extends object | null>(
  object: ReactiveObject<T>,
  options: MonitorReactiveObjectOptions,
): InstanceId {
  const hook = getDevToolsHook();

  if (!hook.isEnabled()) {
    return "";
  }

  // Check if already monitored
  if (monitoredInstances.has(object)) {
    return monitoredInstances.get(object)!.instanceId;
  }

  // Register instance
  const instanceId = hook.registerInstance(
    InstanceType.REACTIVE_OBJECT,
    object,
    options.name,
    options.metadata,
  );

  // Save original set method
  const originalSet = object.set.bind(object);

  // Patch set method to track changes (only when callback is used)
  object.set = function (newValueOrProducer: any) {
    const prevValue = this.get();
    originalSet(newValueOrProducer);
    const newValue = this.get();

    // Only track if it was a callback (update-like operation)
    if (typeof newValueOrProducer !== "function") {
      return; // Direct value set, no special tracking needed
    }

    // Calculate changed keys by comparing prev and new values
    const changedKeys = getChangedKeys(prevValue, newValue);

    // Emit update event
    hook.emit({
      type: DevToolsEventType.REACTIVE_OBJECT_UPDATE,
      instanceId,
      timestamp: Date.now(),
      data: {
        changedKeys,
        snapshot: getSnapshot(this),
      } as ReactiveObjectUpdateEvent,
    });

    // Emit property change events for each changed key
    if (
      prevValue !== null &&
      newValue !== null &&
      typeof prevValue === "object" &&
      typeof newValue === "object"
    ) {
      for (const key of changedKeys) {
        hook.emit({
          type: DevToolsEventType.REACTIVE_OBJECT_PROPERTY_CHANGE,
          instanceId,
          timestamp: Date.now(),
          data: {
            propertyName: key,
            oldValue: serializeValue((prevValue as any)[key]),
            newValue: serializeValue((newValue as any)[key]),
          },
        });
      }
    }
  };

  // Subscribe to value changes (for tracking via ReactiveValue interface)
  let lastValue = object.get();
  const unsubscribe = object.subscribe((newValue) => {
    // Skip if unchanged
    if (Object.is(lastValue, newValue)) {
      return;
    }
    lastValue = newValue;

    hook.emit({
      type: DevToolsEventType.REACTIVE_OBJECT_UPDATE,
      instanceId,
      timestamp: Date.now(),
      data: {
        snapshot: getSnapshot(object),
      } as ReactiveObjectUpdateEvent,
    });
  });

  const monitored: MonitoredReactiveObject = {
    instanceId,
    unsubscribe,
  };

  monitoredInstances.set(object, monitored);

  return instanceId;
}

/**
 * Unmonitor a ReactiveObject instance
 */
export function unmonitorReactiveObject<T extends object | null>(
  object: ReactiveObject<T>,
): void {
  const monitored = monitoredInstances.get(object);
  if (!monitored) {
    return;
  }

  // Note: We can't easily restore the original update method
  // because we don't store it. In practice, unmonitoring is rare.
  // If needed, we could store it in the monitored object.

  // Unsubscribe from value changes
  if (monitored.unsubscribe) {
    monitored.unsubscribe();
  }

  const hook = getDevToolsHook();
  hook.unregisterInstance(monitored.instanceId);

  monitoredInstances.delete(object);
}

/**
 * Check if a ReactiveObject is monitored
 */
export function isReactiveObjectMonitored<T extends object | null>(
  object: ReactiveObject<T>,
): boolean {
  return monitoredInstances.has(object);
}

/**
 * Get the instance ID of a monitored ReactiveObject
 */
export function getReactiveObjectInstanceId<T extends object | null>(
  object: ReactiveObject<T>,
): InstanceId | undefined {
  return monitoredInstances.get(object)?.instanceId;
}

/**
 * Get changed keys between two object values
 */
function getChangedKeys(prevValue: any, newValue: any): string[] {
  if (prevValue === null || newValue === null) {
    return [];
  }

  if (typeof prevValue !== "object" || typeof newValue !== "object") {
    return [];
  }

  const changedKeys: string[] = [];
  const allKeys = new Set([
    ...Object.keys(prevValue),
    ...Object.keys(newValue),
  ]);

  for (const key of allKeys) {
    if (!Object.is(prevValue[key], newValue[key])) {
      changedKeys.push(key);
    }
  }

  return changedKeys;
}

/**
 * Get a snapshot of the ReactiveObject's current state
 */
function getSnapshot<T extends object | null>(object: ReactiveObject<T>): any {
  try {
    return {
      value: serializeValue(object.get()),
      hasScope: (object as any)._scope !== null,
    };
  } catch (_error) {
    return { error: "Failed to create snapshot" };
  }
}

/**
 * Serialize a value for storage/transmission
 */
function serializeValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "function") {
    return "[Function]";
  }

  if (value instanceof Date) {
    return { __type: "Date", value: value.toISOString() };
  }

  if (value instanceof Set) {
    return { __type: "Set", value: Array.from(value) };
  }

  if (value instanceof Map) {
    return { __type: "Map", value: Array.from(value.entries()) };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (typeof value === "object") {
    // Check for circular references
    try {
      JSON.stringify(value);
      return value;
    } catch {
      return "[Circular]";
    }
  }

  return value;
}
