/**
 * Monitor Namespace
 * Unified interface for all monitoring functions
 *
 * @example
 * ```ts
 * import { monitor } from '@xndrjs/devtools-react';
 *
 * // Monitor reactive values
 * const count = new ReactiveValue(0);
 * monitor.reactiveValue.track(count, { name: "Count" });
 *
 * const obj = new ReactiveObject({ name: "John" });
 * monitor.reactiveObject.track(obj, { name: "User" });
 *
 * // Monitor FSM and query its history
 * monitor.fsm.track(fsm, { name: "AuthFlow" });
 * const history = monitor.fsm.getHistory(instanceId);
 * const stats = monitor.fsm.getStats(instanceId);
 *
 * // Monitor memento patterns
 * monitor.memento.track(caretaker, { name: "UserHistory" });
 * const stats = monitor.memento.getStats(instanceId);
 * ```
 */

import {
  monitorReactiveValue,
  unmonitorReactiveValue,
  isReactiveValueMonitored,
  getReactiveValueInstanceId,
} from "./reactive-value-monitor";
import {
  monitorReactiveObject,
  unmonitorReactiveObject,
  isReactiveObjectMonitored,
  getReactiveObjectInstanceId,
} from "./reactive-object-monitor";
import {
  monitorComputedValue,
  unmonitorComputedValue,
  isComputedValueMonitored,
  getComputedValueInstanceId,
} from "./computed-value-monitor";
import {
  monitorFSM,
  unmonitorFSM,
  getFSMHistory,
  getCurrentState,
  getFSMStats,
} from "./fsm-monitor";
import {
  monitorMemento,
  unmonitorMemento,
  getMementoStats,
} from "./memento-monitor";
import {
  detectCircularDependencies,
  getInstanceDependencies,
  getDependencyTree,
} from "./dependency-tracker";

/**
 * Unified monitoring interface
 * Groups all monitor methods by domain for better discoverability
 */
export const monitor = {
  /**
   * ReactiveValue monitoring
   */
  reactiveValue: {
    track: monitorReactiveValue,
    untrack: unmonitorReactiveValue,
    isMonitored: isReactiveValueMonitored,
    getInstanceId: getReactiveValueInstanceId,
  },

  /**
   * ReactiveObject monitoring
   */
  reactiveObject: {
    track: monitorReactiveObject,
    untrack: unmonitorReactiveObject,
    isMonitored: isReactiveObjectMonitored,
    getInstanceId: getReactiveObjectInstanceId,
  },

  /**
   * ComputedValue monitoring
   */
  computedValue: {
    track: monitorComputedValue,
    untrack: unmonitorComputedValue,
    isMonitored: isComputedValueMonitored,
    getInstanceId: getComputedValueInstanceId,
  },

  /**
   * FSM monitoring and utilities
   */
  fsm: {
    /**
     * Monitor an FSM instance
     */
    track: monitorFSM,

    /**
     * Stop monitoring an FSM instance
     */
    untrack: unmonitorFSM,

    /**
     * Get transition history for an FSM
     */
    getHistory: getFSMHistory,

    /**
     * Get current state of an FSM
     */
    getCurrentState,

    /**
     * Get statistics for an FSM
     */
    getStats: getFSMStats,
  },

  /**
   * Memento monitoring and utilities
   */
  memento: {
    /**
     * Monitor a Memento Caretaker instance
     */
    track: monitorMemento,

    /**
     * Stop monitoring a Memento instance
     */
    untrack: unmonitorMemento,

    /**
     * Get statistics for a Memento instance
     */
    getStats: getMementoStats,
  },

  /**
   * Dependency tracking utilities
   */
  dependency: {
    /**
     * Detect circular dependencies
     */
    detectCircular: detectCircularDependencies,

    /**
     * Get dependencies for a specific instance
     */
    getInstanceDependencies,

    /**
     * Get dependency tree for an instance
     */
    getTree: getDependencyTree,
  },
};
