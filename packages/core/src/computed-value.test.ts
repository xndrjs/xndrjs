import { describe, expect, it, vi } from "vitest";
import type { Disposable } from "./disposable";
import { createComputed } from "./create-computed";
import type { StatePort } from "./state-port";
import { SubscriptionsRegistry } from "./subscriptions-registry";
import { ReactiveValue } from "./reactive-value";

describe("ComputedValue", () => {
  it("memoizes results until dependencies change", () => {
    const dep = new ReactiveValue(1);
    const compute = vi.fn((value: number) => value * 2);
    const owner: Disposable = { [Symbol.dispose]: vi.fn() };

    const computed = createComputed(dep).as(compute).for(owner);

    expect(compute).toHaveBeenCalledTimes(0);

    expect(computed.get()).toBe(2);
    expect(compute).toHaveBeenCalledTimes(1);

    // Should return cached value without re-running compute
    expect(computed.get()).toBe(2);
    expect(compute).toHaveBeenCalledTimes(1);

    dep.set(2);
    expect(computed.get()).toBe(4);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("notifies subscribers when dependencies change", async () => {
    const dep = new ReactiveValue(1);
    const owner: Disposable = { [Symbol.dispose]: vi.fn() };
    const computed = createComputed(dep)
      .as((value) => value * 3)
      .for(owner);

    const subscriber = vi.fn();
    const unsubscribe = computed.subscribe?.(subscriber);

    expect(subscriber).not.toHaveBeenCalled();

    dep.set(2);
    // Wait for microtask to execute
    await Promise.resolve();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(6);

    unsubscribe?.();
    dep.set(3);
    // Wait for microtask to execute
    await Promise.resolve();
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("exposes dependencies and enforces read-only semantics", () => {
    const dep = new ReactiveValue(5);
    const owner: Disposable = { [Symbol.dispose]: vi.fn() };

    const computed = createComputed(dep)
      .as((value) => value + 1)
      .for(owner);

    expect(computed.dependencies).toEqual([dep]);
    expect(() => computed.set(10 as unknown as never)).toThrow(
      "Computed values are read-only",
    );
  });

  it("registers dependency subscriptions for cleanup", () => {
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => unsubscribe);
    const dep: StatePort<number> = {
      get: () => 1,
      set: () => {},
      subscribe,
    };
    const owner: Disposable = { [Symbol.dispose]: vi.fn() };

    const registerSpy = vi.spyOn(SubscriptionsRegistry, "register");

    createComputed(dep)
      .as(() => 1)
      .for(owner);

    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(registerSpy).toHaveBeenCalledWith(owner, expect.any(Function));

    // Execute the registered cleanup and verify dependency unsubscribe is called
    const cleanup = registerSpy.mock.calls[0][1];
    cleanup();
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    registerSpy.mockRestore();
  });
});
