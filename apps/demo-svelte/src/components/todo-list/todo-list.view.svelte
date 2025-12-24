<script lang="ts">
  import type { Todo } from "@xndrjs/demo-common";

  interface Props {
    todos: Todo[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
  }

  let { todos, onToggle, onDelete }: Props = $props();
</script>

<div class="todo-list">
  {#if todos.length === 0}
    <p style="color: #7f8c8d; text-align: center">
      No todos yet. Add your first task!
    </p>
  {:else}
    {#each todos as todo (todo.id)}
      <div
        class="todo-item {todo.completed ? 'completed' : ''}"
        data-testid="todo-item-{todo.id}"
      >
        <input
          type="checkbox"
          checked={todo.completed}
          onchange={() => onToggle(todo.id)}
        />
        <span>{todo.text}</span>
        <button onclick={() => onDelete(todo.id)}>Delete</button>
      </div>
    {/each}
  {/if}
</div>

