/**
 * DevTools Global Hook
 * Provides instance registration and tracking capabilities
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SerializableMetadata } from "./types";
import { DevToolsEventEmitter } from "./event-emitter";
import { InstanceType, DevToolsEventType } from "./types";
import type { InstanceId, TrackedInstance, DevToolsEvent } from "./types";

/**
 * Global hook for DevTools
 * Installed on window object for external access
 */
export class DevToolsHook {
  private static instance: DevToolsHook | null = null;
  private instances: Map<InstanceId, TrackedInstance> = new Map();
  private eventEmitter: DevToolsEventEmitter = new DevToolsEventEmitter();
  private instanceCounter = 0;
  private enabled = true;

  private constructor() {}

  /**
   * Get or create the singleton instance
   */
  static getInstance(): DevToolsHook {
    if (!DevToolsHook.instance) {
      DevToolsHook.instance = new DevToolsHook();
    }
    return DevToolsHook.instance;
  }

  /**
   * Install the hook on the window object (if available)
   * This is optional - the hook works in-memory even without window.
   */
  static install(): DevToolsHook {
    const hook = DevToolsHook.getInstance();
    // Install on window if available (browser environment)
    if (typeof window !== "undefined") {
      (window as any).__USE_LESS_REACT_DEVTOOLS_HOOK__ = hook;
    }

    return hook;
  }

  /**
   * Check if DevTools hook is installed
   * Returns true if the singleton instance has been created.
   * Works both client-side and server-side.
   */
  static isInstalled(): boolean {
    // The hook is installed if the singleton instance exists
    // This works both client-side and server-side
    return DevToolsHook.instance !== null;
  }

  /**
   * Enable/disable DevTools
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if DevTools is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Register a new instance for tracking
   */
  registerInstance(
    type: InstanceType,
    instance: any,
    name?: string,
    metadata?: SerializableMetadata,
  ): InstanceId {
    if (!this.enabled) {
      return "";
    }

    const id = this.generateInstanceId(type);
    const trackedInstance: TrackedInstance = {
      id,
      type,
      name: name || `${type}_${this.instanceCounter}`,
      instance,
      createdAt: Date.now(),
      metadata,
    };

    this.instances.set(id, trackedInstance);

    // Emit instance created event
    this.emit({
      type: DevToolsEventType.INSTANCE_CREATED,
      instanceId: id,
      timestamp: Date.now(),
      data: { type, name: trackedInstance.name, metadata },
    });

    return id;
  }

  /**
   * Unregister an instance
   */
  unregisterInstance(id: InstanceId): void {
    if (!this.enabled) {
      return;
    }

    const instance = this.instances.get(id);
    if (instance) {
      this.instances.delete(id);

      // Emit instance destroyed event
      this.emit({
        type: DevToolsEventType.INSTANCE_DESTROYED,
        instanceId: id,
        timestamp: Date.now(),
        data: { type: instance.type, name: instance.name },
      });
    }
  }

  /**
   * Get a tracked instance by ID
   */
  getInstance(id: InstanceId): TrackedInstance | undefined {
    return this.instances.get(id);
  }

  /**
   * Get all tracked instances
   */
  getAllInstances(): TrackedInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instances by type
   */
  getInstancesByType(type: InstanceType): TrackedInstance[] {
    return this.getAllInstances().filter((inst) => inst.type === type);
  }

  /**
   * Find instance ID by reference
   */
  findInstanceId(instance: any): InstanceId | undefined {
    for (const [id, tracked] of this.instances.entries()) {
      if (tracked.instance === instance) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Subscribe to DevTools events
   */
  on(
    eventType: DevToolsEventType | "*",
    listener: (event: DevToolsEvent) => void,
  ): () => void {
    return this.eventEmitter.on(eventType, listener);
  }

  /**
   * Unsubscribe from DevTools events
   */
  off(
    eventType: DevToolsEventType | "*",
    listener: (event: DevToolsEvent) => void,
  ): void {
    this.eventEmitter.off(eventType, listener);
  }

  /**
   * Emit a DevTools event
   */
  emit(event: DevToolsEvent): void {
    if (!this.enabled) {
      return;
    }

    this.eventEmitter.emit(event);
  }

  /**
   * Clear all tracked instances and listeners
   */
  clear(): void {
    this.instances.clear();
    // Don't clear eventEmitter - listeners are configuration, not data
    // Clearing them would disconnect the DevTools store
    this.instanceCounter = 0;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalInstances: this.instances.size,
      instancesByType: Object.fromEntries(
        Object.values(InstanceType).map((type) => [
          type,
          this.getInstancesByType(type).length,
        ]),
      ),
      enabled: this.enabled,
    };
  }

  /**
   * Generate a unique instance ID
   */
  private generateInstanceId(type: InstanceType): InstanceId {
    this.instanceCounter++;
    return `${type}_${this.instanceCounter}_${Date.now()}`;
  }
}

/**
 * Get the global DevTools hook
 */
export function getDevToolsHook(): DevToolsHook {
  return DevToolsHook.getInstance();
}

/**
 * Install the DevTools hook
 */
export function installDevToolsHook(): DevToolsHook {
  return DevToolsHook.install();
}
