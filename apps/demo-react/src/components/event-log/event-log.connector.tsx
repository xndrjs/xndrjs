import { useMemo } from "react";
import { useCreateStatePort, useReactiveValue } from "@xndrjs/adapter-react";
import { AppEventHandlers } from "@xndrjs/demo-common";
import { eventBus } from "../../messaging";
import { EventLogView } from "./event-log.view";
import type { AppEvent } from "@xndrjs/demo-common";

export function useEventLog() {
  // Create StatePort directly (standard approach)
  const eventLogPort = useCreateStatePort<AppEvent[]>([]);

  // Create AppEventHandlers with global EventBus and StatePort
  // Event handlers are automatically registered in the constructor
  const appEventHandlers = useMemo(
    () => new AppEventHandlers(eventBus, eventLogPort),
    [eventLogPort],
  );

  return {
    eventLogPort,
    eventHandlers: appEventHandlers,
  };
}

export function EventLogConnector() {
  const { eventLogPort, eventHandlers } = useEventLog();
  const eventLog = useReactiveValue(eventLogPort);

  return (
    <div className="demo-section">
      <h2>Event Log</h2>
      <EventLogView
        events={eventLog}
        onClear={() => eventHandlers.clearEventLog(eventLogPort)}
      />
    </div>
  );
}
