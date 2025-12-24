import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createComputed, type Disposable } from "@xndrjs/core";

// Helper to create a disposable owner for tests
function createTestOwner(): Disposable {
  return {
    [Symbol.dispose]() {},
  };
}
import { useCreateStatePort } from "./use-create-state-port";
import { useReactiveValue } from "./use-reactive-value";

describe("useReactiveValue", () => {
  describe("with StatePort", () => {
    it("should return the current value from a StatePort", () => {
      const { result } = renderHook(() => {
        const port = useCreateStatePort(42);
        return useReactiveValue(port);
      });

      expect(result.current).toBe(42);
    });

    it("should update when StatePort value changes", () => {
      const { result } = renderHook(() => {
        const port = useCreateStatePort(10);
        const value = useReactiveValue(port);
        return { port, value };
      });

      expect(result.current.value).toBe(10);

      act(() => {
        result.current.port.set(20);
      });

      expect(result.current.value).toBe(20);
    });

    it("should support updater functions", () => {
      const { result } = renderHook(() => {
        const port = useCreateStatePort(10);
        const value = useReactiveValue(port);
        return { port, value };
      });

      expect(result.current.value).toBe(10);

      act(() => {
        result.current.port.set((prev) => prev + 5);
      });

      expect(result.current.value).toBe(15);
    });

    it("should work with arrays", () => {
      const { result } = renderHook(() => {
        const port = useCreateStatePort([1, 2, 3]);
        const value = useReactiveValue(port);
        return { port, value };
      });

      expect(result.current.value).toEqual([1, 2, 3]);

      act(() => {
        result.current.port.set([4, 5, 6]);
      });

      expect(result.current.value).toEqual([4, 5, 6]);
    });
  });

  describe("with ComputedValue", () => {
    it("should return computed value from a ComputedValue", () => {
      const { result } = renderHook(() => {
        const aPort = useCreateStatePort(10);
        const bPort = useCreateStatePort(20);
        const owner = createTestOwner();

        const computed = createComputed(aPort, bPort)
          .as((aVal, bVal) => aVal + bVal)
          .for(owner);
        const value = useReactiveValue(computed);
        return { value, aPort, bPort };
      });

      expect(result.current.value).toBe(30);
    });

    it("should update when ComputedValue dependencies change", () => {
      const { result } = renderHook(() => {
        const aPort = useCreateStatePort(10);
        const bPort = useCreateStatePort(20);
        const owner = createTestOwner();
        const computed = createComputed(aPort, bPort)
          .as((aVal, bVal) => aVal + bVal)
          .for(owner);
        const value = useReactiveValue(computed);
        return { value, aPort, bPort };
      });

      expect(result.current.value).toBe(30);

      act(() => {
        result.current.aPort.set(15);
      });

      expect(result.current.value).toBe(35);
    });

    it("should handle ComputedValue with objects using shallow equality", () => {
      const { result } = renderHook(() => {
        const timeIntPort = useCreateStatePort(65); // 65 seconds
        const owner = createTestOwner();
        const computed = createComputed(timeIntPort)
          .as((timeInt) => {
            const hours = Math.floor(timeInt / 3600);
            const minutes = Math.floor((timeInt % 3600) / 60);
            const seconds = Math.floor(timeInt % 60);
            return { hours, minutes, seconds };
          })
          .for(owner);
        const value = useReactiveValue(computed);
        return { value, timeIntPort };
      });

      // Initial value: 65 seconds = 0h 1m 5s
      expect(result.current.value).toEqual({
        hours: 0,
        minutes: 1,
        seconds: 5,
      });

      // Change to 125 seconds = 0h 2m 5s (hours and minutes change)
      act(() => {
        result.current.timeIntPort.set(125);
      });

      expect(result.current.value).toEqual({
        hours: 0,
        minutes: 2,
        seconds: 5,
      });

      // Change to same time (different object reference but same values)
      // Should not cause infinite loop thanks to shallow equality
      act(() => {
        result.current.timeIntPort.set(125); // Same value
      });

      // Value should remain the same (shallow equality prevents unnecessary updates)
      expect(result.current.value).toEqual({
        hours: 0,
        minutes: 2,
        seconds: 5,
      });
    });

    it("should prevent infinite loops with object ComputedValue (same values, different references)", () => {
      const renderCount = vi.fn();
      const { result } = renderHook(() => {
        renderCount();
        const timeIntPort = useCreateStatePort(60);
        const owner = createTestOwner();
        const computed = createComputed(timeIntPort)
          .as((timeInt) => {
            // Always creates a new object, even with same values
            const hours = Math.floor(timeInt / 3600);
            const minutes = Math.floor((timeInt % 3600) / 60);
            const seconds = Math.floor(timeInt % 60);
            return { hours, minutes, seconds };
          })
          .for(owner);
        const value = useReactiveValue(computed);
        return { value, timeIntPort };
      });

      expect(result.current.value).toEqual({
        hours: 0,
        minutes: 1,
        seconds: 0,
      });

      act(() => {
        result.current.timeIntPort.set(60);
      });

      act(() => {
        result.current.timeIntPort.set(60);
      });

      act(() => {
        result.current.timeIntPort.set(60);
      });

      const finalRenderCount = renderCount.mock.calls.length;
      expect(finalRenderCount).toBeLessThan(10); // Reasonable upper bound
      expect(result.current.value).toEqual({
        hours: 0,
        minutes: 1,
        seconds: 0,
      });
    });

    it("should work with nested computed ports", async () => {
      const { result } = renderHook(() => {
        const aPort = useCreateStatePort(2);
        const bPort = useCreateStatePort(3);
        const owner = createTestOwner();
        const sumPort = createComputed(aPort, bPort)
          .as((a, b) => a + b)
          .for(owner);
        const doubledPort = createComputed(sumPort)
          .as((sum) => sum * 2)
          .for(owner);
        const value = useReactiveValue(doubledPort);
        return { value, aPort, bPort };
      });

      expect(result.current.value).toBe(10); // (2 + 3) * 2

      await act(async () => {
        result.current.aPort.set(5);
        // Wait for microtasks to execute (ComputedValue uses queueMicrotask for deduplication)
        await Promise.resolve();
      });

      expect(result.current.value).toBe(16); // (5 + 3) * 2
    });
  });

  describe("edge cases", () => {
    it("should handle null values", () => {
      const { result } = renderHook(() => {
        const port = useCreateStatePort<number | null>(null);
        return useReactiveValue(port);
      });

      expect(result.current).toBeNull();
    });

    it("should handle undefined values", () => {
      const { result } = renderHook(() => {
        const port = useCreateStatePort<number | undefined>(undefined);
        return useReactiveValue(port);
      });

      expect(result.current).toBeUndefined();
    });

    it("should handle empty objects", () => {
      const { result } = renderHook(() => {
        const port = useCreateStatePort({});
        const value = useReactiveValue(port);
        return { port, value };
      });

      expect(result.current.value).toEqual({});

      act(() => {
        result.current.port.set({});
      });

      // Should handle empty object updates
      expect(result.current.value).toEqual({});
    });
  });
});
