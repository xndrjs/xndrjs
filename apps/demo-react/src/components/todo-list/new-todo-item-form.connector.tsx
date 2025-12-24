import { useReactiveValue } from "@xndrjs/adapter-react";
import type { NewTodoItemForm } from "@xndrjs/demo-common";

interface NewTodoItemFormInputProps {
  newTodoItemForm: NewTodoItemForm;
}

export function NewTodoItemFormConnector({
  newTodoItemForm,
}: NewTodoItemFormInputProps) {
  const newTodoText = useReactiveValue(newTodoItemForm.textPort);
  const text = useReactiveValue(newTodoItemForm.textPort);

  return (
    <div className="todo-input-group">
      <input
        type="text"
        value={newTodoText}
        onChange={(e) => newTodoItemForm.textPort.set(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            newTodoItemForm.submit();
          }
        }}
        placeholder="Add a new todo..."
      />
      <button disabled={!text.trim()} onClick={() => newTodoItemForm.submit()}>
        Add Todo
      </button>
    </div>
  );
}
