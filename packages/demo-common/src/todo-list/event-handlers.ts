import { SubscriptionsRegistry, type StatePort } from "@xndrjs/core";
import { createEventBusHandlers } from "@xndrjs/cqrs";
import type { Disposable } from "@xndrjs/core";
import type { EventBusInterface } from "@xndrjs/cqrs";
import { DomainEvent } from "@xndrjs/cqrs";
import type { Todo } from "./manager";
import type {
  StopwatchPlayEvent,
  StopwatchPauseEvent,
  StopwatchStopEvent,
} from "../stopwatch-fsm/event-handlers";

// Event definitions
export class TodoCreatedEvent extends DomainEvent<
  "TodoCreated",
  { todo: Todo }
> {
  get type() {
    return "TodoCreated" as const;
  }
}

export class TodoDeletedEvent extends DomainEvent<
  "TodoDeleted",
  { id: string }
> {
  get type() {
    return "TodoDeleted" as const;
  }
}

export class TodoUpdatedEvent extends DomainEvent<
  "TodoUpdated",
  { id: string; text?: string; completed?: boolean }
> {
  get type() {
    return "TodoUpdated" as const;
  }
}

export class TodoUndoEvent extends DomainEvent<
  "TodoUndo",
  Record<string, never>
> {
  get type() {
    return "TodoUndo" as const;
  }
}

export class TodoRedoEvent extends DomainEvent<
  "TodoRedo",
  Record<string, never>
> {
  get type() {
    return "TodoRedo" as const;
  }
}

export type TodoEvent =
  | TodoCreatedEvent
  | TodoDeletedEvent
  | TodoUpdatedEvent
  | TodoUndoEvent
  | TodoRedoEvent;

export type AppEvent =
  | TodoEvent
  | StopwatchPlayEvent
  | StopwatchPauseEvent
  | StopwatchStopEvent;

/**
 * Event handlers for all app events (Todo and Stopwatch).
 * Receives StatePort from framework (React, Solid, etc.) to store events.
 */
export class AppEventHandlers implements Disposable {
  constructor(
    eventBus: EventBusInterface,
    eventLogPort: StatePort<AppEvent[]>,
  ) {
    function addToEventLogPort(event: AppEvent) {
      eventLogPort.set((prev) => [...prev, event]);
    }
    // Register all event handlers using createEventBusHandlers
    createEventBusHandlers(this, eventBus)
      .on<TodoCreatedEvent>("TodoCreated", addToEventLogPort)
      .on<TodoDeletedEvent>("TodoDeleted", addToEventLogPort)
      .on<TodoUpdatedEvent>("TodoUpdated", addToEventLogPort)
      .on<TodoUndoEvent>("TodoUndo", addToEventLogPort)
      .on<TodoRedoEvent>("TodoRedo", addToEventLogPort)
      // Register stopwatch event handlers
      .on<StopwatchPlayEvent>("StopwatchPlay", addToEventLogPort)
      .on<StopwatchPauseEvent>("StopwatchPause", addToEventLogPort)
      .on<StopwatchStopEvent>("StopwatchStop", addToEventLogPort)
      .build();
  }

  /**
   * Dispose of the event handlers, cleaning up all subscriptions.
   * Implements Disposable interface for automatic cleanup.
   */
  [Symbol.dispose](): void {
    SubscriptionsRegistry.cleanup(this);
  }

  /**
   * Clear the event log.
   */
  clearEventLog(eventLogPort: StatePort<AppEvent[]>): void {
    eventLogPort.set([]);
  }
}
