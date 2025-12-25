import { describe, expect, it, vi, afterEach } from "vitest";
import { createComputed } from "./create-computed";
import type { StatePort } from "./state-port";
import { SubscriptionsRegistry } from "./subscriptions-registry";
import { ReactiveValue } from "./reactive-value";
import { ViewModel } from "./view-model";

class TestViewModel extends ViewModel {}

describe("ComputedValue", () => {
  const owners: ViewModel[] = [];

  afterEach(() => {
    // Cleanup all ViewModels created during tests
    owners.forEach((owner) => {
      if (!owner.disposed) {
        owner[Symbol.dispose]();
      }
    });
    owners.length = 0;
  });
  it("memoizes results until dependencies change", () => {
    const dep = new ReactiveValue(1);
    const compute = vi.fn((value: number) => value * 2);
    const owner = new TestViewModel();
    owners.push(owner);

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
    const owner = new TestViewModel();
    owners.push(owner);
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
    const owner = new TestViewModel();
    owners.push(owner);

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
    const owner = new TestViewModel();
    owners.push(owner);

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
