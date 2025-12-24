/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AbstractReactiveValue } from "./abstract-reactive-value";

/**
 * Global batch context for coordinating batched notifications across ReactiveValues.
 * This allows multiple ReactiveValues to batch their notifications together.
 */
export class BatchContext {
  private static _batchDepth: number = 0;
  private static _dirtyValues: Set<AbstractReactiveValue<any>> = new Set();

  /**
   * Start a new batch. All ReactiveValues modified inside this batch
   * will be marked as dirty but won't notify until endBatch() is called.
   *
   * Supports nested batches via depth counter.
   */
  static startBatch(): void {
    this._batchDepth++;
  }

  /**
   * End the current batch. If this is the outermost batch (depth = 0),
   * all dirty ReactiveValues will be flushed (notifications sent).
   *
   * Supports nested batches via depth counter.
   */
  static endBatch(): void {
    this._batchDepth--;
    if (this._batchDepth === 0) {
      // Flush all dirty values
      const dirtyValues = Array.from(this._dirtyValues);
      this._dirtyValues.clear();
      dirtyValues.forEach((rv) => rv._flushNotifications());
    }
  }

  /**
   * Check if we're currently inside a batch.
   */
  static isBatching(): boolean {
    return this._batchDepth > 0;
  }

  /**
   * Mark a ReactiveValue as dirty.
   * If we're inside a batch, it will be added to the dirty set.
   * Otherwise, it will be flushed immediately.
   */
  static markDirty(value: AbstractReactiveValue<any>): void {
    if (this.isBatching()) {
      this._dirtyValues.add(value);
    } else {
      // Not in batch: flush immediately
      value._flushNotifications();
    }
  }
}
