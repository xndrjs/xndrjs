import { useCreateStatePort, useViewModel } from "@xndrjs/adapter-react";
import { TodoListService, NewTodoItemForm } from "@xndrjs/demo-common";
import { TodoListView } from "./todo-list.view";
import { useReactiveValue } from "@xndrjs/adapter-react";
import { NewTodoItemFormView } from "./new-todo-item-form.view";
import { useMonitorStatePort, useMonitorMemento } from "@xndrjs/devtools-react";

interface TodoHistoryConnectorProps {
  todoListService: TodoListService;
}

export function TodoListConnector({
  todoListService,
}: TodoHistoryConnectorProps) {
  const newTodoTextPort = useCreateStatePort<string>("");
  const newTodoItemForm = useViewModel(
    () => new NewTodoItemForm(newTodoTextPort, todoListService),
  );

  const todos = useReactiveValue(todoListService.todos);
  const canUndo = useReactiveValue(todoListService.canUndo);
  const canRedo = useReactiveValue(todoListService.canRedo);
  const newTodoText = useReactiveValue(newTodoTextPort);

  // Monitor StatePorts automatically (handles both ReactiveValue and ComputedValue)
  useMonitorStatePort(todoListService.canUndo, { name: "TodoList.canUndo" });
  useMonitorStatePort(todoListService.canRedo, { name: "TodoList.canRedo" });

  // Monitor Memento caretaker for DevTools
  useMonitorMemento(todoListService.caretaker, { name: "TodoList.Memento" });

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
        onToggle={(id) => todoListService.toggleTodo(id)}
        onDelete={(id) => todoListService.removeTodo(id)}
      />
      <div className="todo-actions">
        <button onClick={() => todoListService.undo()} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={() => todoListService.redo()} disabled={!canRedo}>
          Redo
        </button>
      </div>
    </div>
  );
}
