<script lang="ts">
  import { TodoListManager, NewTodoItemForm } from "@xndrjs/demo-common";
  import { reactiveValue, toStatePort } from "@xndrjs/adapter-svelte";
  import NewTodoItemFormView from "./new-todo-item-form.view.svelte";
  import TodoListView from "./todo-list.view.svelte";

  interface Props {
    todoListManager: TodoListManager;
  }

  let { todoListManager }: Props = $props();

  // example: using a Svelte Rune as state
  let newTodoTextStore = $state("");
  // converting the Rune as State Port to be used inside a Xandr class
  const newTodoTextPort = toStatePort(() => newTodoTextStore, (v) => newTodoTextStore = v);
  // passing the State Port to the Xandr class
  const newTodoItemForm = $derived(new NewTodoItemForm(newTodoTextPort, todoListManager));
  // using reactive values from the Xandr class
  const todosStore = reactiveValue(() => todoListManager.todos);
  const canUndoStore = reactiveValue(() => todoListManager.canUndo);
  const canRedoStore = reactiveValue(() => todoListManager.canRedo);
</script>

<div class="demo-section">
  <h2>Todo List</h2>
  <NewTodoItemFormView
    text={newTodoTextStore}
    onChange={(value) => newTodoTextPort.set(value)}
    onSubmit={() => newTodoItemForm.submit()}
    disabled={false}
  />
  <TodoListView
    todos={$todosStore}
    onToggle={(id) => todoListManager.toggleTodo(id)}
    onDelete={(id) => todoListManager.removeTodo(id)}
  />
  <div class="todo-actions">
    <button onclick={() => todoListManager.undo()} disabled={!$canUndoStore}>
      Undo
    </button>
    <button onclick={() => todoListManager.redo()} disabled={!$canRedoStore}>
      Redo
    </button>
  </div>
</div>

