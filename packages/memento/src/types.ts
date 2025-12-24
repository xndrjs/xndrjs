import type { ComputedValue, StatePort } from "@xndrjs/core";

export interface MementoAbstractCaretakerProps<TMemento, Originator> {
  history: StatePort<TMemento[]>;
  historyPointer: StatePort<number>;
  originator: Originator;
  canUndo: ComputedValue<boolean>;
  canRedo: ComputedValue<boolean>;
  saveState(): void;
  undo(): void;
  redo(): void;
}

export enum RestoreMementoAction {
  Undo = "undo",
  Redo = "redo",
}

export interface MementoAbstractOriginatorProps<TMemento> {
  restoreMemento(memento: TMemento, action: RestoreMementoAction): void;
}

/**
 * Interface for base originators in the Memento pattern.
 * Unlike MementoDiffOriginator, the memento in MementoBaseOriginator represents a snapshot of the state,
 * not a diff. The memento type can be any POJO structure representing the state.
 *
 * @template TMemento - The type of the memento (snapshot)
 */
export interface MementoBaseOriginator<TMemento> {
  /**
   * Get a snapshot (memento) of the current state.
   * The memento represents a point-in-time snapshot that can be used to restore the state later.
   *
   * @returns A snapshot of the current state, or null if no snapshot should be saved
   */
  getMemento(): TMemento | null;

  /**
   * Restore the state from a snapshot (memento).
   * This method should restore the originator's state to match the provided memento.
   *
   * @param memento - The snapshot to restore from
   */
  restoreMemento(memento: TMemento): void;
}

/**
 * Interface for diff-based originators in the Memento pattern.
 * Unlike MementoBaseOriginator, the memento in MementoDiffOriginator can be any POJO structure,
 * not necessarily related to the state structure. The memento represents a diff/change
 * that can be applied to restore state, not a snapshot of the state itself.
 *
 * @template TState - The type of the state (POJO) returned by getState()
 * @template TMemento - The type of the memento (any POJO). Must be explicitly specified.
 */
export interface MementoDiffOriginator<
  TState,
  TMemento,
> extends MementoAbstractOriginatorProps<TMemento> {
  /**
   * Get the current state as a plain object.
   * Must be implemented to extract the state from the store.
   *
   * @returns The current state as a plain object
   */
  getState(): TState;

  /**
   * Calculate and return a memento (diff) representing the change between states.
   *
   * @param state - The current state
   * @param prevState - The previous state, or null if this is the first state
   * @returns A memento representing the diff, or null if no change should be saved
   */
  getMemento(state: TState, prevState: TState | null): TMemento | null;
}
