import { ReactiveArray } from "@xndrjs/core";
import { Todo, TodoListService } from "@xndrjs/demo-common";
import { eventBus } from "./messaging";
import { TodoListConnector } from "./components/todo-list/todo-list.connector";
import { TodoHistoryConnector } from "./components/todo-list/history.connector";
import { StopwatchFSMConnector } from "./components/stopwatch-fsm/stopwatch-fsm.connector";
import {
  EventLogConnector,
  useEventLog,
} from "./components/event-log/event-log.connector";
import { useViewModel } from "@xndrjs/adapter-solid";

function App() {
  // Event handlers registered via hook
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
  const todoListService = useViewModel(
    () => new TodoListService(eventBus, { todosPort }),
  );

  return (
    <div class="app">
      <div class="app-header">
        <h1>Demo - Solid</h1>
        <p>Framework-agnostic state management</p>
      </div>

      <div class="demo-grid">
        <TodoListConnector todoListService={todoListService} />
        <StopwatchFSMConnector />
        <TodoHistoryConnector todoListService={todoListService} />
        <EventLogConnector />
      </div>
    </div>
  );
}

export default App;
