import type { StatePort } from "@xndrjs/core";
import { ViewModel } from "@xndrjs/core";
import type { TodoListService } from "./service";

/**
 * Manages the form state for adding a new todo item.
 * Uses StatePort for framework-agnostic state management.
 */
export class NewTodoItemForm extends ViewModel {
  private _textPort: StatePort<string>;
  private _todoListService: TodoListService;

  /**
   * Get the text port for the new todo input.
   */
  get textPort(): StatePort<string> {
    return this._textPort;
  }

  constructor(textPort: StatePort<string>, todoListService: TodoListService) {
    super();
    this._textPort = textPort;
    this._todoListService = todoListService;
  }

  /**
   * Add a new todo with the current text value and reset the form.
   */
  submit(): void {
    const text = this._textPort.get().trim();
    if (text) {
      this._todoListService.addTodo(text);
      this._textPort.set("");
    }
  }
}
