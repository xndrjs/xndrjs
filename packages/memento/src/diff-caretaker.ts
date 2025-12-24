import {
  createComputed,
  SubscriptionsRegistry,
  type Disposable,
} from "@xndrjs/core";
import type { ComputedValue, StatePort } from "@xndrjs/core";
import { MementoAbstractCaretaker } from "./abstract-caretaker";
import type { MementoDiffOriginator } from "./types";
import { RestoreMementoAction } from "./types";

/**
 * Caretaker implementation for diff-based mementos using StatePort.
 * Manages history of diffs and provides undo/redo functionality.
 */
export class MementoDiffCaretaker<
  TState,
  Originator extends MementoDiffOriginator<TState, TMemento>,
  TMemento,
>
  extends MementoAbstractCaretaker<never, Originator, TMemento>
  implements Disposable
{
  protected _lastSavedState!: TState | null;
  private _canUndo: ComputedValue<boolean>;
  private _canRedo: ComputedValue<boolean>;

  constructor(
    originator: Originator,
    history: StatePort<TMemento[]>,
    historyPointer: StatePort<number>,
  ) {
    super(originator, history, historyPointer);
    // After base constructor's initial save, align lastSavedState with current state.
    this._lastSavedState = this._originator.getState();

    this._canUndo = createComputed(this._historyPointer, this._history)
      .as((pointer) => pointer >= 0)
      .for(this);

    this._canRedo = createComputed(this._historyPointer, this._history)
      .as((pointer, history) => pointer < history.length - 1)
      .for(this);
  }

  get canUndo(): ComputedValue<boolean> {
    return this._canUndo;
  }

  get canRedo(): ComputedValue<boolean> {
    return this._canRedo;
  }

  public saveState() {
    if (this._historyPointer.get() < this._history.get().length - 1) {
      this._history.set(
        this._history.get().slice(0, this._historyPointer.get() + 1),
      );
    }
    const state = this._originator.getState();
    const prevState = this._lastSavedState ?? null;
    const memento = this._originator.getMemento(state, prevState);
    this._lastSavedState = state;

    if (memento !== null) {
      this.setHistory(this._history.get().concat(memento));
    }
  }

  public undo() {
    if (this.canUndo.get()) {
      const newPointer = this._historyPointer.get() - 1;
      const currentMemento = this._history.get()[this._historyPointer.get()];
      if (currentMemento !== undefined) {
        this._originator.restoreMemento(
          currentMemento,
          RestoreMementoAction.Undo,
        );
      }
      this._historyPointer.set(newPointer);
      this._lastSavedState = this._originator.getState();
    }
  }

  public redo() {
    if (this.canRedo.get()) {
      const newPointer = this._historyPointer.get() + 1;
      const memento = this._history.get()[newPointer];
      if (memento !== undefined) {
        this._originator.restoreMemento(memento, RestoreMementoAction.Redo);
      }
      this._historyPointer.set(newPointer);
      this._lastSavedState = this._originator.getState();
    }
  }

  /**
   * Dispose of the caretaker, cleaning up all subscriptions.
   * Implements Disposable interface for automatic cleanup.
   */
  [Symbol.dispose](): void {
    SubscriptionsRegistry.cleanup(this);
  }
}
