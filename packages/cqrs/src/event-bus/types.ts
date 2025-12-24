export interface DomainEventInterface<TType extends string, TPayload> {
  id: string;
  type: TType;
  timestamp: Date;
  payload: TPayload;
}

export interface RemoteDomainEventMarkerInterface {
  isRemote: true;
}

export type UntypedDomainEventType = DomainEventInterface<string, object>;

export type DomainEventConstructorOptions = Partial<
  Pick<UntypedDomainEventType, "id" | "timestamp">
>;

export interface RemotePublisherInterface {
  sendRemote(serializedEvent: string): Promise<void>;
}

export type LocalEventHandler<T extends UntypedDomainEventType> = (
  event: DomainEventInterface<T["type"], T["payload"]>,
) => void | Promise<void>;

export type UntypedLocalEventHandler =
  LocalEventHandler<UntypedDomainEventType>;

export interface PublishResultInterface {
  status: "rejected" | "fulfilled";
  handlerName: string;
  reason?: unknown;
}

export interface EventBusInterface {
  registerLocalHandler<THandlerOrEvent>(
    eventType: InferEventTypeFromHandlerOrEvent<THandlerOrEvent>,
    handler: InferHandlerFromHandlerOrEvent<THandlerOrEvent>,
  ): () => void;
  publish(event: UntypedDomainEventType): Promise<PublishResultInterface[]>;
  receiveFromRemote(rawEvent: string): Promise<void>;
}

export type InferEventTypeFromHandlerOrEvent<THandlerOrEvent> =
  THandlerOrEvent extends LocalEventHandler<infer TEvent>
    ? TEvent["type"]
    : THandlerOrEvent extends DomainEventInterface<infer TType, infer _TPayload>
      ? TType
      : never;

export type InferHandlerFromHandlerOrEvent<THandlerOrEvent> =
  THandlerOrEvent extends UntypedLocalEventHandler
    ? THandlerOrEvent
    : THandlerOrEvent extends UntypedDomainEventType
      ? LocalEventHandler<THandlerOrEvent>
      : never;
