import type { Todo } from "@xndrjs/demo-common";

interface TodoListViewProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoListView({ todos, onToggle, onDelete }: TodoListViewProps) {
  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`todo-item ${todo.completed ? "completed" : ""}`}
        >
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
          />
          <span>{todo.text}</span>
          <button onClick={() => onDelete(todo.id)}>Delete</button>
        </div>
      ))}

      {todos.length === 0 && (
        <p style={{ textAlign: "center", color: "#7f8c8d", padding: "2rem" }}>
          No todos yet. Add one above!
        </p>
      )}
    </div>
  );
}
