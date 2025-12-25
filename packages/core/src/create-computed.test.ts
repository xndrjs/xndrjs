import { describe, expect, it, vi, afterEach } from "vitest";
import { createComputed } from "./create-computed";
import type { StatePort } from "./state-port";
import { SubscriptionsRegistry } from "./subscriptions-registry";
import { ReactiveValue } from "./reactive-value";
import { ViewModel } from "./view-model";

class TestViewModel extends ViewModel {}

describe("createComputed", () => {
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
  it("computes lazily and memoizes until dependencies change", () => {
    const dep = new ReactiveValue(1);
    const compute = vi.fn((value: number) => value * 2);
    const owner = new TestViewModel();
    owners.push(owner);

    const computed = createComputed(dep).as(compute).for(owner);

    expect(compute).not.toHaveBeenCalled();

    expect(computed.get()).toBe(2);
    expect(compute).toHaveBeenCalledTimes(1);

    // No recompute when dependency has not changed
    expect(computed.get()).toBe(2);
    expect(compute).toHaveBeenCalledTimes(1);

    dep.set(3);
    expect(computed.get()).toBe(6);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("supports multiple dependencies and recomputes when any changes", () => {
    const a = new ReactiveValue(2);
    const b = new ReactiveValue(3);
    const owner = new TestViewModel();
    owners.push(owner);

    const compute = vi.fn((x: number, y: number) => x + y);
    const computed = createComputed(a, b).as(compute).for(owner);

    expect(computed.get()).toBe(5);
    expect(compute).toHaveBeenCalledTimes(1);

    a.set(5);
    expect(computed.get()).toBe(8);
    expect(compute).toHaveBeenCalledTimes(2);

    b.set(10);
    expect(computed.get()).toBe(15);
    expect(compute).toHaveBeenCalledTimes(3);
  });

  it("notifies subscribers on dependency changes and supports unsubscribe", async () => {
    const dep = new ReactiveValue(1);
    const owner = new TestViewModel();
    owners.push(owner);
    const computed = createComputed(dep)
      .as((value) => value + 1)
      .for(owner);

    const subscriber = vi.fn();
    const unsubscribe = computed.subscribe?.(subscriber);

    dep.set(2);
    // Wait for microtask to execute
    await Promise.resolve();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(3);

    unsubscribe?.();
    dep.set(3);
    // Wait for microtask to execute
    await Promise.resolve();
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("deduplicates notifications when multiple dependencies change in the same tick", async () => {
    const a = new ReactiveValue(1);
    const b = new ReactiveValue(2);
    const owner = new TestViewModel();
    owners.push(owner);
    const computed = createComputed(a, b)
      .as((x: number, y: number) => x + y)
      .for(owner);

    const subscriber = vi.fn();
    computed.subscribe?.(subscriber);

    // Clear subscriber calls (subscribe doesn't call immediately)
    subscriber.mockClear();

    // Change both dependencies in the same tick
    // Both should trigger notify(), but queueMicrotask deduplicates to a single notification
    a.set(10);
    b.set(20);
    // Should only trigger one notification (deduplicated via queueMicrotask)
    // even though both dependencies changed
    await Promise.resolve();
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(30);
  });

  it("exposes dependencies and enforces read-only setter", () => {
    const dep = new ReactiveValue(7);
    const owner = new TestViewModel();
    owners.push(owner);

    const computed = createComputed(dep)
      .as((value) => value * value)
      .for(owner);

    expect(computed.dependencies).toEqual([dep]);
    expect(() => computed.set(0 as never)).toThrow(
      "Computed values are read-only",
    );
  });

  it("registers cleanup that unsubscribes dependencies", () => {
    const unsubscribeA = vi.fn();
    const unsubscribeB = vi.fn();
    const depA: StatePort<number> = {
      get: () => 1,
      set: () => {},
      subscribe: vi.fn(() => unsubscribeA),
    };
    const depB: StatePort<number> = {
      get: () => 2,
      set: () => {},
      subscribe: vi.fn(() => unsubscribeB),
    };
    const owner = new TestViewModel();
    owners.push(owner);

    const registerSpy = vi.spyOn(SubscriptionsRegistry, "register");

    createComputed(depA, depB)
      .as((a, b) => a + b)
      .for(owner);

    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(registerSpy).toHaveBeenCalledWith(owner, expect.any(Function));

    // Cleanup via ViewModel dispose
    owner[Symbol.dispose]();

    expect(unsubscribeA).toHaveBeenCalledTimes(1);
    expect(unsubscribeB).toHaveBeenCalledTimes(1);

    registerSpy.mockRestore();
  });
});
