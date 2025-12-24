<script lang="ts">
  import type { AppEvent } from "@xndrjs/demo-common";

  interface Props {
    events: AppEvent[];
    onClear: () => void;
  }

  let { events, onClear }: Props = $props();
</script>

<div class="event-log">
  {#if events.length === 0}
    <p style="text-align: center; color: #7f8c8d; padding: 2rem">
      No events yet. Try adding, updating, or deleting todos!
    </p>
  {:else}
    {#each [...events].reverse() as event, idx (event.id + idx)}
      <div
        class="event-item {event.type.toLowerCase().replace('todo', '')}"
        data-key="{event.id}-{idx}"
      >
        <div class="event-item-header">{event.type}</div>
        <div class="event-item-time">
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
        <div class="event-item-payload">
          <pre>{JSON.stringify(event.payload, null, 2)}</pre>
        </div>
      </div>
    {/each}
    <div class="event-log-actions">
      <button onclick={onClear}>Clear Log</button>
    </div>
  {/if}
</div>

