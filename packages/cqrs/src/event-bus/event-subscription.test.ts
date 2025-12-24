import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventSubscription } from "./event-subscription";
import { EventBus } from "./event-bus";
import { DomainEvent } from "./event";
import type { UntypedLocalEventHandler } from "./types";

interface UserCreatedPayload {
  userId: string;
  email: string;
}

class UserCreatedEvent extends DomainEvent<"UserCreated", UserCreatedPayload> {
  get type(): "UserCreated" {
    return "UserCreated";
  }
}

describe("EventSubscription", () => {
  let bus: EventBus;
  let mockHandler: UntypedLocalEventHandler;

  beforeEach(() => {
    bus = new EventBus();
    mockHandler = vi.fn(async () => {});
    Object.defineProperty(mockHandler, "name", { value: "MockHandler" });
  });

  it("should register handler immediately when created", async () => {
    new EventSubscription(() => {
      return bus.registerLocalHandler("UserCreated", mockHandler);
    });

    const event = new UserCreatedEvent({
      userId: "1",
      email: "test@example.com",
    });
    await bus.publish(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(event);
  });

  it("should unsubscribe handler when disposed", async () => {
    const subscription = new EventSubscription(() => {
      return bus.registerLocalHandler("UserCreated", mockHandler);
    });

    const event = new UserCreatedEvent({
      userId: "1",
      email: "test@example.com",
    });

    // Handler should be called before dispose
    await bus.publish(event);
    expect(mockHandler).toHaveBeenCalledTimes(1);

    // Dispose the subscription
    subscription[Symbol.dispose]();

    // Handler should not be called after dispose
    await bus.publish(event);
    expect(mockHandler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it("should handle multiple subscriptions in single EventSubscription", async () => {
    const handler1 = vi.fn(async () => {});
    const handler2 = vi.fn(async () => {});
    Object.defineProperty(handler1, "name", { value: "Handler1" });
    Object.defineProperty(handler2, "name", { value: "Handler2" });

    const subscription = new EventSubscription(() => {
      const unsub1 = bus.registerLocalHandler("UserCreated", handler1);
      const unsub2 = bus.registerLocalHandler("UserCreated", handler2);
      return () => {
        unsub1();
        unsub2();
      };
    });

    const event = new UserCreatedEvent({
      userId: "1",
      email: "test@example.com",
    });

    // Both handlers should be called
    await bus.publish(event);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    // Dispose the subscription
    subscription[Symbol.dispose]();

    // Neither handler should be called after dispose
    await bus.publish(event);
    expect(handler1).toHaveBeenCalledTimes(1); // Still 1
    expect(handler2).toHaveBeenCalledTimes(1); // Still 1
  });

  it("should be idempotent (safe to call dispose multiple times)", () => {
    const unsubscribe = vi.fn();
    const subscription = new EventSubscription(() => unsubscribe);

    subscription[Symbol.dispose]();
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    subscription[Symbol.dispose]();
    expect(unsubscribe).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it("should track disposed state", () => {
    const subscription = new EventSubscription(() => {
      return bus.registerLocalHandler("UserCreated", mockHandler);
    });

    expect(subscription.disposed).toBe(false);

    subscription[Symbol.dispose]();
    expect(subscription.disposed).toBe(true);
  });

  it("should handle different event types in single subscription", async () => {
    interface UserDeletedPayload {
      userId: string;
    }

    class UserDeletedEvent extends DomainEvent<
      "UserDeleted",
      UserDeletedPayload
    > {
      get type(): "UserDeleted" {
        return "UserDeleted";
      }
    }

    const createdHandler = vi.fn(async () => {});
    const deletedHandler = vi.fn(async () => {});
    Object.defineProperty(createdHandler, "name", { value: "CreatedHandler" });
    Object.defineProperty(deletedHandler, "name", { value: "DeletedHandler" });

    const subscription = new EventSubscription(() => {
      const unsub1 = bus.registerLocalHandler("UserCreated", createdHandler);
      const unsub2 = bus.registerLocalHandler("UserDeleted", deletedHandler);
      return () => {
        unsub1();
        unsub2();
      };
    });

    const createdEvent = new UserCreatedEvent({
      userId: "1",
      email: "test@example.com",
    });
    const deletedEvent = new UserDeletedEvent({ userId: "1" });

    await bus.publish(createdEvent);
    expect(createdHandler).toHaveBeenCalledTimes(1);
    expect(deletedHandler).not.toHaveBeenCalled();

    await bus.publish(deletedEvent);
    expect(createdHandler).toHaveBeenCalledTimes(1);
    expect(deletedHandler).toHaveBeenCalledTimes(1);

    subscription[Symbol.dispose]();

    await bus.publish(createdEvent);
    await bus.publish(deletedEvent);
    expect(createdHandler).toHaveBeenCalledTimes(1); // Still 1
    expect(deletedHandler).toHaveBeenCalledTimes(1); // Still 1
  });
});
