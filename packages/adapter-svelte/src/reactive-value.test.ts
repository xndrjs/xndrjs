import { describe, expect, it, vi } from "vitest";
import { ReactiveValue, createComputed, ViewModel } from "@xndrjs/core";
import { reactiveValue } from "./reactive-value.svelte";

class TestViewModel extends ViewModel {}

describe("reactiveValue (Svelte)", () => {
  it("subscribes to ReactiveValue and updates store", () => {
    const value = new ReactiveValue(1);
    const store = reactiveValue(() => value);

    const spy = vi.fn();
    const unsubscribe = store.subscribe(spy);

    expect(spy).toHaveBeenCalledWith(1);

    value.set(2);
    expect(spy).toHaveBeenCalledWith(2);

    unsubscribe();
    value.set(3);
    expect(spy).not.toHaveBeenCalledWith(3);
  });

  it("works with ComputedValue via reactiveValue", () => {
    const source = new ReactiveValue(2);
    const owner = new TestViewModel();
    const computed = createComputed(source)
      .as((v) => v * 3)
      .for(owner);

    const store = reactiveValue(() => computed);
    const spy = vi.fn();
    const unsubscribe = store.subscribe(spy);

    expect(spy).toHaveBeenCalledWith(6);

    source.set(4);
    expect(spy).toHaveBeenCalledWith(12);

    unsubscribe();
    owner[Symbol.dispose]();
  });

  it("stops updates after unsubscribe with computed", () => {
    const source = new ReactiveValue(1);
    const owner = new TestViewModel();
    const computed = createComputed(source)
      .as((v) => v + 1)
      .for(owner);

    const store = reactiveValue(() => computed);
    const spy = vi.fn();
    const unsubscribe = store.subscribe(spy);

    source.set(5);
    expect(spy).toHaveBeenLastCalledWith(6);

    unsubscribe();
    source.set(10);
    expect(spy).toHaveBeenLastCalledWith(6); // no further updates

    owner[Symbol.dispose]();
  });

  it("allows setting value on writable StatePort", () => {
    const value = new ReactiveValue(1);
    const store = reactiveValue(() => value);

    store.set(5);
    expect(value.get()).toBe(5);

    const spy = vi.fn();
    const unsubscribe = store.subscribe(spy);
    expect(spy).toHaveBeenCalledWith(5);

    store.update((v) => v * 2);
    expect(value.get()).toBe(10);
    expect(spy).toHaveBeenCalledWith(10);

    unsubscribe();
  });
});
