import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReactiveValue, ReactiveArray, ViewModel } from "@xndrjs/core";
import type { StatePort } from "@xndrjs/core";
import { MementoBaseCaretaker } from "./base-caretaker";
import type { MementoBaseOriginator } from "./types";

class TestViewModel extends ViewModel {}

// Simple originator for testing
class TestOriginator implements MementoBaseOriginator<number> {
  private _value: ReactiveValue<number>;

  constructor(initialValue: number) {
    this._value = new ReactiveValue(initialValue);
  }

  getValue(): number {
    return this._value.get();
  }

  setValue(value: number): void {
    this._value.set(value);
  }

  getMemento(): number | null {
    return this._value.get();
  }

  restoreMemento(memento: number): void {
    this._value.set(memento);
  }
}

describe("MementoBaseCaretaker", () => {
  let originator: TestOriginator;
  let caretaker: MementoBaseCaretaker<number, TestOriginator>;
  let historyPort: StatePort<number[]>;
  let historyPointerPort: StatePort<number>;
  let owner: TestViewModel;

  beforeEach(() => {
    owner = new TestViewModel();
    originator = new TestOriginator(0);

    // Create StatePort directly (ReactiveValue and ReactiveArray now implement StatePort)
    historyPort = new ReactiveArray<number>([]);
    historyPointerPort = new ReactiveValue<number>(-1);

    caretaker = new MementoBaseCaretaker(
      owner,
      originator,
      historyPort,
      historyPointerPort,
    );
  });

  afterEach(() => {
    if (owner && !owner.disposed) {
      owner[Symbol.dispose]();
    }
  });

  it("should initialize with initial state", () => {
    expect(caretaker.history.get().length).toBe(1);
    expect(caretaker.historyPointer.get()).toBe(0);
    expect(caretaker.history.get()[0]).toBe(0);
  });

  it("should track canUndo correctly", () => {
    expect(caretaker.canUndo.get()).toBe(false);

    originator.setValue(1);
    caretaker.saveState();

    expect(caretaker.canUndo.get()).toBe(true);
  });

  it("should track canRedo correctly", () => {
    expect(caretaker.canRedo.get()).toBe(false);

    originator.setValue(1);
    caretaker.saveState();
    expect(caretaker.canRedo.get()).toBe(false);

    caretaker.undo();
    expect(caretaker.canRedo.get()).toBe(true);
  });

  it("should save state correctly", () => {
    originator.setValue(1);
    caretaker.saveState();

    expect(caretaker.history.get().length).toBe(2);
    expect(caretaker.historyPointer.get()).toBe(1);
    expect(caretaker.history.get()[1]).toBe(1);
  });

  it("should undo correctly", () => {
    originator.setValue(1);
    caretaker.saveState();
    originator.setValue(2);
    caretaker.saveState();

    expect(caretaker.historyPointer.get()).toBe(2);
    expect(originator.getValue()).toBe(2);

    caretaker.undo();
    expect(caretaker.historyPointer.get()).toBe(1);
    expect(originator.getValue()).toBe(1);
  });

  it("should redo correctly", () => {
    originator.setValue(1);
    caretaker.saveState();
    originator.setValue(2);
    caretaker.saveState();

    caretaker.undo();
    expect(originator.getValue()).toBe(1);

    caretaker.redo();
    expect(caretaker.historyPointer.get()).toBe(2);
    expect(originator.getValue()).toBe(2);
  });

  it("should ignore duplicate mementos", () => {
    originator.setValue(1);
    caretaker.saveState();

    // Try to save the same value again
    caretaker.saveState();

    expect(caretaker.history.get().length).toBe(2); // Should still be 2, not 3
  });

  it("should truncate history when saving after undo", () => {
    originator.setValue(1);
    caretaker.saveState();
    originator.setValue(2);
    caretaker.saveState();
    originator.setValue(3);
    caretaker.saveState();

    expect(caretaker.history.get().length).toBe(4);

    caretaker.undo();
    caretaker.undo();
    expect(caretaker.historyPointer.get()).toBe(1);

    originator.setValue(4);
    caretaker.saveState();

    // History should be truncated
    expect(caretaker.history.get().length).toBe(3);
    expect(caretaker.historyPointer.get()).toBe(2);
    expect(caretaker.history.get()[2]).toBe(4);
  });
});
