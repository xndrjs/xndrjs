import { ReactiveArray } from "@xndrjs/core";
import { AppEventHandlers } from "@xndrjs/demo-common";
import type { AppEvent } from "@xndrjs/demo-common";
import type { StatePort } from "@xndrjs/core";
import { eventBus } from "../../messaging";

/**
 * Hook to initialize event log handlers.
 * This should be called once at the app level.
 */
export function useEventLog() {
  const eventLogPort: StatePort<AppEvent[]> = new ReactiveArray<AppEvent>([]);
  const eventHandlers = new AppEventHandlers(eventBus, eventLogPort);

  return {
    eventLogPort,
    eventHandlers,
  };
}
