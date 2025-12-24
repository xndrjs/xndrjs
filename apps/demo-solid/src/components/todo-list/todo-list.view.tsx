import { For, Show } from "solid-js";
import type { Todo } from "@xndrjs/demo-common";

interface TodoListViewProps {
  todos: () => Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoListView({ todos, onToggle, onDelete }: TodoListViewProps) {
  return (
    <div class="todo-list">
      <Show
        when={todos().length > 0}
        fallback={
          <p style={{ color: "#7f8c8d", "text-align": "center" }}>
            No todos yet. Add your first task!
          </p>
        }
      >
        <For each={todos()}>
          {(todo) => (
            <div
              class={`todo-item ${todo.completed ? "completed" : ""}`}
              data-testid={`todo-item-${todo.id}`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => onToggle(todo.id)}
              />
              <span>{todo.text}</span>
              <button onClick={() => onDelete(todo.id)}>Delete</button>
            </div>
          )}
        </For>
      </Show>
    </div>
  );
}
