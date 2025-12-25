import { TodoListConnector } from "./components/todo-list/todo-list.connector";
import { TodoHistoryConnector } from "./components/todo-list/history.connector";
import { StopwatchFSMConnector } from "./components/stopwatch-fsm/stopwatch-fsm.connector";
import {
  EventLogConnector,
  useEventLog,
} from "./components/event-log/event-log.connector";
import { useCreateStatePort, useViewModel } from "@xndrjs/adapter-react";
import { Todo, TodoListManager } from "@xndrjs/demo-common";
import { eventBus } from "./messaging";
import { DevToolsPanel } from "@xndrjs/devtools-react";

function App() {
  // Event handlers are automatically registered when AppEventHandlers is created
  useEventLog();

  const todosPort = useCreateStatePort<Todo[]>([
    {
      id: crypto.randomUUID(),
      text: "Learn StatePort pattern",
      completed: false,
    },
    { id: crypto.randomUUID(), text: "Build demo app", completed: false },
  ]);
  const todoListManager = useViewModel(
    () => new TodoListManager(eventBus, { todosPort }),
  );

  return (
    <div className="app">
      <div className="app-header">
        <h1>Demo - React</h1>
        <p>Framework-agnostic state management</p>
      </div>

      <div className="demo-grid">
        <TodoListConnector todoListManager={todoListManager} />
        <StopwatchFSMConnector />
        <TodoHistoryConnector todoListManager={todoListManager} />
        <EventLogConnector />
      </div>

      <DevToolsPanel />
    </div>
  );
}

export default App;
