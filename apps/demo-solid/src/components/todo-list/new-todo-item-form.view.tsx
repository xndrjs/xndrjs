interface NewTodoItemFormViewProps {
  text: () => string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: () => boolean;
}

export function NewTodoItemFormView({
  text,
  onChange,
  onSubmit,
  disabled,
}: NewTodoItemFormViewProps) {
  return (
    <div class="todo-input-group">
      <input
        type="text"
        value={text()}
        onInput={(e) => onChange(e.currentTarget.value)}
        placeholder="Add a new todo"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit();
          }
        }}
      />
      <button onClick={onSubmit} disabled={disabled() || !text().trim()}>
        Add Todo
      </button>
    </div>
  );
}
