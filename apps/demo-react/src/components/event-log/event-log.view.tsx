import type { AppEvent } from "@xndrjs/demo-common";

interface EventLogViewProps {
  events: AppEvent[];
  onClear: () => void;
}

export function EventLogView({ events, onClear }: EventLogViewProps) {
  return (
    <div className="event-log">
      {events.length === 0 ? (
        <p style={{ textAlign: "center", color: "#7f8c8d", padding: "2rem" }}>
          No events yet. Try adding, updating, or deleting todos!
        </p>
      ) : (
        <>
          {events
            .slice()
            .reverse()
            .map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className={`event-item ${event.type.toLowerCase().replace("todo", "")}`}
              >
                <div className="event-item-header">{event.type}</div>
                <div className="event-item-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className="event-item-payload">
                  <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                </div>
              </div>
            ))}
          <div className="event-log-actions">
            <button onClick={onClear}>Clear Log</button>
          </div>
        </>
      )}
    </div>
  );
}
