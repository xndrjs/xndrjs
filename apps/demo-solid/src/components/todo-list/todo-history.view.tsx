import type { Todo } from "@xndrjs/demo-common";
import { For, Show } from "solid-js";

interface TodoHistoryViewProps {
  history: () => { todos: Todo[] }[];
  historyPointer: () => number;
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
        "border-radius": "4px",
        "font-size": "0.9rem",
      }}
    >
      <h3 style={{ "margin-bottom": "0.5rem", "font-size": "1rem" }}>
        Memento History
      </h3>
      <div style={{ "margin-top": "1rem" }}>
        <div
          style={{
            "margin-top": "0.5rem",
            "max-height": "200px",
            "overflow-y": "auto",
            "font-family": "monospace",
            "font-size": "0.85rem",
          }}
        >
          <Show
            when={history().length > 0}
            fallback={<div style={{ color: "#6c757d" }}>Empty</div>}
          >
            <For each={history()}>
              {(memento, idx) => (
                <div
                  style={{
                    padding: "0.5rem",
                    "margin-bottom": "0.25rem",
                    background:
                      idx() === historyPointer() ? "#fff3cd" : "white",
                    border:
                      idx() === historyPointer()
                        ? "2px solid #ffc107"
                        : "1px solid #dee2e6",
                    "border-radius": "2px",
                  }}
                >
                  <div
                    style={{
                      "font-weight": "bold",
                      "margin-bottom": "0.25rem",
                    }}
                  >
                    [{idx()}] {idx() === historyPointer() ? "← current" : ""}
                  </div>
                  <div>
                    Todos: {memento.todos.length} (
                    {memento.todos.map((t: Todo) => t.text).join(", ")})
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}
