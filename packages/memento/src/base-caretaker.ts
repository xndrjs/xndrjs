import {
  createComputed,
  SubscriptionsRegistry,
  type Disposable,
} from "@xndrjs/core";
import type { ComputedValue, StatePort } from "@xndrjs/core";
import { MementoAbstractCaretaker } from "./abstract-caretaker";
import type { MementoBaseOriginator } from "./types";
import isEqual from "fast-deep-equal";

/**
 * Base implementation of a caretaker for the Memento pattern.
 * Uses StatePort for framework-agnostic state management.
 *
 * @template TMemento - The type of the memento.
 * @template Originator - The originator type. Must implement MementoBaseOriginator<TMemento>.
 */
export class MementoBaseCaretaker<
  TMemento,
  Originator extends MementoBaseOriginator<TMemento> =
    MementoBaseOriginator<TMemento>,
>
  extends MementoAbstractCaretaker<never, Originator, TMemento>
  implements Disposable
{
  private _canUndo: ComputedValue<boolean>;
  private _canRedo: ComputedValue<boolean>;

  constructor(
    originator: Originator,
    history: StatePort<TMemento[]>,
    historyPointer: StatePort<number>,
  ) {
    super(originator, history, historyPointer);

    this._canUndo = createComputed(this._historyPointer)
      .as((pointer) => pointer > 0)
      .for(this);

    this._canRedo = createComputed(this._historyPointer, this._history)
      .as((pointer, history) => pointer < history.length - 1)
      .for(this);
  }

  public saveState() {
    const currentHistory = this._history.get();
    const pointer = this._historyPointer.get();
    const memento = this._originator.getMemento();

    if (memento === null) return;

    const lastHistoryItem = currentHistory[currentHistory.length - 1];
    const isChanged = !isEqual(lastHistoryItem, memento);

    if (!isChanged) return;

    let newHistory: TMemento[];
    if (pointer < currentHistory.length - 1) {
      newHistory = currentHistory.slice(0, pointer + 1).concat(memento);
    } else {
      newHistory = currentHistory.concat(memento);
    }

    this.setHistory(newHistory);
  }

  public undo() {
    if (this.canUndo.get()) {
      this._historyPointer.set(this._historyPointer.get() - 1);
      const memento = this._history.get()[this._historyPointer.get()];
      if (memento !== undefined) {
        this._originator.restoreMemento(memento);
      }
    }
  }

  public redo() {
    if (this.canRedo.get()) {
      const newPointer = this._historyPointer.get() + 1;
      this._historyPointer.set(newPointer);
      const memento = this._history.get()[newPointer];
      if (memento !== undefined) {
        this._originator.restoreMemento(memento);
      }
    }
  }

  get canUndo(): ComputedValue<boolean> {
    return this._canUndo;
  }

  get canRedo(): ComputedValue<boolean> {
    return this._canRedo;
  }

  /**
   * Dispose of the caretaker, cleaning up all subscriptions.
   * Implements Disposable interface for automatic cleanup.
   */
  [Symbol.dispose](): void {
    SubscriptionsRegistry.cleanup(this);
  }
}
