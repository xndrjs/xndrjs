import { describe, expect, it, vi } from "vitest";
import { ReactiveValue } from "./reactive-value";

describe("ReactiveValue", () => {
  describe("Basic functionality", () => {
    it("should initialize with a value", () => {
      const value = new ReactiveValue(10);
      expect(value.get()).toBe(10);
    });

    it("should update value", () => {
      const value = new ReactiveValue(10);
      value.set(20);
      expect(value.get()).toBe(20);
    });

    it("should notify subscribers on value change", () => {
      const value = new ReactiveValue(10);
      const subscriber = vi.fn();

      value.subscribe(subscriber);
      expect(subscriber).not.toHaveBeenCalled();

      value.set(20);
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(20);
    });

    it("should not notify if value hasn't changed", () => {
      const value = new ReactiveValue(10);
      const subscriber = vi.fn();

      value.subscribe(subscriber);
      value.set(10); // Same value
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("should support multiple subscribers", () => {
      const value = new ReactiveValue(10);
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      value.subscribe(subscriber1);
      value.subscribe(subscriber2);

      value.set(20);

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
    });

    it("should allow unsubscribing", () => {
      const value = new ReactiveValue(10);
      const subscriber = vi.fn();

      const unsubscribe = value.subscribe(subscriber);
      unsubscribe();

      value.set(20);
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("notify() method", () => {
    it("should manually trigger notification", () => {
      const value = new ReactiveValue(10);
      const subscriber = vi.fn();

      value.subscribe(subscriber);
      value.notify();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(10);
    });
  });

  describe("Equality", () => {
    it("should use Object.is for primitive values", () => {
      const value = new ReactiveValue(10);
      const subscriber = vi.fn();

      value.subscribe(subscriber);
      value.set(10); // Same value, should not notify (Object.is)
      expect(subscriber).not.toHaveBeenCalled();

      value.set(20); // Different value, should notify
      expect(subscriber).toHaveBeenCalledTimes(1);

      value.set(20); // Different value, should notify
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should handle subscriber errors gracefully", () => {
      const value = new ReactiveValue(10);
      const errorSubscriber = vi.fn(() => {
        throw new Error("Subscriber error");
      });
      const goodSubscriber = vi.fn();

      // Silence console.error for this test since we're intentionally triggering an error
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        value.subscribe(errorSubscriber);
        value.subscribe(goodSubscriber);

        // Should not throw, and should still call other subscribers
        expect(() => {
          value.set(20);
        }).not.toThrow();

        expect(goodSubscriber).toHaveBeenCalledTimes(1);
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe("Complex types", () => {
    it("should reject objects (use ReactiveObject instead)", () => {
      // Silence console.error for this test since we're intentionally triggering an error
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        expect(() => {
          // Objects are rejected by ReactiveValue - use ReactiveObject instead
          // This test verifies the error is thrown
          new ReactiveValue({ a: 1, b: 2 });
        }).toThrow("ReactiveValue does not support objects");
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("should reject arrays (use ReactiveArray instead)", () => {
      // Silence console.error for this test since we're intentionally triggering an error
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        expect(() => {
          new ReactiveValue([1, 2, 3]);
        }).toThrow("ReactiveValue does not support arrays");
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });

    it("should work with null and undefined", () => {
      const value1 = new ReactiveValue<number | null>(null);
      const value2 = new ReactiveValue<number | undefined>(undefined);

      expect(value1.get()).toBeNull();
      expect(value2.get()).toBeUndefined();

      value1.set(10);
      value2.set(20);

      expect(value1.get()).toBe(10);
      expect(value2.get()).toBe(20);
    });
  });
});
