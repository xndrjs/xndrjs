/**
 * Memento Monitor
 * Tracks memento pattern usage (undo/redo history)
 * Updated for new reactive system
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { MementoAbstractCaretaker } from "@xndrjs/memento";
import { getDevToolsHook } from "../core/hook";
import type { SerializableMetadata } from "../core/types";
import { InstanceType, DevToolsEventType } from "../core/types";
import type { InstanceId, MementoEventData } from "../core/types";

/**
 * Options for monitoring a Memento instance
 */
export interface MonitorMementoOptions {
  /** Instance name (required) */
  name: string;
  /** Optional metadata (must be JSON-serializable - no functions, classes, bigint, symbol, etc.) */
  metadata?: SerializableMetadata;
}

interface MonitoredCaretaker {
  instanceId: InstanceId;
  originalSaveState: Function;
  originalUndo: Function;
  originalRedo: Function;
}

const monitoredCaretakers = new WeakMap<any, MonitoredCaretaker>();

/**
 * Monitor a Memento Caretaker instance
 * Automatically patches saveState, undo, and redo methods to track operations
 */
export function monitorMemento(
  caretaker: MementoAbstractCaretaker<any, any, any>,
  options: MonitorMementoOptions,
): InstanceId {
  const hook = getDevToolsHook();

  if (!hook.isEnabled()) {
    return "";
  }

  // Check if already monitored
  if (monitoredCaretakers.has(caretaker)) {
    return monitoredCaretakers.get(caretaker)!.instanceId;
  }

  // Determine instance type from originator
  const originator = caretaker.originator;
  const isDiffOriginator = originator.constructor.name.includes("Diff");
  const instanceType = isDiffOriginator
    ? InstanceType.MEMENTO_DIFF_ORIGINATOR
    : InstanceType.MEMENTO_BASE_ORIGINATOR;

  // Register instance
  const instanceId = hook.registerInstance(
    instanceType,
    caretaker,
    options.name,
    options.metadata,
  );

  // Save original methods
  const originalSaveState = caretaker.saveState.bind(caretaker);
  const originalUndo = caretaker.undo.bind(caretaker);
  const originalRedo = caretaker.redo.bind(caretaker);

  const monitored: MonitoredCaretaker = {
    instanceId,
    originalSaveState,
    originalUndo,
    originalRedo,
  };

  monitoredCaretakers.set(caretaker, monitored);

  // Patch saveState
  caretaker.saveState = function (this: any) {
    const historyLengthBefore = this.history?.get()?.length || 0;
    originalSaveState();
    const historyLengthAfter = this.history?.get()?.length || 0;

    // Only emit if a memento was actually saved (history grew)
    if (historyLengthAfter > historyLengthBefore) {
      const lastMemento = this.history.get()[historyLengthAfter - 1];
      hook.emit({
        type: DevToolsEventType.MEMENTO_SAVE,
        instanceId,
        timestamp: Date.now(),
        data: {
          mementoId: generateMementoId(),
          snapshotSize: lastMemento ? estimateSize(lastMemento) : 0,
          historyLength: historyLengthAfter,
        } as MementoEventData,
      });
    }
  };

  // Patch undo
  caretaker.undo = function (this: any) {
    const historyPointerBefore = this.historyPointer.get();
    originalUndo();
    const historyPointerAfter = this.historyPointer.get();

    // Only emit if undo actually happened (pointer moved)
    if (historyPointerAfter < historyPointerBefore) {
      const memento = this.history.get()[historyPointerBefore];
      hook.emit({
        type: DevToolsEventType.MEMENTO_RESTORE,
        instanceId,
        timestamp: Date.now(),
        data: {
          mementoId: generateMementoId(),
          snapshotSize: memento ? estimateSize(memento) : 0,
          historyLength: this.history?.get()?.length || 0,
        } as MementoEventData,
      });

      hook.emit({
        type: DevToolsEventType.MEMENTO_UNDO,
        instanceId,
        timestamp: Date.now(),
        data: {
          historyLength: this.history?.get()?.length || 0,
        } as MementoEventData,
      });
    }
  };

  // Patch redo
  caretaker.redo = function (this: any) {
    const historyPointerBefore = this.historyPointer.get();
    originalRedo();
    const historyPointerAfter = this.historyPointer.get();

    // Only emit if redo actually happened (pointer moved)
    if (historyPointerAfter > historyPointerBefore) {
      const memento = this.history.get()[historyPointerAfter];
      hook.emit({
        type: DevToolsEventType.MEMENTO_RESTORE,
        instanceId,
        timestamp: Date.now(),
        data: {
          mementoId: generateMementoId(),
          snapshotSize: memento ? estimateSize(memento) : 0,
          historyLength: this.history?.get()?.length || 0,
        } as MementoEventData,
      });

      hook.emit({
        type: DevToolsEventType.MEMENTO_REDO,
        instanceId,
        timestamp: Date.now(),
        data: {
          historyLength: this.history?.get()?.length || 0,
        } as MementoEventData,
      });
    }
  };

  return instanceId;
}

/**
 * Unmonitor a Memento Caretaker instance
 */
export function unmonitorMemento(
  caretaker: MementoAbstractCaretaker<any, any, any>,
): void {
  const monitored = monitoredCaretakers.get(caretaker);
  if (!monitored) {
    return;
  }

  const hook = getDevToolsHook();

  // Restore original methods
  caretaker.saveState = monitored.originalSaveState as any;
  caretaker.undo = monitored.originalUndo as any;
  caretaker.redo = monitored.originalRedo as any;

  // Unregister instance
  hook.unregisterInstance(monitored.instanceId);

  // Remove from map
  monitoredCaretakers.delete(caretaker);
}

/**
 * Estimate the size of a memento
 */
function estimateSize(obj: any): number {
  try {
    return JSON.stringify(obj).length;
  } catch {
    return 0;
  }
}

/**
 * Generate a unique memento ID
 */
let mementoCounter = 0;
function generateMementoId(): string {
  return `memento_${++mementoCounter}_${Date.now()}`;
}

/**
 * Get memento history stats
 */
export interface MementoStats {
  totalSaves: number;
  totalRestores: number;
  totalUndos: number;
  totalRedos: number;
  averageSnapshotSize: number;
}

const mementoStats = new Map<InstanceId, MementoStats>();

export function getMementoStats(instanceId: InstanceId): MementoStats {
  if (!mementoStats.has(instanceId)) {
    mementoStats.set(instanceId, {
      totalSaves: 0,
      totalRestores: 0,
      totalUndos: 0,
      totalRedos: 0,
      averageSnapshotSize: 0,
    });
  }

  return mementoStats.get(instanceId)!;
}

/**
 * Initialize stats tracking
 */
export function initMementoStatsTracking(): void {
  const hook = getDevToolsHook();

  hook.on(DevToolsEventType.MEMENTO_SAVE, (event) => {
    const stats = getMementoStats(event.instanceId);
    stats.totalSaves++;

    const data = event.data as MementoEventData;
    if (data.snapshotSize) {
      stats.averageSnapshotSize =
        (stats.averageSnapshotSize * (stats.totalSaves - 1) +
          data.snapshotSize) /
        stats.totalSaves;
    }
  });

  hook.on(DevToolsEventType.MEMENTO_RESTORE, (event) => {
    const stats = getMementoStats(event.instanceId);
    stats.totalRestores++;
  });

  hook.on(DevToolsEventType.MEMENTO_UNDO, (event) => {
    const stats = getMementoStats(event.instanceId);
    stats.totalUndos++;
  });

  hook.on(DevToolsEventType.MEMENTO_REDO, (event) => {
    const stats = getMementoStats(event.instanceId);
    stats.totalRedos++;
  });
}
