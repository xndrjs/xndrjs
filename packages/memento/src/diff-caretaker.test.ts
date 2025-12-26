import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReactiveValue, ReactiveArray, ViewModel } from "@xndrjs/core";
import type { StatePort } from "@xndrjs/core";
import { MementoDiffCaretaker } from "./diff-caretaker";
import type { MementoDiffOriginator } from "./types";

class TestViewModel extends ViewModel {}

// Simple diff originator: state = number, memento = delta
class TestDiffOriginator implements MementoDiffOriginator<number, number> {
  private _value: ReactiveValue<number>;

  constructor(initialValue: number) {
    this._value = new ReactiveValue(initialValue);
  }

  getState(): number {
    return this._value.get();
  }

  setState(value: number): void {
    this._value.set(value);
  }

  getMemento(state: number, prevState: number | null): number | null {
    if (prevState === null) return state; // initial snapshot
    const delta = state - prevState;
    return delta === 0 ? null : delta;
  }

  restoreMemento(memento: number, action: "undo" | "redo") {
    // For undo: revert by subtracting delta; for redo: apply delta
    const current = this._value.get();
    const next = action === "undo" ? current - memento : current + memento;
    this._value.set(next);
  }
}

describe("MementoDiffCaretaker (StatePort)", () => {
  let originator: TestDiffOriginator;
  let caretaker: MementoDiffCaretaker<number, TestDiffOriginator, number>;
  let historyPort: StatePort<number[]>;
  let historyPointerPort: StatePort<number>;
  let owner: TestViewModel;

  beforeEach(() => {
    owner = new TestViewModel();
    originator = new TestDiffOriginator(0);

    // Create StatePort directly (ReactiveValue and ReactiveArray now implement StatePort)
    historyPort = new ReactiveArray<number>([]);
    historyPointerPort = new ReactiveValue<number>(-1);

    caretaker = new MementoDiffCaretaker(
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

  it("initializes with initial state", () => {
    expect(caretaker.history.get().length).toBe(1);
    expect(caretaker.historyPointer.get()).toBe(0);
    expect(caretaker.history.get()[0]).toBe(0);
  });

  it("saves diffs and supports undo/redo", () => {
    // Change state using setState (not restoreMemento!)
    originator.setState(2); // state becomes 2 (delta = 2 - 0 = 2)
    caretaker.saveState(); // records +2

    originator.setState(5); // state becomes 5 (delta = 5 - 2 = 3)
    caretaker.saveState(); // records +3

    expect(caretaker.history.get().length).toBe(3);
    expect(originator.getState()).toBe(5);

    caretaker.undo();
    expect(originator.getState()).toBe(2); // undo last (+3)

    caretaker.undo();
    expect(originator.getState()).toBe(0); // undo first (+2)

    caretaker.redo();
    expect(originator.getState()).toBe(2);
  });

  it("does not save zero deltas", () => {
    // After constructor, state is already 0 and lastSavedState is 0 (initial state)
    // Don't change the state (it remains 0)
    // saveState with state=0, lastSavedState=0 -> delta=0 -> memento=null -> should not save
    caretaker.saveState(); // delta 0 -> null
    expect(caretaker.history.get().length).toBe(1); // Should still be 1 (just initial snapshot)
  });
});
