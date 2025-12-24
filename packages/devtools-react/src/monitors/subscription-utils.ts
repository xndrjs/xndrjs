/**
 * Subscription Utilities
 * Helper functions for tracking and displaying subscriptions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AbstractReactiveValue } from "@xndrjs/core";
import { getDevToolsHook } from "../core/hook";
import { isReactiveValueMonitored } from "./reactive-value-monitor";
import { isReactiveObjectMonitored } from "./reactive-object-monitor";

/**
 * Get the number of active subscribers for a ReactiveValue
 */
export function getSubscriberCount(value: AbstractReactiveValue<any>): number {
  return (value as any)._subscribers?.size || 0;
}

/**
 * Check if a ReactiveValue has DevTools subscription
 */
export function hasDevToolsSubscription(
  value: AbstractReactiveValue<any>,
): boolean {
  return (
    isReactiveValueMonitored(value) || isReactiveObjectMonitored(value as any)
  );
}

/**
 * Get subscription info for a ReactiveValue instance
 */
export interface SubscriptionInfo {
  totalSubscribers: number;
  hasDevToolsSubscription: boolean;
  instanceId?: string;
}

/**
 * Get subscription information for a ReactiveValue
 */
export function getSubscriptionInfo(
  value: AbstractReactiveValue<any>,
): SubscriptionInfo {
  const hook = getDevToolsHook();
  const instanceId = hook.findInstanceId(value);

  return {
    totalSubscribers: getSubscriberCount(value),
    hasDevToolsSubscription: hasDevToolsSubscription(value),
    instanceId: instanceId || undefined,
  };
}
