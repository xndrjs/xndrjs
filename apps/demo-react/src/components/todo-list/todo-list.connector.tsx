import { useCreateStatePort, useStableReference } from "@xndrjs/adapter-react";
import { TodoListManager, NewTodoItemForm } from "@xndrjs/demo-common";
import { TodoListView } from "./todo-list.view";
import { useReactiveValue } from "@xndrjs/adapter-react";
import { NewTodoItemFormView } from "./new-todo-item-form.view";
import { useMonitorStatePort, useMonitorMemento } from "@xndrjs/devtools-react";

interface TodoHistoryConnectorProps {
  todoListManager: TodoListManager;
}

export function TodoListConnector({
  todoListManager,
}: TodoHistoryConnectorProps) {
  const newTodoTextPort = useCreateStatePort<string>("");
  const newTodoItemForm = useStableReference(
    () => new NewTodoItemForm(newTodoTextPort, todoListManager),
  );

  const todos = useReactiveValue(todoListManager.todos);
  const canUndo = useReactiveValue(todoListManager.canUndo);
  const canRedo = useReactiveValue(todoListManager.canRedo);
  const newTodoText = useReactiveValue(newTodoTextPort);

  // Monitor StatePorts automatically (handles both ReactiveValue and ComputedValue)
  useMonitorStatePort(todoListManager.canUndo, { name: "TodoList.canUndo" });
  useMonitorStatePort(todoListManager.canRedo, { name: "TodoList.canRedo" });

  // Monitor Memento caretaker for DevTools
  useMonitorMemento(todoListManager.caretaker, { name: "TodoList.Memento" });

  return (
    <div className="demo-section">
      <h2>Todo List</h2>
      <NewTodoItemFormView
        text={newTodoText}
        onChange={(value) => newTodoTextPort.set(value)}
        onSubmit={() => newTodoItemForm.submit()}
        disabled={false}
      />
      <TodoListView
        todos={todos}
        onToggle={(id) => todoListManager.toggleTodo(id)}
        onDelete={(id) => todoListManager.removeTodo(id)}
      />
      <div className="todo-actions">
        <button onClick={() => todoListManager.undo()} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={() => todoListManager.redo()} disabled={!canRedo}>
          Redo
        </button>
      </div>
    </div>
  );
}
