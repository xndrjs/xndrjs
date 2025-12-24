/**
 * DevTools Console API
 * Provides console utilities for debugging
 *
 * Architecture:
 * - `devtools.monitor.*` - Programmatic monitoring API (from monitor namespace)
 * - `devtools.instances.*` - Instance management utilities
 * - `devtools.show.*` - Console display utilities (wraps monitor functions)
 * - `devtools.timeline.*` - Timeline management
 * - Global utilities: configure, setEnabled, clear, help
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { getDevToolsHook } from "../core/hook";
import { getDevToolsStore } from "../core/store";
import { monitor } from "../monitors/monitor";
import type {
  InstanceId,
  TrackedInstance,
  DevToolsConfig,
} from "../core/types";

/**
 * Console API for DevTools
 * Unified interface that extends the monitor namespace with console utilities
 */
export const devtools = {
  /**
   * Programmatic monitoring API
   * Re-exported from the monitor namespace
   *
   * @example
   * ```js
   * // Track instances
   * devtools.monitor.reactiveValue.track(count, { name: "Count" });
   * devtools.monitor.fsm.track(fsm, { name: "Auth" });
   *
   * // Query data programmatically
   * const history = devtools.monitor.fsm.getHistory(instanceId);
   * const stats = devtools.monitor.fsm.getStats(instanceId);
   * ```
   */
  monitor,

  /**
   * Instance management utilities
   */
  instances: {
    /**
     * Get all tracked instances
     */
    getAll(): TrackedInstance[] {
      return getDevToolsHook().getAllInstances();
    },

    /**
     * Get a specific instance by ID or name
     */
    get(idOrName: InstanceId | string): TrackedInstance | undefined {
      const hook = getDevToolsHook();

      // Try as ID first
      const byId = hook.getInstance(idOrName);
      if (byId) {
        return byId;
      }

      // Try by name
      return hook.getAllInstances().find((inst) => inst.name === idOrName);
    },

    /**
     * Inspect an instance (displays detailed information in console)
     */
    inspect(idOrName: InstanceId | string): void {
      const instance = devtools.instances.get(idOrName);

      if (!instance) {
        console.warn(`[DevTools] Instance not found: ${idOrName}`);
        return;
      }

      console.group(`🔍 Inspecting: ${instance.name}`);
      console.log("Type:", instance.type);
      console.log("ID:", instance.id);
      console.log("Created:", new Date(instance.createdAt).toLocaleString());
      if (instance.metadata) {
        console.log("Metadata:", instance.metadata);
      }
      console.log("Instance:", instance.instance);

      // Get timeline for this instance
      const timeline = devtools.timeline.get(instance.id);
      console.log(`Timeline (${timeline.length} events):`, timeline);

      // Get dependencies
      const deps = getDevToolsStore()
        .getDependencies()
        .filter((dep) => dep.targetInstanceId === instance.id);
      if (deps.length > 0) {
        console.log(`Dependencies (${deps.length}):`, deps);
      }

      // Show subscription info if it's a ReactiveValue
      const value = instance.instance;
      if (
        value &&
        typeof value === "object" &&
        "_subscribers" in value &&
        value._subscribers instanceof Set
      ) {
        const subscriberCount = (value as any)._subscribers.size;
        console.log(`Subscribers: ${subscriberCount}`);
      }

      console.groupEnd();
    },

    /**
     * Track changes on an instance (logs to console when it changes)
     */
    track(idOrName: InstanceId | string): () => void {
      const instance = devtools.instances.get(idOrName);

      if (!instance) {
        console.warn(`[DevTools] Instance not found: ${idOrName}`);
        return () => {};
      }

      console.log(`[DevTools] Tracking changes for: ${instance.name}`);
      console.log("[DevTools] To stop tracking, call the returned function");

      const store = getDevToolsStore();
      const unsubscribe = store.subscribe(() => {
        const timeline = store.getTimeline();
        const recentEvents = timeline
          .filter((e) => e.instanceId === instance.id)
          .slice(0, 5);

        if (recentEvents.length > 0) {
          console.log(`[DevTools] ${instance.name} changed:`, recentEvents[0]);
        }
      });

      return () => {
        unsubscribe();
        console.log(`[DevTools] Stopped tracking: ${instance.name}`);
      };
    },
  },

  /**
   * Timeline management utilities
   */
  timeline: {
    /**
     * Get timeline events, optionally filtered by instance ID
     */
    get(instanceId?: InstanceId): any[] {
      const timeline = getDevToolsStore().getTimeline();
      if (instanceId) {
        return timeline.filter((entry) => entry.instanceId === instanceId);
      }
      return timeline;
    },

    /**
     * Clear the timeline
     */
    clear(): void {
      getDevToolsStore().clearTimeline();
      console.log("[DevTools] Timeline cleared");
    },
  },

  /**
   * Console display utilities
   */
  show: {
    /**
     * Show dependency graph
     */
    dependencies: {
      /**
       * Show dependency graph for all instances or a specific one
       */
      graph(idOrName?: InstanceId | string): void {
        const store = getDevToolsStore();
        const deps = store.getDependencies();

        if (idOrName) {
          const instance = devtools.instances.get(idOrName);
          if (!instance) {
            console.warn(`[DevTools] Instance not found: ${idOrName}`);
            return;
          }

          const instanceDeps = deps.filter(
            (dep) => dep.targetInstanceId === instance.id,
          );
          console.group(`📊 Dependency Graph: ${instance.name}`);
          console.log(instanceDeps);
          console.groupEnd();
        } else {
          console.group("📊 Dependency Graph (All)");
          console.log(deps);
          console.groupEnd();
        }
      },

      /**
       * Show dependency tree for an instance
       */
      tree(idOrName: InstanceId | string): void {
        const instance = devtools.instances.get(idOrName);
        if (!instance) {
          console.warn(`[DevTools] Instance not found: ${idOrName}`);
          return;
        }

        const tree = monitor.dependency.getTree(instance.id);
        console.group(`🌳 Dependency Tree: ${instance.name}`);
        console.log(tree);
        console.groupEnd();
      },

      /**
       * Check for circular dependencies
       */
      circular(idOrName?: InstanceId | string): void {
        const cycles = monitor.dependency.detectCircular();

        if (idOrName) {
          const instance = devtools.instances.get(idOrName);
          if (!instance) {
            console.warn(`[DevTools] Instance not found: ${idOrName}`);
            return;
          }

          const relevantCycles = cycles.filter((cycle) =>
            cycle.some((dep) => dep.targetInstanceId === instance.id),
          );

          if (relevantCycles.length === 0) {
            console.log(
              `✅ No circular dependencies found for: ${instance.name}`,
            );
          } else {
            console.group(`⚠️ Circular Dependencies: ${instance.name}`);
            console.log(relevantCycles);
            console.groupEnd();
          }
        } else {
          if (cycles.length === 0) {
            console.log("✅ No circular dependencies found");
          } else {
            console.group("⚠️ Circular Dependencies");
            console.log(cycles);
            console.groupEnd();
          }
        }
      },
    },

    /**
     * Show FSM-related information
     */
    fsm: {
      /**
       * Show FSM transition diagram
       */
      diagram(idOrName: InstanceId | string): void {
        const instance = devtools.instances.get(idOrName);
        if (!instance) {
          console.warn(`[DevTools] Instance not found: ${idOrName}`);
          return;
        }

        const history = monitor.fsm.getHistory(instance.id);
        const currentState = monitor.fsm.getCurrentState(instance.id);

        console.group(`🔄 FSM Diagram: ${instance.name}`);
        console.log("Current State:", currentState);
        console.log(`History (${history.length} transitions):`, history);
        console.groupEnd();
      },

      /**
       * Show FSM statistics
       */
      stats(idOrName: InstanceId | string): void {
        const instance = devtools.instances.get(idOrName);
        if (!instance) {
          console.warn(`[DevTools] Instance not found: ${idOrName}`);
          return;
        }

        const stats = monitor.fsm.getStats(instance.id);
        console.group(`📊 FSM Stats: ${instance.name}`);
        console.log(stats);
        console.groupEnd();
      },
    },

    /**
     * Show Memento statistics
     */
    memento: {
      /**
       * Show Memento statistics
       */
      stats(idOrName: InstanceId | string): void {
        const instance = devtools.instances.get(idOrName);
        if (!instance) {
          console.warn(`[DevTools] Instance not found: ${idOrName}`);
          return;
        }

        const stats = monitor.memento.getStats(instance.id);
        console.group(`💾 Memento Stats: ${instance.name}`);
        console.log(stats);
        console.groupEnd();
      },
    },
  },

  /**
   * Configure DevTools
   */
  configure(config: Partial<DevToolsConfig>): void {
    const store = getDevToolsStore();
    store.updateConfig(config);
    console.log("[DevTools] Configuration updated:", config);
  },

  /**
   * Enable or disable DevTools
   */
  setEnabled(enabled: boolean): void {
    const hook = getDevToolsHook();
    hook.setEnabled(enabled);
    console.log(`[DevTools] ${enabled ? "Enabled" : "Disabled"}`);
  },

  /**
   * Clear all DevTools data
   */
  clear(): void {
    const store = getDevToolsStore();
    store.clear();
    console.log("[DevTools] All data cleared");
  },

  /**
   * Show help
   */
  help(): void {
    console.group("🛠️ DevTools Console API");
    console.log("Available methods:");
    console.log("");
    console.log("🔍 Monitor API (programmatic):");
    console.log(
      "  devtools.monitor.reactiveValue.track(value, options)      - Track ReactiveValue",
    );
    console.log(
      "  devtools.monitor.reactiveObject.track(object, options)    - Track ReactiveObject",
    );
    console.log(
      "  devtools.monitor.computedValue.track(computed, options)   - Track ComputedValue",
    );
    console.log(
      "  devtools.monitor.fsm.track(fsm, options)            - Track FSM",
    );
    console.log(
      "  devtools.monitor.memento.track(caretaker, options)  - Track Memento",
    );
    console.log("  (See full monitor API documentation for all methods)");
    console.log("");
    console.log("📦 Instances:");
    console.log(
      "  devtools.instances.getAll()                        - Get all tracked instances",
    );
    console.log(
      "  devtools.instances.get(idOrName)                   - Get a specific instance",
    );
    console.log(
      "  devtools.instances.inspect(idOrName)               - Inspect an instance",
    );
    console.log(
      "  devtools.instances.track(idOrName)                 - Track changes on an instance",
    );
    console.log("");
    console.log("📋 Timeline:");
    console.log(
      "  devtools.timeline.get([instanceId])                - Get timeline events",
    );
    console.log(
      "  devtools.timeline.clear()                          - Clear timeline",
    );
    console.log("");
    console.log("📊 Show (console display utilities):");
    console.log(
      "  devtools.show.dependencies.graph([idOrName])       - Show dependency graph",
    );
    console.log(
      "  devtools.show.dependencies.tree(idOrName)          - Show dependency tree",
    );
    console.log(
      "  devtools.show.dependencies.circular([idOrName])    - Check circular deps",
    );
    console.log(
      "  devtools.show.fsm.diagram(idOrName)                - Show FSM diagram",
    );
    console.log(
      "  devtools.show.fsm.stats(idOrName)                  - Show FSM statistics",
    );
    console.log(
      "  devtools.show.memento.stats(idOrName)              - Show Memento statistics",
    );
    console.log("");
    console.log("⚙️ Configuration:");
    console.log(
      "  devtools.configure(config)                 - Update configuration",
    );
    console.log(
      "  devtools.setEnabled(enabled)               - Enable/disable DevTools",
    );
    console.log(
      "  devtools.clear()                           - Clear all data",
    );
    console.log(
      "  devtools.help()                            - Show this help",
    );
    console.groupEnd();
  },
};

/**
 * Install the console API on the window object
 */
export function installConsoleAPI(): void {
  if (typeof window !== "undefined") {
    (window as any).devtools = devtools;
  }
}
