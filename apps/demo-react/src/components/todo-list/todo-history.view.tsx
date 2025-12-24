import type { Todo } from "@xndrjs/demo-common";

interface TodoHistoryViewProps {
  history: { todos: Todo[] }[];
  historyPointer: number;
}

export function TodoHistoryView({
  history,
  historyPointer,
}: TodoHistoryViewProps) {
  return (
    <div
      style={{
        padding: "1rem",
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        fontSize: "0.9rem",
      }}
    >
      <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>
        Memento History
      </h3>
      <div style={{ marginTop: "1rem" }}>
        <div
          style={{
            marginTop: "0.5rem",
            maxHeight: "200px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        >
          {history.length === 0 ? (
            <div style={{ color: "#6c757d" }}>Empty</div>
          ) : (
            history.map((memento, index) => (
              <div
                key={index}
                style={{
                  padding: "0.5rem",
                  marginBottom: "0.25rem",
                  background: index === historyPointer ? "#fff3cd" : "white",
                  border:
                    index === historyPointer
                      ? "2px solid #ffc107"
                      : "1px solid #dee2e6",
                  borderRadius: "2px",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  [{index}] {index === historyPointer ? "← current" : ""}
                </div>
                <div>
                  Todos: {memento.todos.length} (
                  {memento.todos.map((t: Todo) => t.text).join(", ")})
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
