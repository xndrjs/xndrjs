import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import { useStatePort } from "./use-state-port";

describe("useStatePort", () => {
  it("should create a StatePort from useState", () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(10);
      return useStatePort(value, setValue);
    });

    expect(result.current.get()).toBe(10);
  });

  it("should allow setting values", () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(10);
      return useStatePort(value, setValue);
    });

    act(() => {
      result.current.set(20);
    });

    expect(result.current.get()).toBe(20);
  });

  it("should support updater functions", () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(10);
      return useStatePort(value, setValue);
    });

    act(() => {
      result.current.set((prev) => prev + 5);
    });

    expect(result.current.get()).toBe(15);
  });
});
