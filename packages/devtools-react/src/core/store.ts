/**
 * DevTools Store
 * Central state management for DevTools data
 * Updated to use events instead of setInterval
 */

import { getDevToolsHook } from "./hook";
import type {
  DevToolsState,
  DevToolsConfig,
  TimelineEntry,
  Dependency,
  DevToolsEvent,
  ReactiveValueSubscriptionEvent,
  ReactiveObjectUpdateEvent,
  ComputedValueRecomputeEvent,
  BatchEvent,
} from "./types";

import { DevToolsEventType } from "./types";

/**
 * Central store for DevTools data
 */
export class DevToolsStore {
  private static instance: DevToolsStore | null = null;
  private state: DevToolsState;
  private listeners: Set<(state: DevToolsState) => void> = new Set();
  private unsubscribeFromHook: (() => void) | null = null;

  private constructor() {
    this.state = {
      instances: new Map(),
      timeline: [],
      dependencies: [],
      config: {
        enabled: true,
        maxTimelineEntries: 1000,
        maxHistoryPerInstance: 100,
        captureSnapshots: true,
        logToConsole: false,
      },
    };

    this.setupEventListeners();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): DevToolsStore {
    if (!DevToolsStore.instance) {
      DevToolsStore.instance = new DevToolsStore();
    }
    return DevToolsStore.instance;
  }

  /**
   * Get current state
   */
  getState(): DevToolsState {
    return this.state;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: DevToolsState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DevToolsConfig>): void {
    this.state.config = { ...this.state.config, ...config };
    this.notify();
  }

  /**
   * Get timeline entries
   */
  getTimeline(): TimelineEntry[] {
    return this.state.timeline;
  }

  /**
   * Get timeline entries for a specific instance
   */
  getTimelineForInstance(instanceId: string): TimelineEntry[] {
    return this.state.timeline.filter(
      (entry) => entry.instanceId === instanceId,
    );
  }

  /**
   * Clear timeline
   */
  clearTimeline(): void {
    this.state.timeline = [];
    this.notify();
  }

  /**
   * Get dependencies
   */
  getDependencies(): Dependency[] {
    return this.state.dependencies;
  }

  /**
   * Add a dependency
   */
  addDependency(dependency: Dependency): void {
    // Avoid duplicates
    const exists = this.state.dependencies.some(
      (dep) =>
        dep.sourceInstanceId === dependency.sourceInstanceId &&
        dep.sourceKey === dependency.sourceKey &&
        dep.targetInstanceId === dependency.targetInstanceId &&
        dep.targetKey === dependency.targetKey &&
        dep.dependencyType === dependency.dependencyType,
    );

    if (!exists) {
      this.state.dependencies.push(dependency);
      this.notify();
    }
  }

  /**
   * Remove a dependency
   */
  removeDependency(dependency: Dependency): void {
    const index = this.state.dependencies.findIndex(
      (dep) =>
        dep.sourceInstanceId === dependency.sourceInstanceId &&
        dep.sourceKey === dependency.sourceKey &&
        dep.targetInstanceId === dependency.targetInstanceId &&
        dep.targetKey === dependency.targetKey &&
        dep.dependencyType === dependency.dependencyType,
    );

    if (index !== -1) {
      this.state.dependencies.splice(index, 1);
      this.notify();
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.state.timeline = [];
    this.state.dependencies = [];
    this.state.instances.clear();
    this.notify();
  }

  /**
   * Setup event listeners from the DevTools hook
   * Uses events instead of setInterval for better performance
   */
  private setupEventListeners(): void {
    const hook = getDevToolsHook();

    // Listen to all events
    this.unsubscribeFromHook = hook.on("*", (event: DevToolsEvent) => {
      this.handleEvent(event);
    });

    // Sync instances when they are created/destroyed
    hook.on(DevToolsEventType.INSTANCE_CREATED, () => {
      this.syncInstances();
    });

    hook.on(DevToolsEventType.INSTANCE_DESTROYED, () => {
      this.syncInstances();
    });

    // Initial sync
    this.syncInstances();
  }

  /**
   * Sync instances from the hook
   */
  private syncInstances(): void {
    const hook = getDevToolsHook();
    const instances = hook.getAllInstances();

    this.state.instances.clear();
    instances.forEach((inst) => {
      this.state.instances.set(inst.id, inst);
    });

    this.notify();
  }

  /**
   * Handle a DevTools event
   */
  private handleEvent(event: DevToolsEvent): void {
    const { config } = this.state;

    // Log to console if enabled
    if (config.logToConsole) {
      console.log("[DevTools]", event.type, event);
    }

    // Add to timeline
    this.addTimelineEntry(event);
  }

  /**
   * Add an entry to the timeline
   */
  private addTimelineEntry(event: DevToolsEvent): void {
    const hook = getDevToolsHook();
    // Try to get instance from hook first (always up-to-date), fallback to local state
    const instance =
      hook.getInstance(event.instanceId) ||
      this.state.instances.get(event.instanceId);

    const entry: TimelineEntry = {
      id: `${event.instanceId}_${event.timestamp}_${Math.random()}`,
      timestamp: event.timestamp,
      instanceId: event.instanceId,
      instanceName: instance?.name || "Unknown",
      eventType: event.type,
      description: this.getEventDescription(event),
      data: event.data,
    };

    this.state.timeline.unshift(entry); // Add to beginning

    // Trim timeline if too large
    if (this.state.timeline.length > this.state.config.maxTimelineEntries) {
      this.state.timeline = this.state.timeline.slice(
        0,
        this.state.config.maxTimelineEntries,
      );
    }

    this.notify();
  }

  /**
   * Get human-readable description for an event
   */
  private getEventDescription(event: DevToolsEvent): string {
    switch (event.type) {
      case DevToolsEventType.INSTANCE_CREATED:
        return `Instance created: ${event.data.name}`;

      case DevToolsEventType.INSTANCE_DESTROYED:
        return `Instance destroyed: ${event.data.name}`;

      case DevToolsEventType.REACTIVE_VALUE_CHANGE:
        return `Value changed`;

      case DevToolsEventType.REACTIVE_VALUE_SUBSCRIBE: {
        const data = event.data as ReactiveValueSubscriptionEvent;
        const label = data.isDevToolsSubscription
          ? "[DevTools] Subscribed"
          : "Subscribed";
        return data.subscriberCount !== undefined
          ? `${label} (${data.subscriberCount} total)`
          : label;
      }

      case DevToolsEventType.REACTIVE_VALUE_UNSUBSCRIBE: {
        const data = event.data as ReactiveValueSubscriptionEvent;
        const label = data.isDevToolsSubscription
          ? "[DevTools] Unsubscribed"
          : "Unsubscribed";
        return data.subscriberCount !== undefined
          ? `${label} (${data.subscriberCount} total)`
          : label;
      }

      case DevToolsEventType.REACTIVE_OBJECT_UPDATE: {
        const data = event.data as ReactiveObjectUpdateEvent;
        return data.changedKeys
          ? `Updated: ${data.changedKeys.join(", ")}`
          : "Updated";
      }

      case DevToolsEventType.COMPUTED_VALUE_RECOMPUTE: {
        const data = event.data as ComputedValueRecomputeEvent;
        return data.memoHit ? "Recomputed (memo hit)" : "Recomputed";
      }

      case DevToolsEventType.COMPUTED_VALUE_MEMO_HIT:
        return "Memo hit";

      case DevToolsEventType.COMPUTED_VALUE_MEMO_MISS:
        return "Memo miss";

      case DevToolsEventType.BATCH_START:
        return "Batch started";

      case DevToolsEventType.BATCH_END: {
        const batchData = event.data as BatchEvent;
        return `Batch ended (${batchData.notificationCount || 0} notifications)`;
      }

      case DevToolsEventType.EVENT_PUBLISHED:
        return `Event: ${event.data.eventName}`;

      case DevToolsEventType.COMMAND_DISPATCHED:
        return `Command: ${event.data.commandName}`;

      case DevToolsEventType.QUERY_DISPATCHED:
        return `Query: ${event.data.queryName}`;

      case DevToolsEventType.MEMENTO_SAVE:
        return "Memento saved";

      case DevToolsEventType.MEMENTO_RESTORE:
        return "Memento restored";

      case DevToolsEventType.MEMENTO_UNDO:
        return "Undo";

      case DevToolsEventType.MEMENTO_REDO:
        return "Redo";

      case DevToolsEventType.FSM_TRANSITION:
        return `Transition: ${event.data.fromState} → ${event.data.toState}`;

      case DevToolsEventType.FSM_STATE_ENTER:
        return `State entered: ${event.data.toState}`;

      default:
        return event.type;
    }
  }

  /**
   * Notify all listeners
   */
  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error("[DevTools] Error in state listener:", error);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.unsubscribeFromHook) {
      this.unsubscribeFromHook();
      this.unsubscribeFromHook = null;
    }
    this.listeners.clear();
  }
}

/**
 * Get the DevTools store instance
 */
export function getDevToolsStore(): DevToolsStore {
  return DevToolsStore.getInstance();
}
