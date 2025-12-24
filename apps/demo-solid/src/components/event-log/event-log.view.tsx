import { For, Show } from "solid-js";
import type { AppEvent } from "@xndrjs/demo-common";

interface EventLogViewProps {
  events: () => AppEvent[];
  onClear: () => void;
}

export function EventLogView({ events, onClear }: EventLogViewProps) {
  return (
    <div class="event-log">
      <Show
        when={events().length > 0}
        fallback={
          <p
            style={{
              "text-align": "center",
              color: "#7f8c8d",
              padding: "2rem",
            }}
          >
            No events yet. Try adding, updating, or deleting todos!
          </p>
        }
      >
        <For each={[...events()].reverse()}>
          {(event, index) => (
            <div
              class={`event-item ${event.type.toLowerCase().replace("todo", "")}`}
              data-key={`${event.id}-${index()}`}
            >
              <div class="event-item-header">{event.type}</div>
              <div class="event-item-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
              <div class="event-item-payload">
                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
              </div>
            </div>
          )}
        </For>
        <div class="event-log-actions">
          <button onClick={onClear}>Clear Log</button>
        </div>
      </Show>
    </div>
  );
}
