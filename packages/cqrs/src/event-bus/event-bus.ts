import { EventSerializer } from "./event-serializer";
import type {
  RemotePublisherInterface,
  UntypedDomainEventType,
  RemoteDomainEventMarkerInterface,
  PublishResultInterface,
  EventBusInterface,
  InferEventTypeFromHandlerOrEvent,
  InferHandlerFromHandlerOrEvent,
  UntypedLocalEventHandler,
} from "./types";
import type { MonitoringPortInterface } from "../common";

export class EventBus implements EventBusInterface {
  private handlers = new Map<string, UntypedLocalEventHandler[]>();
  private remotePublisher: RemotePublisherInterface | null;
  private monitoringService: MonitoringPortInterface | null;

  constructor({
    remotePublisher,
    monitoringService,
  }: {
    remotePublisher?: RemotePublisherInterface;
    monitoringService?: MonitoringPortInterface;
  } = {}) {
    this.remotePublisher = remotePublisher ?? null;
    this.monitoringService = monitoringService ?? null;
  }

  registerLocalHandler<THandlerOrEvent>(
    eventType: InferEventTypeFromHandlerOrEvent<THandlerOrEvent>,
    handler: InferHandlerFromHandlerOrEvent<THandlerOrEvent>,
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    const untypedHandler = handler as UntypedLocalEventHandler;
    this.handlers.get(eventType)?.push(untypedHandler);
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(untypedHandler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  async publish(event: UntypedDomainEventType) {
    const untypedEvent = event;

    const isRemote =
      "isRemote" in event
        ? (event as RemoteDomainEventMarkerInterface).isRemote
        : false;

    const localPromise = this.publishLocal(untypedEvent);

    const remotePromise: Promise<PublishResultInterface[]> = isRemote
      ? this.sendRemote(untypedEvent)
      : Promise.resolve([]);

    const results = await Promise.all([localPromise, remotePromise]);
    return results.flat();
  }

  async receiveFromRemote(rawEvent: string): Promise<void> {
    const event = EventSerializer.deserialize(rawEvent);
    await this.publishLocal(event);
  }

  private async publishLocal(event: UntypedDomainEventType) {
    const handlers = [...(this.handlers.get(event.type) || [])];
    const localPromises = handlers.map((handler) => {
      const handlerName = handler.name ?? handler.constructor.name;
      // Wrap handler result in Promise.resolve() to support both sync and async handlers
      return Promise.resolve(handler(event))
        .then(() => ({
          status: "fulfilled" as const,
          handlerName,
        }))
        .catch((error) => {
          this.monitoringService?.trackDomainError(
            "LocalHandler",
            error as unknown,
          );
          return {
            status: "rejected" as const,
            handlerName,
            reason: error as unknown,
          };
        });
    });

    return Promise.all(localPromises);
  }

  private async sendRemote(
    event: UntypedDomainEventType,
  ): Promise<PublishResultInterface[]> {
    if (!this.remotePublisher) {
      return [];
    }

    try {
      await this.remotePublisher.sendRemote(EventSerializer.serialize(event));
      return [
        {
          status: "fulfilled" as const,
          handlerName: "RemotePublisher",
        },
      ];
    } catch (error) {
      this.monitoringService?.trackInfrastructureError(
        "RemotePublisher",
        error as unknown,
      );
      return [
        {
          status: "rejected" as const,
          handlerName: "RemotePublisher",
          reason: error as unknown,
        },
      ];
    }
  }
}
