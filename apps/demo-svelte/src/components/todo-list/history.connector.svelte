<script lang="ts">
  import { TodoListManager } from "@xndrjs/demo-common";
  import { reactiveValue } from "@xndrjs/adapter-svelte";
  import TodoHistoryView from "./todo-history.view.svelte";

  interface Props {
    todoListManager: TodoListManager;
  }

  let { todoListManager }: Props = $props();

  const historyStore = reactiveValue(() => todoListManager.history);
  const historyPointerStore = reactiveValue(() => todoListManager.historyPointer);
</script>

<div class="demo-section">
  <h2>Memento History</h2>
  <TodoHistoryView history={$historyStore} historyPointer={$historyPointerStore} />
</div>

