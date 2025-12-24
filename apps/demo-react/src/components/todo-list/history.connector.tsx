import { useReactiveValue } from "@xndrjs/adapter-react";
import { TodoListManager } from "@xndrjs/demo-common";
import { TodoHistoryView } from "./todo-history.view";

interface TodoHistoryConnectorProps {
  todoListManager: TodoListManager;
}

export function TodoHistoryConnector({
  todoListManager,
}: TodoHistoryConnectorProps) {
  const history = useReactiveValue(todoListManager.history);
  const historyPointer = useReactiveValue(todoListManager.historyPointer);

  return (
    <div className="demo-section">
      <h2>Memento History</h2>
      <TodoHistoryView history={history} historyPointer={historyPointer} />
    </div>
  );
}
