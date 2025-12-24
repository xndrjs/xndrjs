<script lang="ts">
  import { ReactiveArray } from "@xndrjs/core";
  import { AppEventHandlers } from "@xndrjs/demo-common";
  import type { AppEvent } from "@xndrjs/demo-common";
  import type { StatePort } from "@xndrjs/core";
  import { eventBus } from "../../messaging";
  import { reactiveValue } from "@xndrjs/adapter-svelte";
  import EventLogView from "./event-log.view.svelte";

  const eventLogPort: StatePort<AppEvent[]> = new ReactiveArray<AppEvent>([]);
  const eventHandlers = new AppEventHandlers(eventBus, eventLogPort);

  const eventLogStore = reactiveValue(() => eventLogPort);
</script>

<div class="demo-section">
  <h2>Event Log</h2>
  <EventLogView
    events={$eventLogStore}
    onClear={() => eventHandlers.clearEventLog(eventLogPort)}
  />
</div>

