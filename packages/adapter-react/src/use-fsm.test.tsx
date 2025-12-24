/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFSM } from "./use-fsm";
import type { FSMContextManager } from "@xndrjs/fsm";
import type { StatePort } from "@xndrjs/core";

describe("useFSM", () => {
  let mockStatePort: StatePort<{ name: string; onEnter?: () => Promise<void> }>;
  let mockFSM: FSMContextManager<any, any>;
  let onEnterSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onEnterSpy = vi.fn(async () => {});
    mockStatePort = {
      get: () => ({ name: "initial", onEnter: onEnterSpy }),
      set: vi.fn(),
      subscribe: vi.fn(() => () => {}),
    };

    mockFSM = {
      initialize: vi.fn(async () => mockFSM),
      currentState: mockStatePort,
    } as unknown as FSMContextManager<any, any>;
  });

  it("should call initialize() when component mounts", async () => {
    renderHook(() => {
      useFSM(mockFSM);
    });

    // Wait for async initialize to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockFSM.initialize).toHaveBeenCalledTimes(1);
  });

  it("should handle null fsm gracefully", () => {
    renderHook(() => {
      useFSM(null);
    });

    // Should not throw
    expect(true).toBe(true);
  });

  it("should handle undefined fsm gracefully", () => {
    renderHook(() => {
      useFSM(undefined);
    });

    // Should not throw
    expect(true).toBe(true);
  });

  it("should call initialize() multiple times safely (idempotent)", async () => {
    const { rerender } = renderHook(
      ({ fsm }) => {
        useFSM(fsm);
      },
      {
        initialProps: { fsm: mockFSM },
      },
    );

    // Wait for async initialize
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Rerender with same instance
    rerender({ fsm: mockFSM });

    // Wait again
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Initialize should be called multiple times (idempotent, so safe)
    expect(mockFSM.initialize).toHaveBeenCalled();
  });

  it("should re-initialize when fsm instance changes", async () => {
    const mockFSM2 = {
      initialize: vi.fn(async () => mockFSM2),
      currentState: mockStatePort,
    } as unknown as FSMContextManager<any, any>;

    const { rerender } = renderHook(
      ({ fsm }) => {
        useFSM(fsm);
      },
      {
        initialProps: { fsm: mockFSM },
      },
    );

    // Wait for async initialize
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockFSM.initialize).toHaveBeenCalledTimes(1);
    expect(mockFSM2.initialize).not.toHaveBeenCalled();

    // Change to different instance
    rerender({ fsm: mockFSM2 });

    // Wait for async initialize
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockFSM2.initialize).toHaveBeenCalledTimes(1);
  });
});
