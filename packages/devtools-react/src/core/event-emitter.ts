/**
 * DevTools Event Emitter
 * Lightweight event system for internal DevTools communication
 */

import type { DevToolsEvent, DevToolsEventType } from "./types";

type EventListener = (event: DevToolsEvent) => void;

/**
 * Simple event emitter for DevTools internal communication
 */
export class DevToolsEventEmitter {
  private listeners: Map<DevToolsEventType | "*", Set<EventListener>> =
    new Map();
  private maxListeners = 100;

  /**
   * Subscribe to a specific event type or all events ('*')
   */
  on(eventType: DevToolsEventType | "*", listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listeners = this.listeners.get(eventType)!;

    if (listeners.size >= this.maxListeners) {
      console.warn(
        `[DevTools] Max listeners (${this.maxListeners}) reached for event type: ${eventType}`,
      );
    }

    listeners.add(listener);

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventType: DevToolsEventType | "*", listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: DevToolsEvent): void {
    // Notify specific event type listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("[DevTools] Error in event listener:", error);
        }
      });
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get("*");
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("[DevTools] Error in wildcard listener:", error);
        }
      });
    }
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: DevToolsEventType | "*"): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }
}
