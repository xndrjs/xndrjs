import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { enableMapSet } from "immer";
import { ReactiveSet } from "./reactive-set";
import { PlainObject } from "./plain-object";

// Enable Immer plugins for Set and Map support
enableMapSet();

describe("ReactiveSet", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic functionality", () => {
    it("should initialize with a set", () => {
      const set = new ReactiveSet(new Set([1, 2, 3]));
      expect(Array.from(set.get())).toEqual([1, 2, 3]);
    });

    it("should initialize with empty set", () => {
      const set = new ReactiveSet<number>(new Set());
      expect(set.get().size).toBe(0);
    });

    it("should update value", () => {
      const set = new ReactiveSet(new Set([1, 2, 3]));
      set.set(new Set([4, 5, 6]));
      expect(Array.from(set.get())).toEqual([4, 5, 6]);
    });

    it("should notify subscribers on value change", () => {
      const set = new ReactiveSet(new Set([1, 2, 3]));
      const subscriber = vi.fn();

      set.subscribe(subscriber);
      expect(subscriber).not.toHaveBeenCalled();

      set.set(new Set([4, 5, 6]));
      expect(subscriber).toHaveBeenCalledTimes(1);
      const callArgs = subscriber.mock.calls[0];
      if (callArgs) {
        const [newValue] = callArgs;
        expect(Array.from(newValue)).toEqual([4, 5, 6]);
      }
    });

    it("should not notify if value hasn't changed", () => {
      const set = new ReactiveSet(new Set([1, 2, 3]));
      const subscriber = vi.fn();

      set.subscribe(subscriber);
      set.set(new Set([1, 2, 3])); // Same value
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should reject non-set values", () => {
      expect(() => {
        // @ts-expect-error testing runtime validation
        new ReactiveSet("not a set");
      }).toThrow("ReactiveSet requires a Set");
    });
  });

  describe("update() method", () => {
    it("should update set using Immer producer", () => {
      const set = new ReactiveSet(new Set([1, 2, 3]));
      const subscriber = vi.fn();

      set.subscribe(subscriber);
      set.set((draft) => {
        draft.add(4);
        draft.delete(2);
      });

      expect(Array.from(set.get())).toEqual([1, 3, 4]);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should not notify if producer makes no changes", () => {
      const set = new ReactiveSet(new Set([1, 2, 3]));
      const subscriber = vi.fn();

      set.subscribe(subscriber);
      set.set((_draft) => {
        // No changes
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("toPlainObject", () => {
    it("should return default conversion (Set to array) when toPlainObject is not configured", () => {
      const set = new ReactiveSet(new Set([1, 2, 3]));
      const plain = set.toPlainObject();
      expect(plain).toEqual([1, 2, 3]);
      expect(Array.isArray(plain)).toBe(true);
      expect(plain).not.toBeInstanceOf(Set);
    });

    it("should return converted value when toPlainObject is configured", () => {
      const set = new ReactiveSet<number, number[]>(new Set([1, 2, 3]), {
        toPlainObject: (value) => {
          return Array.from(value).map((n) => n * 2);
        },
      });

      const original = set.get();
      expect(original).toBeInstanceOf(Set);

      const plain = set.toPlainObject();
      expect(plain).toEqual([2, 4, 6]);
      expect(Array.isArray(plain)).toBe(true);
      expect(plain).not.toBeInstanceOf(Set);
    });

    it("should work with PlainObject type annotation", () => {
      const set = new ReactiveSet<string, string[]>(new Set(["a", "b"]), {
        toPlainObject: (value) => {
          const toReturn = Array.from(value) satisfies PlainObject;
          return toReturn;
        },
      });

      const plain = set.toPlainObject();
      expect(plain).toEqual(["a", "b"]);
    });

    it("should maintain .get() returning original Set", () => {
      const set = new ReactiveSet<number, number[]>(new Set([1, 2, 3]), {
        toPlainObject: (value) => Array.from(value),
      });

      const original = set.get();
      expect(original).toBeInstanceOf(Set);
      expect(Array.from(original)).toEqual([1, 2, 3]);

      const plain = set.toPlainObject();
      expect(plain).toEqual([1, 2, 3]);
      expect(Array.isArray(plain)).toBe(true);
      expect(plain).not.toBeInstanceOf(Set);
    });
  });
});
