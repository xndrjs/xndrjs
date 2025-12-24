interface NewTodoItemFormViewProps {
  text: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function NewTodoItemFormView({
  text,
  onChange,
  onSubmit,
  disabled,
}: NewTodoItemFormViewProps) {
  return (
    <div className="todo-input-group">
      <input
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit();
          }
        }}
        placeholder="Add a new todo..."
      />
      <button disabled={disabled || !text.trim()} onClick={onSubmit}>
        Add Todo
      </button>
    </div>
  );
}
