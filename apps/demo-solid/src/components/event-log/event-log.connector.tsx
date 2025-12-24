import { ReactiveArray } from "@xndrjs/core";
import { useReactiveValue } from "@xndrjs/adapter-solid";
import { AppEventHandlers } from "@xndrjs/demo-common";
import type { AppEvent } from "@xndrjs/demo-common";
import type { StatePort } from "@xndrjs/core";
import { eventBus } from "../../messaging";
import { EventLogView } from "./event-log.view";

export function useEventLog() {
  const eventLogPort: StatePort<AppEvent[]> = new ReactiveArray<AppEvent>([]);
  const eventHandlers = new AppEventHandlers(eventBus, eventLogPort);

  return {
    eventLogPort,
    eventHandlers,
  };
}

export function EventLogConnector() {
  const { eventLogPort, eventHandlers } = useEventLog();
  const eventLog = useReactiveValue(eventLogPort);

  return (
    <div class="demo-section">
      <h2>Event Log</h2>
      <EventLogView
        events={eventLog}
        onClear={() => eventHandlers.clearEventLog(eventLogPort)}
      />
    </div>
  );
}
