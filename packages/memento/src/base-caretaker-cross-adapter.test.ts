import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

describe("MementoBaseCaretaker - Cross Adapter", () => {
  describe("with reactive adapter", () => {
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

    it("should work with reactive adapter", () => {
      expect(caretaker.canUndo.get()).toBe(false);
      expect(caretaker.canRedo.get()).toBe(false);

      originator.setValue(1);
      caretaker.saveState();

      expect(caretaker.canUndo.get()).toBe(true);
      expect(caretaker.canRedo.get()).toBe(false);

      caretaker.undo();
      expect(caretaker.canUndo.get()).toBe(false);
      expect(caretaker.canRedo.get()).toBe(true);

      caretaker.redo();
      expect(caretaker.canUndo.get()).toBe(true);
      expect(caretaker.canRedo.get()).toBe(false);
    });

    it("should support subscriptions with reactive adapter", async () => {
      const canUndoCallback = vi.fn();
      const canRedoCallback = vi.fn();

      const unsubUndo = caretaker.canUndo.subscribe?.(canUndoCallback);
      const unsubRedo = caretaker.canRedo.subscribe?.(canRedoCallback);

      originator.setValue(1);
      caretaker.saveState();

      // Wait for microtask to execute (ComputedValue uses queueMicrotask for deduplication)
      await Promise.resolve();

      // Subscriptions should be called when values change
      expect(canUndoCallback).toHaveBeenCalled();
      expect(canRedoCallback).toHaveBeenCalled();

      unsubUndo?.();
      unsubRedo?.();
    });
  });

  // Note: React adapter has limitations (useStatePort doesn't support subscribe)
  // So we can't fully test it here without a React component context
  // This test documents the limitation
  describe("with react adapter", () => {
    it.skip("should work with react adapter (requires React component context)", () => {
      // React adapter requires React hooks, so it can't be tested in isolation
      // In a real React component, you would use:
      // const statePort = useCreateStatePort(initialValue);
      // const caretaker = new MementoBaseCaretaker(originator, statePort);
      // However, useStatePort doesn't support subscribe, so computed values
      // won't update automatically. This is a known limitation.
    });
  });
});
