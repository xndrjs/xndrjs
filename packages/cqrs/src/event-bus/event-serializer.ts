import type { UntypedDomainEventType } from "./types";

export const EventSerializer = {
  serialize(event: UntypedDomainEventType): string {
    return JSON.stringify({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      payload: event.payload,
    });
  },

  deserialize(rawEvent: string): UntypedDomainEventType {
    const data = JSON.parse(rawEvent);
    return {
      id: data.id,
      type: data.type,
      timestamp: new Date(data.timestamp),
      payload: data.payload,
    } as UntypedDomainEventType;
  },
};
