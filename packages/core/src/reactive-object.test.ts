import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ReactiveObject } from "./reactive-object";
import { type PlainObject } from "./plain-object";

describe("ReactiveObject", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic functionality", () => {
    it("should initialize with nullable type", () => {
      const obj = new ReactiveObject<{ count: number } | null>(null);
      expect(obj.get()).toBeNull();
    });

    it("should initialize with values", () => {
      const obj = new ReactiveObject({
        count: 10,
        name: "John",
      });

      expect(obj.get().count).toBe(10);
      expect(obj.get().name).toBe("John");
    });

    it("should update value", () => {
      const obj = new ReactiveObject({
        count: 10,
        name: "John",
      });

      obj.set({ count: 20, name: "Jane" });

      expect(obj.get().count).toBe(20);
      expect(obj.get().name).toBe("Jane");
    });

    it("should notify subscribers on change", () => {
      const obj = new ReactiveObject({
        count: 10,
        name: "John",
      });
      const subscriber = vi.fn();

      obj.subscribe(subscriber);
      expect(subscriber).not.toHaveBeenCalled();

      obj.set({ count: 20, name: "John" });
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith({ count: 20, name: "John" });
    });

    it("should not notify if value hasn't changed", () => {
      const obj = new ReactiveObject({
        count: 10,
        name: "John",
      });
      const subscriber = vi.fn();

      obj.subscribe(subscriber);
      obj.set({ count: 10, name: "John" }); // Same value
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("set() method with callback", () => {
    it("should update object using Immer producer", () => {
      const obj = new ReactiveObject({
        count: 10,
        name: "John",
      });
      const subscriber = vi.fn();

      obj.subscribe(subscriber);

      obj.set((draft) => {
        draft.count = 20;
        draft.name = "Jane";
      });

      expect(obj.get()?.count).toBe(20);
      expect(obj.get()?.name).toBe("Jane");
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should handle nested updates", () => {
      const obj = new ReactiveObject({
        user: { name: "John", age: 30 },
      });

      obj.set((draft) => {
        draft.user.name = "Jane";
        draft.user.age = 25;
      });

      expect(obj.get()?.user.name).toBe("Jane");
      expect(obj.get()?.user.age).toBe(25);
    });

    it("should not notify if producer makes no changes", () => {
      const obj = new ReactiveObject({
        count: 10,
        name: "John",
      });
      const subscriber = vi.fn();

      obj.subscribe(subscriber);
      obj.set((_draft) => {
        // No changes
      });

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should work with nullable type", () => {
      const obj = new ReactiveObject<{ name: string } | null>(null);
      expect(obj.get()).toBeNull();

      obj.set((draft) => {
        if (draft === null) {
          return { name: "John" };
        }
        return draft;
      });

      expect(obj.get()).toEqual({ name: "John" });

      obj.set((draft) => {
        if (draft) {
          draft.name = "Jane";
        }
        return draft;
      });

      expect(obj.get()).toEqual({ name: "Jane" });
    });
  });

  describe("Complex types", () => {
    it("should work with nested objects", () => {
      const obj = new ReactiveObject({
        user: { name: "John", age: 30, profile: { theme: "light" } },
      });

      obj.set((draft) => {
        draft.user.name = "Jane";
        draft.user.profile = { theme: "dark" };
      });

      expect(obj.get()?.user.name).toBe("Jane");
      expect(obj.get()?.user.profile.theme).toBe("dark");
    });

    it("should work with arrays in object", () => {
      const obj = new ReactiveObject({
        items: [1, 2, 3],
      });

      obj.set((draft) => {
        if (draft && draft.items) {
          draft.items.push(4);
        }
      });

      expect(obj.get()?.items).toEqual([1, 2, 3, 4]);
    });

    it("should reject Set values when using fast-deep-equal", () => {
      // Silence console.error for this test since we're intentionally triggering an error
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        expect(() => {
          new ReactiveObject({ tags: new Set(["a", "b"]) });
        }).toThrow(
          /ReactiveObject does not support Set.*when using fast-deep-equal/,
        );
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("should reject Map values when using fast-deep-equal", () => {
      // Silence console.error for this test since we're intentionally triggering an error
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        expect(() => {
          new ReactiveObject({ cache: new Map([["key", "value"]]) });
        }).toThrow(
          /ReactiveObject does not support Map.*when using fast-deep-equal/,
        );
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("should allow Set values with custom equality function", () => {
      const obj = new ReactiveObject(
        { tags: new Set(["a", "b"]) },
        {
          compare: {
            equals: (a, b) => {
              // Custom equality that handles Set
              if (a && b && typeof a === "object" && typeof b === "object") {
                if (a.tags instanceof Set && b.tags instanceof Set) {
                  return (
                    a.tags.size === b.tags.size &&
                    Array.from(a.tags).every((item) => b.tags.has(item))
                  );
                }
              }
              return false;
            },
          },
        },
      );

      expect(obj.get()?.tags).toBeInstanceOf(Set);
      expect(obj.get()?.tags.has("a")).toBe(true);
    });

    it("should allow Map values with custom equality function", () => {
      const obj = new ReactiveObject(
        { cache: new Map([["key", "value"]]) },
        {
          compare: {
            equals: (a, b) => {
              // Custom equality that handles Map
              if (a && b && typeof a === "object" && typeof b === "object") {
                if (a.cache instanceof Map && b.cache instanceof Map) {
                  return (
                    a.cache.size === b.cache.size &&
                    Array.from(a.cache.entries()).every(
                      ([key, value]) => b.cache.get(key) === value,
                    )
                  );
                }
              }
              return false;
            },
          },
        },
      );

      expect(obj.get()?.cache).toBeInstanceOf(Map);
      expect(obj.get()?.cache.get("key")).toBe("value");
    });

    it("should allow Set/Map with shallow equality (deepEquals: false)", () => {
      const obj = new ReactiveObject(
        { tags: new Set(["a", "b"]), cache: new Map([["key", "value"]]) },
        {
          compare: { deepEquals: false },
        },
      );

      expect(obj.get()?.tags).toBeInstanceOf(Set);
      expect(obj.get()?.cache).toBeInstanceOf(Map);
    });

    it("should support Date objects in properties", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-02");
      const obj = new ReactiveObject({
        createdAt: date1,
        updatedAt: date1,
      });

      expect(obj.get()?.createdAt).toBe(date1);
      expect(obj.get()?.updatedAt).toBe(date1);

      const subscriber = vi.fn();
      obj.subscribe(subscriber);

      obj.set((draft) => {
        if (draft) {
          draft.updatedAt = date2;
        }
      });

      expect(obj.get()?.updatedAt).toBe(date2);
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should detect Date changes using deep equality", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-02");
      const obj = new ReactiveObject({
        date: date1,
      });

      const subscriber = vi.fn();
      obj.subscribe(subscriber);

      obj.set({ date: date2 });
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Same timestamp should not trigger notification
      const date3 = new Date("2024-01-02");
      obj.set({ date: date3 });
      // fast-deep-equal compares Date by timestamp, so this should not notify
      // (date2 and date3 have same timestamp)
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it("should support nested Date objects", () => {
      const date = new Date("2024-01-01");
      const obj = new ReactiveObject({
        user: {
          profile: {
            createdAt: date,
          },
        },
      });

      expect(obj.get()?.user.profile.createdAt).toBe(date);
    });

    it("should maintain Date support - regression test", () => {
      // This test ensures Date support is never accidentally removed
      const date1 = new Date("2024-01-01T00:00:00Z");
      const date2 = new Date("2024-01-02T00:00:00Z");

      const obj = new ReactiveObject({
        createdAt: date1,
        updatedAt: date1,
      });

      const subscriber = vi.fn();
      obj.subscribe(subscriber);

      // Update with new Date instance (same timestamp)
      const date3 = new Date("2024-01-01T00:00:00Z");
      obj.set({ ...obj.get(), updatedAt: date3 });

      // Should not notify because timestamps are equal (deep equality)
      expect(subscriber).not.toHaveBeenCalled();

      // Update with different timestamp
      obj.set({ ...obj.get(), updatedAt: date2 });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("toPlainObject", () => {
    it("should return original value when toPlainObject is not configured", () => {
      const obj = new ReactiveObject({ count: 10, name: "John" });
      const plain = obj.toPlainObject();
      expect(plain).toEqual({ count: 10, name: "John" });
      expect(plain).toBe(obj.get()); // Same reference
    });

    it("should return converted value when toPlainObject is configured", () => {
      const obj = new ReactiveObject<
        { tags: Set<string>; metadata: Map<string, string> },
        { tags: string[]; metadata: Record<string, string> }
      >(
        {
          tags: new Set(["admin", "user"]),
          metadata: new Map([["key1", "value1"]]),
        },
        {
          compare: { equals: () => false }, // Custom equality to allow Set/Map
          toPlainObject: (value) => ({
            tags: Array.from(value.tags),
            metadata: Object.fromEntries(value.metadata),
          }),
        },
      );

      const original = obj.get();
      expect(original.tags).toBeInstanceOf(Set);
      expect(original.metadata).toBeInstanceOf(Map);

      const plain = obj.toPlainObject();
      expect(plain.tags).toEqual(["admin", "user"]);
      expect(plain.metadata).toEqual({ key1: "value1" });
      expect(Array.isArray(plain.tags)).toBe(true);
      expect(plain.metadata).not.toBeInstanceOf(Map);
    });

    it("should work with PlainObject type annotation", () => {
      const obj = new ReactiveObject<{ tags: Set<string> }, { tags: string[] }>(
        { tags: new Set(["a", "b"]) },
        {
          compare: { equals: () => false }, // Custom equality to allow Set/Map
          toPlainObject: (value) => {
            const toReturn = {
              tags: Array.from(value.tags),
            } satisfies PlainObject;
            return toReturn;
          },
        },
      );

      const plain = obj.toPlainObject();
      expect(plain.tags).toEqual(["a", "b"]);
    });

    it("should maintain .get() returning original value", () => {
      const obj = new ReactiveObject<{ tags: Set<string> }, { tags: string[] }>(
        { tags: new Set(["admin"]) },
        {
          compare: { equals: () => false }, // Custom equality to allow Set/Map
          toPlainObject: (value) => ({
            tags: Array.from(value.tags),
          }),
        },
      );

      const original = obj.get();
      expect(original.tags).toBeInstanceOf(Set);
      expect(Array.from(original.tags)).toEqual(["admin"]);

      const plain = obj.toPlainObject();
      expect(plain.tags).toEqual(["admin"]);
      expect(Array.isArray(plain.tags)).toBe(true);
    });

    it("should work with nullable objects", () => {
      const obj = new ReactiveObject<
        { count: number } | null,
        { count: number } | null
      >(null, {
        toPlainObject: (value) => value,
      });

      expect(obj.toPlainObject()).toBeNull();
      expect(obj.get()).toBeNull();
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

    it("should detect and log Immer non-draftable error, then propagate it", () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      const obj = new ReactiveObject(new TestClass(10));

      // Try to update with Immer (will fail because TestClass is not draftable)
      expect(() => {
        obj.set((draft) => {
          draft.value = 20;
        });
      }).toThrow();

      // Verify console.error was called with the correct message
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const errorCall = consoleErrorSpy.mock.calls[0];
      expect(errorCall?.[0]).toContain("[ReactiveObject]");
      expect(errorCall?.[0]).toContain("Immer cannot handle this value type");
      expect(errorCall?.[0]).toContain("useImmer: false");
      expect(errorCall?.[0]).toContain("convert the class to a plain object");
      expect(errorCall?.[1]).toBeInstanceOf(Error);
    });

    it("should not log error when useImmer is false", () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      const obj = new ReactiveObject(new TestClass(10), {
        useImmer: false,
      });

      // Update without Immer (should work)
      obj.set((current) => {
        const updated = new TestClass(current.value);
        updated.value = 20;
        return updated;
      });

      expect(obj.get().value).toBe(20);
      // console.error should not have been called
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
