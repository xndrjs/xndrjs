<script lang="ts">
  interface Props {
    text: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled: boolean;
  }

  let { text, onChange, onSubmit, disabled }: Props = $props();
</script>

<div class="todo-input-group">
  <input
    type="text"
    value={text}
    oninput={(e) => onChange(e.currentTarget.value)}
    placeholder="Add a new todo"
    onkeydown={(e) => {
      if (e.key === "Enter") {
        onSubmit();
      }
    }}
  />
  <button onclick={onSubmit} disabled={disabled || !text.trim()}>
    Add Todo
  </button>
</div>

