import { ReactiveValue } from "@xndrjs/core";
import { TodoListManager, NewTodoItemForm } from "@xndrjs/demo-common";
import { useReactiveValue } from "@xndrjs/adapter-solid";
import { TodoListView } from "./todo-list.view";
import { NewTodoItemFormView } from "./new-todo-item-form.view";

interface TodoListConnectorProps {
  todoListManager: TodoListManager;
}

export function TodoListConnector({ todoListManager }: TodoListConnectorProps) {
  const newTodoTextPort = new ReactiveValue<string>("");
  const newTodoItemForm = new NewTodoItemForm(newTodoTextPort, todoListManager);

  const todos = useReactiveValue(todoListManager.todos);
  const canUndo = useReactiveValue(todoListManager.canUndo);
  const canRedo = useReactiveValue(todoListManager.canRedo);
  const newTodoText = useReactiveValue(newTodoTextPort);

  return (
    <div class="demo-section">
      <h2>Todo List</h2>
      <NewTodoItemFormView
        text={newTodoText}
        onChange={(value) => newTodoTextPort.set(value)}
        onSubmit={() => newTodoItemForm.submit()}
        disabled={() => false}
      />
      <TodoListView
        todos={todos}
        onToggle={(id) => todoListManager.toggleTodo(id)}
        onDelete={(id) => todoListManager.removeTodo(id)}
      />
      <div class="todo-actions">
        <button onClick={() => todoListManager.undo()} disabled={!canUndo()}>
          Undo
        </button>
        <button onClick={() => todoListManager.redo()} disabled={!canRedo()}>
          Redo
        </button>
      </div>
    </div>
  );
}
