import { useReactiveValue } from "@xndrjs/adapter-react";
import { TodoListService } from "@xndrjs/demo-common";
import { TodoHistoryView } from "./todo-history.view";

interface TodoHistoryConnectorProps {
  todoListService: TodoListService;
}

export function TodoHistoryConnector({
  todoListService,
}: TodoHistoryConnectorProps) {
  const history = useReactiveValue(todoListService.history);
  const historyPointer = useReactiveValue(todoListService.historyPointer);

  return (
    <div className="demo-section">
      <h2>Memento History</h2>
      <TodoHistoryView history={history} historyPointer={historyPointer} />
    </div>
  );
}
