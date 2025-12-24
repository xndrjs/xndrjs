import type { StatePort } from "@xndrjs/core";
import type { TodoListManager } from "./manager";

/**
 * Manages the form state for adding a new todo item.
 * Uses StatePort for framework-agnostic state management.
 */
export class NewTodoItemForm {
  private _textPort: StatePort<string>;
  private _todoListManager: TodoListManager;

  /**
   * Get the text port for the new todo input.
   */
  get textPort(): StatePort<string> {
    return this._textPort;
  }

  constructor(textPort: StatePort<string>, todoListManager: TodoListManager) {
    this._textPort = textPort;
    this._todoListManager = todoListManager;
  }

  /**
   * Add a new todo with the current text value and reset the form.
   */
  submit(): void {
    const text = this._textPort.get().trim();
    if (text) {
      this._todoListManager.addTodo(text);
      this._textPort.set("");
    }
  }
}
