/**
 * Tests for ReactiveValueMonitor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ReactiveValue } from "@xndrjs/core";
import {
  monitorReactiveValue,
  unmonitorReactiveValue,
  isReactiveValueMonitored,
  getReactiveValueInstanceId,
} from "./reactive-value-monitor";
import { getDevToolsHook } from "../core/hook";
import { getDevToolsStore } from "../core/store";
import { DevToolsEventType } from "../core/types";
import { initDevTools } from "../init";

describe("ReactiveValueMonitor", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Silence console logs
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Initialize DevTools before each test
    initDevTools();
    getDevToolsStore().clear();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  afterEach(() => {
    getDevToolsStore().clear();
  });

  describe("monitorReactiveValue", () => {
    it("should register a ReactiveValue instance", () => {
      const value = new ReactiveValue(10);
      const instanceId = monitorReactiveValue(value, { name: "TestValue" });

      expect(instanceId).toBeTruthy();
      expect(isReactiveValueMonitored(value)).toBe(true);
    });

    it("should return the same instance ID if already monitored", () => {
      const value = new ReactiveValue(10);
      const instanceId1 = monitorReactiveValue(value, { name: "TestValue" });
      const instanceId2 = monitorReactiveValue(value, { name: "TestValue" });

      expect(instanceId1).toBe(instanceId2);
    });

    it("should emit REACTIVE_VALUE_CHANGE events when value changes", () => {
      const value = new ReactiveValue(10);
      const instanceId = monitorReactiveValue(value, { name: "TestValue" });

      const hook = getDevToolsHook();
      const events: Array<{
        instanceId: string;
        data: { newValue: number; prevValue: number };
      }> = [];
      const unsubscribe = hook.on(
        DevToolsEventType.REACTIVE_VALUE_CHANGE,
        (event) => {
          events.push(event);
        },
      );

      value.set(20);

      expect(events.length).toBe(1);
      expect(events[0]!.instanceId).toBe(instanceId);
      expect(events[0]!.data.newValue).toBe(20);
      expect(events[0]!.data.prevValue).toBe(10);

      unsubscribe();
    });

    it("should emit REACTIVE_VALUE_SUBSCRIBE event with DevTools flag", () => {
      const value = new ReactiveValue(10);
      const instanceId = monitorReactiveValue(value, { name: "TestValue" });

      const hook = getDevToolsHook();
      const events: Array<{
        instanceId: string;
        data: { isDevToolsSubscription?: boolean };
      }> = [];
      const unsubscribe = hook.on(
        DevToolsEventType.REACTIVE_VALUE_SUBSCRIBE,
        (event) => {
          events.push(event);
        },
      );

      // Trigger another subscription to see the event
      const unsubscribe2 = value.subscribe(() => {});

      // The initial subscribe event should have been emitted
      const timeline = getDevToolsStore().getTimeline();
      const subscribeEvents = timeline.filter(
        (e) =>
          e.eventType === DevToolsEventType.REACTIVE_VALUE_SUBSCRIBE &&
          e.instanceId === instanceId,
      );

      expect(subscribeEvents.length).toBeGreaterThan(0);
      const subscribeEvent = subscribeEvents[0]!;
      expect(subscribeEvent.data.isDevToolsSubscription).toBe(true);

      unsubscribe();
      unsubscribe2();
    });

    it("should include metadata when provided", () => {
      const value = new ReactiveValue(10);
      const metadata = { version: "1.0", source: "test" };
      const instanceId = monitorReactiveValue(value, {
        name: "TestValue",
        metadata,
      });

      const instance = getDevToolsHook().getInstance(instanceId);
      expect(instance?.metadata).toEqual(metadata);
    });
  });

  describe("unmonitorReactiveValue", () => {
    it("should unregister a monitored ReactiveValue", () => {
      const value = new ReactiveValue(10);
      const instanceId = monitorReactiveValue(value, { name: "TestValue" });

      expect(isReactiveValueMonitored(value)).toBe(true);

      unmonitorReactiveValue(value);

      expect(isReactiveValueMonitored(value)).toBe(false);
      expect(getDevToolsHook().getInstance(instanceId)).toBeUndefined();
    });

    it("should unsubscribe from value changes", () => {
      const value = new ReactiveValue(10);
      monitorReactiveValue(value, { name: "TestValue" });

      const hook = getDevToolsHook();
      const events: Array<{
        instanceId: string;
        data: { newValue: number; prevValue: number };
      }> = [];
      const unsubscribe = hook.on(
        DevToolsEventType.REACTIVE_VALUE_CHANGE,
        (event) => {
          events.push(event);
        },
      );

      // Change value before unmonitor
      value.set(20);
      expect(events.length).toBe(1);

      // Unmonitor
      unmonitorReactiveValue(value);

      // Change value after unmonitor
      value.set(30);
      expect(events.length).toBe(1); // Should not increase

      unsubscribe();
    });

    it("should emit REACTIVE_VALUE_UNSUBSCRIBE event", () => {
      const value = new ReactiveValue(10);
      const instanceId = monitorReactiveValue(value, { name: "TestValue" });

      unmonitorReactiveValue(value);

      const timeline = getDevToolsStore().getTimeline();
      const unsubscribeEvents = timeline.filter(
        (e) =>
          e.eventType === DevToolsEventType.REACTIVE_VALUE_UNSUBSCRIBE &&
          e.instanceId === instanceId,
      );

      expect(unsubscribeEvents.length).toBeGreaterThan(0);
      expect(unsubscribeEvents[0]!.data.isDevToolsSubscription).toBe(true);
    });

    it("should do nothing if value is not monitored", () => {
      const value = new ReactiveValue(10);

      expect(() => unmonitorReactiveValue(value)).not.toThrow();
    });
  });

  describe("isReactiveValueMonitored", () => {
    it("should return true for monitored values", () => {
      const value = new ReactiveValue(10);
      monitorReactiveValue(value, { name: "TestValue" });

      expect(isReactiveValueMonitored(value)).toBe(true);
    });

    it("should return false for unmonitored values", () => {
      const value = new ReactiveValue(10);

      expect(isReactiveValueMonitored(value)).toBe(false);
    });

    it("should return false after unmonitoring", () => {
      const value = new ReactiveValue(10);
      monitorReactiveValue(value, { name: "TestValue" });
      unmonitorReactiveValue(value);

      expect(isReactiveValueMonitored(value)).toBe(false);
    });
  });

  describe("getReactiveValueInstanceId", () => {
    it("should return instance ID for monitored value", () => {
      const value = new ReactiveValue(10);
      const instanceId = monitorReactiveValue(value, { name: "TestValue" });

      expect(getReactiveValueInstanceId(value)).toBe(instanceId);
    });

    it("should return undefined for unmonitored value", () => {
      const value = new ReactiveValue(10);

      expect(getReactiveValueInstanceId(value)).toBeUndefined();
    });
  });

  describe("integration with DevTools store", () => {
    it("should add events to timeline", () => {
      const value = new ReactiveValue(10);
      monitorReactiveValue(value, { name: "TestValue" });

      value.set(20);

      const timeline = getDevToolsStore().getTimeline();
      const changeEvents = timeline.filter(
        (e) => e.eventType === DevToolsEventType.REACTIVE_VALUE_CHANGE,
      );

      expect(changeEvents.length).toBeGreaterThan(0);
    });

    it("should track subscription count in subscribe events", () => {
      const value = new ReactiveValue(10);
      monitorReactiveValue(value, { name: "TestValue" });

      // Add another subscriber
      const unsubscribe = value.subscribe(() => {});

      const timeline = getDevToolsStore().getTimeline();
      const subscribeEvents = timeline.filter(
        (e) => e.eventType === DevToolsEventType.REACTIVE_VALUE_SUBSCRIBE,
      );

      // Should have at least one subscribe event with subscriber count
      const lastSubscribeEvent = subscribeEvents[subscribeEvents.length - 1];
      if (lastSubscribeEvent) {
        expect(lastSubscribeEvent.data.subscriberCount).toBeGreaterThan(0);
      }

      unsubscribe();
    });
  });
});
