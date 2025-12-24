/**
 * ReactiveValue Monitor
 * Tracks ReactiveValue instances, value changes, and subscriptions
 *
 * @example
 * ```ts
 * const count = new ReactiveValue(0);
 * monitorReactiveValue(count, {
 *   name: "Count",
 *   metadata: { version: "1.0" }
 * });
 * ```
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ReactiveValue } from "@xndrjs/core";
import { getDevToolsHook } from "../core/hook";
import { InstanceType, DevToolsEventType } from "../core/types";
import type {
  InstanceId,
  ReactiveValueSubscriptionEvent,
  SerializableMetadata,
} from "../core/types";

interface MonitoredReactiveValue {
  instanceId: InstanceId;
  unsubscribe: (() => void) | null;
}

const monitoredInstances = new WeakMap<
  ReactiveValue<any>,
  MonitoredReactiveValue
>();

/**
 * Options for monitoring a ReactiveValue instance
 */
export interface MonitorReactiveValueOptions {
  /** Instance name (required) */
  name: string;
  /** Optional metadata (must be JSON-serializable - no functions, classes, bigint, symbol, etc.) */
  metadata?: SerializableMetadata;
}

/**
 * Monitor a ReactiveValue instance
 */
export function monitorReactiveValue<T>(
  value: ReactiveValue<T>,
  options: MonitorReactiveValueOptions,
): InstanceId {
  const hook = getDevToolsHook();

  if (!hook.isEnabled()) {
    return "";
  }

  // Check if already monitored
  if (monitoredInstances.has(value)) {
    return monitoredInstances.get(value)!.instanceId;
  }

  // Register instance
  const instanceId = hook.registerInstance(
    InstanceType.REACTIVE_VALUE,
    value,
    options.name,
    options.metadata,
  );

  // Subscribe to value changes
  // Note: This subscription is tracked and will be cleaned up on unmonitor
  let lastValue = value.get();
  const unsubscribe = value.subscribe((newValue) => {
    const prevValue = lastValue;
    lastValue = newValue;

    hook.emit({
      type: DevToolsEventType.REACTIVE_VALUE_CHANGE,
      instanceId,
      timestamp: Date.now(),
      data: {
        newValue: serializeValue(newValue),
        prevValue: serializeValue(prevValue),
        snapshot: getSnapshot(value),
      },
    });
  });

  const monitored: MonitoredReactiveValue = {
    instanceId,
    unsubscribe,
  };

  monitoredInstances.set(value, monitored);

  // Emit initial subscribe event with DevTools flag
  // Get subscriber count from internal _subscribers (if accessible)
  const subscriberCount = (value as any)._subscribers?.size;
  hook.emit({
    type: DevToolsEventType.REACTIVE_VALUE_SUBSCRIBE,
    instanceId,
    timestamp: Date.now(),
    data: {
      subscriberCount,
      isDevToolsSubscription: true, // Mark as DevTools subscription
    } as ReactiveValueSubscriptionEvent,
  });

  return instanceId;
}

/**
 * Unmonitor a ReactiveValue instance
 */
export function unmonitorReactiveValue<T>(value: ReactiveValue<T>): void {
  const monitored = monitoredInstances.get(value);
  if (!monitored) {
    return;
  }

  const hook = getDevToolsHook();

  // Unsubscribe from value changes
  if (monitored.unsubscribe) {
    monitored.unsubscribe();
  }

  // Emit unsubscribe event with DevTools flag
  const subscriberCount = (value as any)._subscribers?.size;
  hook.emit({
    type: DevToolsEventType.REACTIVE_VALUE_UNSUBSCRIBE,
    instanceId: monitored.instanceId,
    timestamp: Date.now(),
    data: {
      subscriberCount,
      isDevToolsSubscription: true, // Mark as DevTools subscription
    } as ReactiveValueSubscriptionEvent,
  });

  // Unregister instance
  hook.unregisterInstance(monitored.instanceId);

  // Remove from map
  monitoredInstances.delete(value);
}

/**
 * Check if a ReactiveValue is monitored
 */
export function isReactiveValueMonitored<T>(value: ReactiveValue<T>): boolean {
  return monitoredInstances.has(value);
}

/**
 * Get the instance ID of a monitored ReactiveValue
 */
export function getReactiveValueInstanceId<T>(
  value: ReactiveValue<T>,
): InstanceId | undefined {
  return monitoredInstances.get(value)?.instanceId;
}

/**
 * Get a snapshot of the ReactiveValue's current state
 */
function getSnapshot<T>(value: ReactiveValue<T>): any {
  try {
    return {
      value: serializeValue(value.get()),
      hasScope: (value as any)._scope !== null,
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
