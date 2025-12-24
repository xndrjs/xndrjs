/**
 * FSM Monitor
 * Tracks Finite State Machine transitions
 * Updated for new reactive system
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { FSMContextManager } from "@xndrjs/fsm";
import { getDevToolsHook } from "../core/hook";
import type { SerializableMetadata } from "../core/types";
import { InstanceType, DevToolsEventType } from "../core/types";
import type { InstanceId, FSMEventData } from "../core/types";

interface MonitoredFSM {
  instanceId: InstanceId;
  originalTransitionTo: Function;
  currentState: string;
}

const monitoredFSMs = new WeakMap<any, MonitoredFSM>();

/**
 * Options for monitoring an FSM instance
 */
export interface MonitorFSMOptions {
  /** Instance name (required) */
  name: string;
  /** Optional metadata (must be JSON-serializable - no functions, classes, bigint, symbol, etc.) */
  metadata?: SerializableMetadata;
}

/**
 * Monitor an FSM Context Manager instance
 */
export function monitorFSM(
  instance: FSMContextManager<any>,
  options: MonitorFSMOptions,
): InstanceId {
  const hook = getDevToolsHook();

  if (!hook.isEnabled()) {
    return "";
  }

  // Check if already monitored
  if (monitoredFSMs.has(instance)) {
    return monitoredFSMs.get(instance)!.instanceId;
  }

  // Register instance
  const instanceId = hook.registerInstance(
    InstanceType.FSM_CONTEXT_MANAGER,
    instance,
    options.name,
    options.metadata,
  );

  // Get current state
  const currentState = getStateName(instance.currentState.get());

  // Save original method
  const originalTransitionTo = instance.transitionTo.bind(instance);

  const monitored: MonitoredFSM = {
    instanceId,
    originalTransitionTo,
    currentState,
  };

  monitoredFSMs.set(instance, monitored);

  // Emit initial state event
  hook.emit({
    type: DevToolsEventType.FSM_STATE_ENTER,
    instanceId,
    timestamp: Date.now(),
    data: {
      toState: currentState,
    } as FSMEventData,
  });

  // Patch transitionTo method
  instance.transitionTo = function (this: any, state: any) {
    const fromState = monitored.currentState;
    const toState = getStateName(state);

    // Perform transition
    const result = originalTransitionTo(state);

    // Update current state
    monitored.currentState = toState;

    // Emit transition event
    hook.emit({
      type: DevToolsEventType.FSM_TRANSITION,
      instanceId,
      timestamp: Date.now(),
      data: {
        fromState,
        toState,
      } as FSMEventData,
    });

    // Emit state enter event
    hook.emit({
      type: DevToolsEventType.FSM_STATE_ENTER,
      instanceId,
      timestamp: Date.now(),
      data: {
        toState,
      } as FSMEventData,
    });

    return result;
  };

  return instanceId;
}

/**
 * Unmonitor an FSM instance
 */
export function unmonitorFSM(instance: FSMContextManager<any>): void {
  const monitored = monitoredFSMs.get(instance);
  if (!monitored) return;

  instance.transitionTo = monitored.originalTransitionTo as any;

  getDevToolsHook().unregisterInstance(monitored.instanceId);
  monitoredFSMs.delete(instance);
}

/**
 * Get the name of a state
 */
function getStateName(state: any): string {
  if (typeof state === "string") {
    return state;
  }

  if (state && state.constructor) {
    return state.constructor.name;
  }

  if (state && state.name) {
    return state.name;
  }

  return "Unknown";
}

/**
 * Get FSM transition history for an instance
 */
export interface FSMTransition {
  fromState: string;
  toState: string;
  trigger?: string;
  timestamp: number;
}

const transitionHistories = new Map<InstanceId, FSMTransition[]>();

export function getFSMHistory(instanceId: InstanceId): FSMTransition[] {
  return transitionHistories.get(instanceId) || [];
}

/**
 * Get current state of a monitored FSM
 */
export function getCurrentState(instanceId: InstanceId): string | undefined {
  const hook = getDevToolsHook();
  const tracked = hook.getInstance(instanceId);

  if (!tracked) {
    return undefined;
  }

  const monitored = monitoredFSMs.get(tracked.instance);
  return monitored?.currentState;
}

/**
 * Initialize FSM history tracking
 * Prevents duplicate initialization to avoid duplicate listeners
 */
let isHistoryTrackingInitialized = false;

export function initFSMHistoryTracking(): void {
  // Prevent duplicate initialization (e.g., in React StrictMode)
  if (isHistoryTrackingInitialized) {
    return;
  }
  isHistoryTrackingInitialized = true;

  const hook = getDevToolsHook();

  hook.on(DevToolsEventType.FSM_TRANSITION, (event) => {
    const data = event.data as FSMEventData;

    if (!transitionHistories.has(event.instanceId)) {
      transitionHistories.set(event.instanceId, []);
    }

    const history = transitionHistories.get(event.instanceId)!;

    history.push({
      fromState: data.fromState || "Unknown",
      toState: data.toState,
      trigger: data.trigger,
      timestamp: event.timestamp,
    });

    // Limit history size to 100 transitions
    if (history.length > 100) {
      history.shift();
    }
  });
}

/**
 * Get FSM statistics
 */
export interface FSMStats {
  totalTransitions: number;
  uniqueStates: number;
  averageTransitionsPerMinute: number;
}

export function getFSMStats(instanceId: InstanceId): FSMStats {
  const history = getFSMHistory(instanceId);
  const states = new Set<string>();

  // Include current state to account for initial state (even when no transitions yet)
  const currentState = getCurrentState(instanceId);
  if (currentState) {
    states.add(currentState);
  }

  // Add states from transitions
  for (const transition of history) {
    states.add(transition.fromState);
    states.add(transition.toState);
  }

  if (history.length === 0) {
    return {
      totalTransitions: 0,
      uniqueStates: states.size, // Will be 1 if currentState exists (initial state)
      averageTransitionsPerMinute: 0,
    };
  }

  // Calculate average transitions per minute
  const firstTimestamp = history[0]!.timestamp;
  const lastTimestamp = history[history.length - 1]!.timestamp;
  const durationMinutes = (lastTimestamp - firstTimestamp) / 60000;
  const averageTransitionsPerMinute =
    durationMinutes > 0 ? history.length / durationMinutes : 0;

  return {
    totalTransitions: history.length,
    uniqueStates: states.size,
    averageTransitionsPerMinute,
  };
}
