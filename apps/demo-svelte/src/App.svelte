<script lang="ts">
  import { ReactiveArray } from "@xndrjs/core";
  import { TodoListService } from "@xndrjs/demo-common";
  import type { Todo } from "@xndrjs/demo-common";
  import { eventBus } from "./messaging";
  import { useEventLog } from "./components/event-log/event-log.connector";
  import { useViewModel } from "@xndrjs/adapter-svelte";
  import TodoListConnector from "./components/todo-list/todo-list.connector.svelte";
  import TodoHistoryConnector from "./components/todo-list/history.connector.svelte";
  import StopwatchFSMConnector from "./components/stopwatch-fsm/stopwatch-fsm.connector.svelte";
  import EventLogConnector from "./components/event-log/event-log.connector.svelte";

  // Event handlers registered via function call
  useEventLog();

  // Todos state
  const todosPort = new ReactiveArray<Todo>([
    {
      id: crypto.randomUUID(),
      text: "Learn StatePort pattern",
      completed: false,
    },
    { id: crypto.randomUUID(), text: "Build demo app", completed: false },
  ]);
  // example: creating a global service and passing it to components as a prop
  const todoListService = useViewModel(() => new TodoListService(eventBus, { todosPort }));
</script>

<div class="app">
  <div class="app-header">
    <h1>Demo - Svelte</h1>
    <p>
      Framework-agnostic state management
    </p>
  </div>

  <div class="demo-grid">
    <TodoListConnector {todoListService} />
    <StopwatchFSMConnector />
    <TodoHistoryConnector {todoListService} />
    <EventLogConnector />
  </div>
</div>

