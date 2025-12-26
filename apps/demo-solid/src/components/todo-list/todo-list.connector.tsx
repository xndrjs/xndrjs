import { ReactiveValue } from "@xndrjs/core";
import { TodoListService, NewTodoItemForm } from "@xndrjs/demo-common";
import { useReactiveValue, useViewModel } from "@xndrjs/adapter-solid";
import { TodoListView } from "./todo-list.view";
import { NewTodoItemFormView } from "./new-todo-item-form.view";

interface TodoListConnectorProps {
  todoListService: TodoListService;
}

export function TodoListConnector({ todoListService }: TodoListConnectorProps) {
  const newTodoTextPort = new ReactiveValue<string>("");
  const newTodoItemForm = useViewModel(
    () => new NewTodoItemForm(newTodoTextPort, todoListService),
  );

  const todos = useReactiveValue(todoListService.todos);
  const canUndo = useReactiveValue(todoListService.canUndo);
  const canRedo = useReactiveValue(todoListService.canRedo);
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
        onToggle={(id) => todoListService.toggleTodo(id)}
        onDelete={(id) => todoListService.removeTodo(id)}
      />
      <div class="todo-actions">
        <button onClick={() => todoListService.undo()} disabled={!canUndo()}>
          Undo
        </button>
        <button onClick={() => todoListService.redo()} disabled={!canRedo()}>
          Redo
        </button>
      </div>
    </div>
  );
}
