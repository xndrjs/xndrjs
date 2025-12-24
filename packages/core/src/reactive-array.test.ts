import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ReactiveArray } from "./reactive-array";
import { type PlainObject } from "./plain-object";

describe("ReactiveArray", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic functionality", () => {
    it("should initialize with an array", () => {
      const arr = new ReactiveArray([1, 2, 3]);
      expect(arr.get()).toEqual([1, 2, 3]);
    });

    it("should initialize with empty array", () => {
      const arr = new ReactiveArray<number>([]);
      expect(arr.get()).toEqual([]);
    });

    it("should update value", () => {
      const arr = new ReactiveArray([1, 2, 3]);
      arr.set([4, 5, 6]);
      expect(arr.get()).toEqual([4, 5, 6]);
    });

    it("should notify subscribers on value change", () => {
      const arr = new ReactiveArray([1, 2, 3]);
      const subscriber = vi.fn();

      arr.subscribe(subscriber);
      expect(subscriber).not.toHaveBeenCalled();

      arr.set([4, 5, 6]);
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith([4, 5, 6]);
    });

    it("should not notify if value hasn't changed", () => {
      const arr = new ReactiveArray([1, 2, 3]);
      const subscriber = vi.fn();

      arr.subscribe(subscriber);
      arr.set([1, 2, 3]); // Same value
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should reject non-array values", () => {
      expect(() => {
        // @ts-expect-error testing runtime validation
        new ReactiveArray("not an array");
      }).toThrow("ReactiveArray requires an array");
    });
  });

  describe("set() method with callback", () => {
    it("should update array using Immer producer", () => {
      const arr = new ReactiveArray([1, 2, 3]);
      const subscriber = vi.fn();

      arr.subscribe(subscriber);
      arr.set((draft) => {
        draft[1] = 2;
        draft.push(4);
      });

      expect(arr.get()).toEqual([1, 2, 3, 4]);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should not notify if producer returns same value", () => {
      const arr = new ReactiveArray([1, 2, 3]);
      const subscriber = vi.fn();

      arr.subscribe(subscriber);
      arr.set((_draft) => {
        // No changes
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("Date support", () => {
    it("should support Date objects in array", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-02");
      const arr = new ReactiveArray([date1]);

      expect(arr.get()[0]).toBe(date1);

      const subscriber = vi.fn();
      arr.subscribe(subscriber);

      arr.set((draft) => {
        draft.push(date2);
      });

      expect(arr.get()).toEqual([date1, date2]);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should detect Date changes on change array", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-02");
      const arr = new ReactiveArray([date1]);

      const subscriber = vi.fn();
      arr.subscribe(subscriber);

      arr.set([date2]);
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Same timestamp should not trigger notification
      const date3 = new Date("2024-01-02");
      arr.set([date3]);
      // fast-deep-equal compares Date by timestamp, so this should not notify
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should detect Date changes when using update", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2025-01-01");
      const arr = new ReactiveArray([date1]);

      const subscriber = vi.fn();
      arr.subscribe(subscriber);

      arr.set((draft) => {
        draft[0] = date2;
      });
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith([date2]);
      const mockedCall = subscriber.mock.calls[0];
      expect(mockedCall![0]![0]!.getTime()).toBe(date2.getTime());
    });

    it("should support Date objects in nested structures", () => {
      const date = new Date("2024-01-01");
      const arr = new ReactiveArray([
        { id: 1, createdAt: date },
        { id: 2, createdAt: date },
      ]);

      expect(arr.get()[0]?.createdAt).toBe(date);
      expect(arr.get()[1]?.createdAt).toBe(date);
    });
  });

  describe("toPlainObject", () => {
    it("should return original value when toPlainObject is not configured", () => {
      const arr = new ReactiveArray([1, 2, 3]);
      const plain = arr.toPlainObject();
      expect(plain).toEqual([1, 2, 3]);
      expect(plain).toBe(arr.get()); // Same reference
    });

    it("should return converted value when toPlainObject is configured", () => {
      const arr = new ReactiveArray<
        { tags: Set<string> }, // item "raw"
        { tags: string[] } // item plain
      >([{ tags: new Set(["a"]) }, { tags: new Set(["b"]) }], {
        toPlainObject: (value) =>
          value.map((item) => ({
            tags: Array.from(item.tags),
          })),
      });

      const original = arr.get();
      expect(original[0]?.tags).toBeInstanceOf(Set);

      const plain = arr.toPlainObject();
      expect(plain[0]?.tags).toEqual(["a"]);
      expect(plain[1]?.tags).toEqual(["b"]);
      expect(Array.isArray(plain[0]?.tags)).toBe(true);
    });

    it("should work with PlainObject type annotation", () => {
      const arr = new ReactiveArray([{ tags: new Set(["a"]) }], {
        toPlainObject: (value) => {
          const toReturn = value.map((item) => ({
            tags: Array.from(item.tags),
          })) satisfies PlainObject;
          return toReturn;
        },
      });

      const plain = arr.toPlainObject();
      expect(plain[0]?.tags).toEqual(["a"]);
    });

    it("should maintain .get() returning original value", () => {
      const arr = new ReactiveArray([{ tags: new Set(["admin"]) }], {
        toPlainObject: (value) =>
          value.map((item) => ({
            tags: Array.from(item.tags),
          })) satisfies PlainObject,
      });

      const original = arr.get();
      expect(original[0]?.tags).toBeInstanceOf(Set);

      const plain = arr.toPlainObject();
      expect(plain[0]?.tags).toEqual(["admin"]);
      expect(Array.isArray(plain[0]?.tags)).toBe(true);
    });
  });

  describe("Immer error handling", () => {
    class TestClass {
      public value: number;

      constructor(value: number = 0) {
        this.value = value;
      }

      method() {
        return this.value;
      }
    }

    // Note: Immer may not fail when mutating class instances inside arrays
    // because it can create a draft of the array without needing to draft the classes.
    // The error handling is tested in ReactiveObject where Immer definitely fails
    // when trying to create a draft of a class instance directly.

    it("should not log error when useImmer is false", () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      const arr = new ReactiveArray([new TestClass(10), new TestClass(20)], {
        useImmer: false,
      });

      // Update without Immer (should work)
      arr.set((current) => {
        return current.map((item) => {
          const updated = new TestClass(item.value);
          if (updated.value === 10) {
            updated.value = 30;
          }
          return updated;
        });
      });

      expect(arr.get()[0]?.value).toBe(30);
      expect(arr.get()[1]?.value).toBe(20);
      // console.error should not have been called
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
