import { createEffect, createRoot } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import {
  ReactiveValue,
  SubscriptionsRegistry,
  createComputed,
} from "@xndrjs/core";
import type { Disposable } from "@xndrjs/core";
import { useReactiveValue } from "./useReactiveValue";

describe("useReactiveValue (Solid)", () => {
  it("subscribes to ReactiveValue and updates signal", async () => {
    let signal: (() => number) | null = null;
    let dispose: (() => void) | null = null;

    createRoot((rootDispose) => {
      dispose = rootDispose;
      const value = new ReactiveValue(1);
      signal = useReactiveValue(value);

      value.set(2);
    });

    await Promise.resolve(); // allow BatchContext flush

    expect(signal).not.toBeNull();
    expect(signal!()).toBe(2);
    dispose!();
  });

  it("works with ComputedValue via useReactiveValue", async () => {
    let signal: (() => number) | null = null;
    let dispose: (() => void) | null = null;

    createRoot((rootDispose) => {
      dispose = rootDispose;
      const source = new ReactiveValue(2);
      const owner: Disposable = {
        [Symbol.dispose]() {
          SubscriptionsRegistry.cleanup(this);
        },
      };
      const computed = createComputed(source)
        .as((v) => v * 3)
        .for(owner);

      signal = useReactiveValue(computed);
      source.set(4);
    });

    await Promise.resolve();

    expect(signal).not.toBeNull();
    expect(signal!()).toBe(12);
    dispose!();
  });

  it("stops updates after cleanup with computed", async () => {
    const spy = vi.fn();
    let dispose: (() => void) | null = null;
    let source: ReactiveValue<number> | null = null;

    createRoot((rootDispose) => {
      dispose = rootDispose;
      source = new ReactiveValue(1);
      const owner: Disposable = {
        [Symbol.dispose]() {
          SubscriptionsRegistry.cleanup(this);
        },
      };
      const computed = createComputed(source)
        .as((v) => v + 1)
        .for(owner);

      const signal = useReactiveValue(computed);

      createEffect(() => {
        spy(signal());
      });

      source.set(5);
    });

    await Promise.resolve();
    expect(spy).toHaveBeenLastCalledWith(6);

    dispose!(); // cleanup subscriptions

    source!.set(10);
    await Promise.resolve();
    expect(spy).toHaveBeenLastCalledWith(6); // no further updates
  });
});
