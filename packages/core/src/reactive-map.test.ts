import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { enableMapSet } from "immer";
import { ReactiveMap } from "./reactive-map";
import { PlainObject } from "./plain-object";

describe("ReactiveMap", () => {
  // Enable Immer plugins for Set and Map support BEFORE any tests
  enableMapSet();
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic functionality", () => {
    it("should initialize with a map", () => {
      const map = new ReactiveMap(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      );
      expect(map.get().get("key1")).toBe("value1");
      expect(map.get().get("key2")).toBe("value2");
    });

    it("should initialize with empty map", () => {
      const map = new ReactiveMap<string, number>(new Map());
      expect(map.get().size).toBe(0);
    });

    it("should update value", () => {
      const map = new ReactiveMap(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      );
      map.set(new Map([["key3", "value3"]]));
      expect(map.get().get("key3")).toBe("value3");
      expect(map.get().has("key1")).toBe(false);
    });

    it("should notify subscribers on value change", () => {
      const map = new ReactiveMap(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      );
      const subscriber = vi.fn();

      map.subscribe(subscriber);
      expect(subscriber).not.toHaveBeenCalled();

      map.set(new Map([["key3", "value3"]]));
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(expect.any(Map));
      const callArgs = subscriber.mock.calls[0];
      if (callArgs) {
        const [newValue] = callArgs;
        expect(newValue.get("key3")).toBe("value3");
      }
    });

    it("should not notify if value hasn't changed", () => {
      const map = new ReactiveMap(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      );
      const subscriber = vi.fn();

      map.subscribe(subscriber);
      map.set(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      ); // Same value
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should reject non-map values", () => {
      expect(() => {
        // @ts-expect-error testing runtime validation
        new ReactiveMap("not a map");
      }).toThrow("ReactiveMap requires a Map");
    });
  });

  describe("update() method", () => {
    it("should update map using Immer producer", () => {
      const map = new ReactiveMap(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      );
      const subscriber = vi.fn();

      map.subscribe(subscriber);
      map.set((draft) => {
        draft.set("key3", "value3");
        draft.delete("key1");
        return draft;
      });

      expect(map.get().get("key2")).toBe("value2");
      expect(map.get().get("key3")).toBe("value3");
      expect(map.get().has("key1")).toBe(false);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should not notify if producer makes no changes", () => {
      const map = new ReactiveMap(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      );
      const subscriber = vi.fn();

      map.subscribe(subscriber);
      map.set((draft) => {
        return draft;
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("toPlainObject", () => {
    it("should return default conversion (Map to object) when toPlainObject is not configured", () => {
      const map = new ReactiveMap(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
      );
      const plain = map.toPlainObject();
      expect(plain).toEqual({ key1: "value1", key2: "value2" });
      expect(plain).not.toBeInstanceOf(Map);
    });

    it("should return converted value when toPlainObject is configured", () => {
      const map = new ReactiveMap<string, string, { [key: string]: string }>(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ]),
        {
          toPlainObject: (value) => {
            const result: { [key: string]: string } = {};
            for (const [key, val] of value) {
              result[`prefix_${key}`] = `prefix_${val}`;
            }
            return result;
          },
        },
      );

      const original = map.get();
      expect(original).toBeInstanceOf(Map);

      const plain = map.toPlainObject();
      expect(plain).toEqual({
        prefix_key1: "prefix_value1",
        prefix_key2: "prefix_value2",
      });
      expect(plain).not.toBeInstanceOf(Map);
    });

    it("should work with PlainObject type annotation", () => {
      const map = new ReactiveMap<string, number, Record<string, number>>(
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
        {
          toPlainObject: (value) => {
            const toReturn = Object.fromEntries(value) satisfies PlainObject;
            return toReturn;
          },
        },
      );

      const plain = map.toPlainObject();
      expect(plain).toEqual({ a: 1, b: 2 });
    });

    it("should maintain .get() returning original Map", () => {
      const map = new ReactiveMap<string, string, Record<string, string>>(
        new Map([["key1", "value1"]]),
        {
          toPlainObject: (value) => Object.fromEntries(value),
        },
      );

      const original = map.get();
      expect(original).toBeInstanceOf(Map);
      expect(original.get("key1")).toBe("value1");

      const plain = map.toPlainObject();
      expect(plain).toEqual({ key1: "value1" });
      expect(plain).not.toBeInstanceOf(Map);
    });
  });
});
