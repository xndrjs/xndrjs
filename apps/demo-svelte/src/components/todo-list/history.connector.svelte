<script lang="ts">
  import { TodoListService } from "@xndrjs/demo-common";
  import { reactiveValue } from "@xndrjs/adapter-svelte";
  import TodoHistoryView from "./todo-history.view.svelte";

  interface Props {
    todoListService: TodoListService;
  }

  let { todoListService }: Props = $props();

  const historyStore = reactiveValue(() => todoListService.history);
  const historyPointerStore = reactiveValue(() => todoListService.historyPointer);
</script>

<div class="demo-section">
  <h2>Memento History</h2>
  <TodoHistoryView history={$historyStore} historyPointer={$historyPointerStore} />
</div>

