import { batched, type ComputedValue, type StatePort } from "@xndrjs/core";
import type {
  MementoAbstractOriginatorProps,
  MementoAbstractCaretakerProps,
} from "./types";

/**
 * Abstract base class for caretakers in the Memento pattern.
 * Uses StatePort for history and pointer; concrete classes decide how to compute canUndo/canRedo.
 */
export abstract class MementoAbstractCaretaker<
  TState,
  Originator extends MementoAbstractOriginatorProps<TMemento>,
  TMemento = TState,
> implements MementoAbstractCaretakerProps<TMemento, Originator> {
  protected _history: StatePort<TMemento[]>;
  protected _historyPointer: StatePort<number>;
  protected _originator: Originator;

  constructor(
    originator: Originator,
    historyPort: StatePort<TMemento[]>,
    historyPointerPort: StatePort<number>,
  ) {
    this._history = historyPort;
    this._historyPointer = historyPointerPort;
    this._originator = originator;
    this.saveState();
  }

  public get history(): StatePort<TMemento[]> {
    return this._history;
  }

  public get historyPointer(): StatePort<number> {
    return this._historyPointer;
  }

  public get originator(): Originator {
    return this._originator;
  }

  protected setHistory(history: TMemento[]): void {
    batched(() => {
      this._history.set(history);
      this._historyPointer.set(history.length - 1);
    });
  }

  protected setHistoryPointer(historyPointer: number): void {
    this._historyPointer.set(historyPointer);
  }

  abstract get canUndo(): ComputedValue<boolean>;
  abstract get canRedo(): ComputedValue<boolean>;

  public abstract saveState(): void;
  public abstract undo(): void;
  public abstract redo(): void;
}
