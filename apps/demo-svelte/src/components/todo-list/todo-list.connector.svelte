<script lang="ts">
  import { TodoListService, NewTodoItemForm } from "@xndrjs/demo-common";
  import { reactiveValue, toStatePort, useViewModel } from "@xndrjs/adapter-svelte";
  import NewTodoItemFormView from "./new-todo-item-form.view.svelte";
  import TodoListView from "./todo-list.view.svelte";

  interface Props {
    todoListService: TodoListService;
  }

  let { todoListService }: Props = $props();

  // example: using a Svelte Rune as state
  let newTodoTextStore = $state("");
  // converting the Rune as State Port to be used inside a Xandr class
  const newTodoTextPort = toStatePort(() => newTodoTextStore, (v) => newTodoTextStore = v);
  // passing the State Port to the Xandr class
  const newTodoItemForm = useViewModel(() => new NewTodoItemForm(newTodoTextPort, todoListService));
  // using reactive values from the Xandr class
  const todosStore = reactiveValue(() => todoListService.todos);
  const canUndoStore = reactiveValue(() => todoListService.canUndo);
  const canRedoStore = reactiveValue(() => todoListService.canRedo);
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
    onToggle={(id) => todoListService.toggleTodo(id)}
    onDelete={(id) => todoListService.removeTodo(id)}
  />
  <div class="todo-actions">
    <button onclick={() => todoListService.undo()} disabled={!$canUndoStore}>
      Undo
    </button>
    <button onclick={() => todoListService.redo()} disabled={!$canRedoStore}>
      Redo
    </button>
  </div>
</div>

