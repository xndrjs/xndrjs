import type { Disposable } from "@xndrjs/core";
import { SubscriptionsRegistry } from "@xndrjs/core";
import type {
  EventBusInterface,
  UntypedLocalEventHandler,
  UntypedDomainEventType,
  InferHandlerFromHandlerOrEvent,
  InferEventTypeFromHandlerOrEvent,
} from "./types";

interface LocalEventHandlerRegistration {
  eventType: string;
  handler: UntypedLocalEventHandler;
}

interface EventHandlersOnBuilder {
  on<THandlerOrEvent>(
    eventType: InferEventTypeFromHandlerOrEvent<THandlerOrEvent>,
    handler: InferHandlerFromHandlerOrEvent<THandlerOrEvent>,
  ): EventHandlersOnBuilder;
  build(): void;
}

/**
 * Creates event handlers with pattern builder.
 * The handlers are automatically registered in SubscriptionsRegistry
 * for cleanup when the owner is disposed.
 *
 * @param owner - The Disposable owner that will own these event handlers
 * @param bus - The EventBus to register handlers with
 * @returns Builder for chaining: `.on(eventType, handler).on(...).build()`
 *
 * @example
 * ```typescript
 * class MyClass extends DisposableResource {
 *   private _handlers = createEventBusHandlers(this, eventBus)
 *     .on(MyEvent, async (event) => { /* handle *\/ })
 *     .on(OtherEvent, async (event) => { /* handle *\/ })
 *     .build();
 * }
 * ```
 */
export function createEventBusHandlers(
  owner: Disposable,
  bus: EventBusInterface,
): EventHandlersOnBuilder {
  const handlers: LocalEventHandlerRegistration[] = [];

  const builder: EventHandlersOnBuilder = {
    on<THandlerOrEvent>(
      eventType: InferEventTypeFromHandlerOrEvent<THandlerOrEvent>,
      handler: InferHandlerFromHandlerOrEvent<THandlerOrEvent>,
    ): EventHandlersOnBuilder {
      handlers.push({
        eventType,
        handler: handler as UntypedLocalEventHandler,
      });
      return builder;
    },
    build(): void {
      const unsubscribers = handlers.map(({ eventType, handler }) =>
        bus.registerLocalHandler<UntypedDomainEventType>(eventType, handler),
      );

      const combinedUnsubscribe = () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };

      // Register in SubscriptionsRegistry for automatic cleanup
      SubscriptionsRegistry.register(owner, combinedUnsubscribe);
    },
  };

  return builder;
}
