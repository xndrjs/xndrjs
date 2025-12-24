import { useReactiveValue } from "@xndrjs/adapter-solid";
import type { NewTodoItemForm } from "@xndrjs/demo-common";

interface NewTodoItemFormInputProps {
  newTodoItemForm: NewTodoItemForm;
}

export function NewTodoItemFormConnector({
  newTodoItemForm,
}: NewTodoItemFormInputProps) {
  const text = useReactiveValue(newTodoItemForm.textPort);

  return (
    <div class="todo-input-group">
      <input
        type="text"
        value={text()}
        onInput={(e) => newTodoItemForm.textPort.set(e.currentTarget.value)}
        placeholder="Add a new todo"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            newTodoItemForm.submit();
          }
        }}
      />
      <button
        onClick={() => newTodoItemForm.submit()}
        disabled={!text().trim()}
      >
        Add Todo
      </button>
    </div>
  );
}
