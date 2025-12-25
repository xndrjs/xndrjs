import { ReactiveArray, ReactiveValue, type StatePort, ViewModel } from "@xndrjs/core";
import { MementoBaseCaretaker } from "@xndrjs/memento";
import type { MementoBaseOriginator } from "@xndrjs/memento";
import type { EventBusInterface } from "@xndrjs/cqrs";
import {
  TodoCreatedEvent,
  TodoDeletedEvent,
  TodoUpdatedEvent,
  TodoUndoEvent,
  TodoRedoEvent,
} from "./event-handlers";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoListState {
  todos: Todo[];
}

/**
 * Originator for TodoList that implements Memento pattern.
 * Receives StatePort from framework (React, Solid, etc.).
 */
export class TodoListOriginator implements MementoBaseOriginator<TodoListState> {
  constructor(private todosPort: StatePort<Todo[]>) {}

  getMemento(): TodoListState | null {
    return {
      todos: this.todosPort.get(),
    };
  }

  restoreMemento(memento: TodoListState): void {
    this.todosPort.set(memento.todos);
  }

  addTodo(text: string): void {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    };
    this.todosPort.set((prev) => [...prev, newTodo]);
  }

  removeTodo(id: string): void {
    this.todosPort.set((prev) => prev.filter((todo) => todo.id !== id));
  }

  toggleTodo(id: string): void {
    this.todosPort.set((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }
}

/**
 * Manager for TodoList with undo/redo capabilities using Memento pattern.
 * Receives StatePort instances from framework (React, Solid, etc.).
 * Publishes events to EventBus when todos are modified.
 */
export class TodoListManager extends ViewModel {
  private _originator: TodoListOriginator;
  private _caretaker: MementoBaseCaretaker<
    TodoListState, // TMemento
    TodoListOriginator // Originator
  >;
  private _eventBus: EventBusInterface;
  private _todosPort: StatePort<Todo[]>;

  constructor(
    eventBus: EventBusInterface,
    options?: {
      todosPort?: StatePort<Todo[]>;
      initialTodos?: Todo[];
      historyPort?: StatePort<TodoListState[]>;
      historyPointerPort?: StatePort<number>;
    },
  ) {
    super();
    const initialTodos = options?.initialTodos ?? [];
    this._todosPort =
      options?.todosPort ?? new ReactiveArray<Todo>(initialTodos);

    const historyPort =
      options?.historyPort ?? new ReactiveArray<TodoListState>([]);
    const historyPointerPort =
      options?.historyPointerPort ?? new ReactiveValue<number>(0);

    this._originator = new TodoListOriginator(this._todosPort);
    this._caretaker = new MementoBaseCaretaker<
      TodoListState,
      TodoListOriginator
    >(this._originator, historyPort, historyPointerPort);
    this._eventBus = eventBus;
  }

  /**
   * ComputedValue indicating if undo is possible.
   */
  get canUndo() {
    return this._caretaker.canUndo;
  }

  /**
   * ComputedValue indicating if redo is possible.
   */
  get canRedo() {
    return this._caretaker.canRedo;
  }

  /**
   * StatePort for the todos.
   */
  get todos() {
    return this._todosPort;
  }

  /**
   * StatePort for the memento history.
   */
  get history() {
    return this._caretaker.history;
  }

  /**
   * StatePort for the history pointer.
   */
  get historyPointer() {
    return this._caretaker.historyPointer;
  }

  /**
   * Caretaker instance for DevTools monitoring.
   */
  get caretaker() {
    return this._caretaker;
  }

  /**
   * Add a new todo and save state.
   */
  addTodo(text: string): void {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
    };
    this._originator.addTodo(text);
    this._caretaker.saveState();
    this._eventBus.publish(new TodoCreatedEvent({ todo: newTodo }));
  }

  /**
   * Remove a todo and save state.
   */
  removeTodo(id: string): void {
    this._originator.removeTodo(id);
    this._caretaker.saveState();
    this._eventBus.publish(new TodoDeletedEvent({ id }));
  }

  /**
   * Toggle todo completion and save state.
   */
  toggleTodo(id: string): void {
    const todos = this._todosPort.get();
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      this._originator.toggleTodo(id);
      this._caretaker.saveState();
      this._eventBus.publish(
        new TodoUpdatedEvent({
          id,
          completed: !todo.completed,
        }),
      );
    }
  }

  /**
   * Undo the last action.
   */
  undo(): void {
    this._caretaker.undo();
    this._eventBus.publish(new TodoUndoEvent({} as Record<string, never>));
  }

  /**
   * Redo the last undone action.
   */
  redo(): void {
    this._caretaker.redo();
    this._eventBus.publish(new TodoRedoEvent({} as Record<string, never>));
  }
}
