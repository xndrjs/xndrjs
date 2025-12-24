import type {
  DomainEventConstructorOptions,
  DomainEventInterface,
} from "./types";

export abstract class DomainEvent<
  TType extends string,
  TPayload,
> implements DomainEventInterface<TType, TPayload> {
  id: string;
  timestamp: Date;
  payload: TPayload;

  constructor(payload: TPayload, options?: DomainEventConstructorOptions) {
    this.id = options?.id ?? crypto.randomUUID();
    this.timestamp = options?.timestamp ?? new Date();
    this.payload = payload;
  }

  abstract get type(): TType;
}
