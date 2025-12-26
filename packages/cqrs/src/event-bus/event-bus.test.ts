/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, afterEach } from "vitest";
import { ViewModel } from "@xndrjs/core";
import { DomainEvent } from "./event";
import { EventSerializer } from "./event-serializer";
import { EventBus } from "./event-bus";
import { createEventBusHandlers } from "./create-event-bus-handlers";

// Helper to create a ViewModel for tests
class TestViewModel extends ViewModel {}
import type {
  UntypedDomainEventType,
  RemotePublisherInterface,
  RemoteDomainEventMarkerInterface,
  PublishResultInterface,
  UntypedLocalEventHandler,
} from "./types";
import type { MonitoringPortInterface } from "../common/monitoring-port";

interface UserCreatedPayload {
  userId: string;
  email: string;
}

// Extend DomainEvent for class tests
class UserCreatedEvent extends DomainEvent<"UserCreated", UserCreatedPayload> {
  get type() {
    return "UserCreated" as const;
  }
}

interface UserDeletedPayload {
  userId: string;
  email: string;
}

// Extend DomainEvent for class tests
class UserDeletedEvent extends DomainEvent<"UserDeleted", UserDeletedPayload> {
  get type() {
    return "UserDeleted" as const;
  }
}

// Extend DomainEvent for hybrid tests (with 'isRemote' property)
class RemoteUserCreatedEvent
  extends DomainEvent<"UserCreated", UserCreatedPayload>
  implements RemoteDomainEventMarkerInterface
{
  get type() {
    return "UserCreated" as const;
  }
  isRemote = true as const;
}

const mockMonitoring: MonitoringPortInterface = {
  trackInfrastructureError: vi.fn(),
  trackDomainError: vi.fn(),
};

class MockRemotePublisher implements RemotePublisherInterface {
  sendRemote = vi.fn(async (serializedEvent: string): Promise<void> => {
    if (serializedEvent.includes("FAIL_REMOTE")) {
      throw new Error("Remote Send Failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

// --------------------------------------------------------------------------
// TEST: DomainEvent Class
// --------------------------------------------------------------------------

describe("DomainEvent", () => {
  it("should generate default ID and timestamp if not provided", () => {
    const event = new UserCreatedEvent({
      userId: "1",
      email: "a@b.com",
    });
    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.type).toBe("UserCreated");
  });

  it("should use the provided ID and timestamp", () => {
    const customId = "custom-123";
    const customTimestamp = new Date("2024-01-01T10:00:00.000Z");
    const event = new UserCreatedEvent(
      { userId: "1", email: "a@b.com" },
      {
        id: customId,
        timestamp: customTimestamp,
      },
    );
    expect(event.id).toBe(customId);
    expect(event.timestamp.getTime()).toBe(customTimestamp.getTime());
  });
});

// --------------------------------------------------------------------------
// TEST: EventSerializer
// --------------------------------------------------------------------------

describe("EventSerializer", () => {
  const originalEvent: UntypedDomainEventType = new UserCreatedEvent(
    { userId: "2", email: "test@example.com" },
    {
      id: "ser-1",
      timestamp: new Date("2024-02-02T12:00:00.000Z"),
    },
  );

  it("should serialize an event to a JSON string", () => {
    const serialized = EventSerializer.serialize(originalEvent);
    const parsed = JSON.parse(serialized);

    expect(typeof serialized).toBe("string");
    expect(parsed.id).toBe(originalEvent.id);
    expect(parsed.type).toBe(originalEvent.type);
    expect(parsed.payload.email).toBe("test@example.com");
  });

  it("should deserialize a JSON string back to the correct event object", () => {
    const serialized = EventSerializer.serialize(originalEvent);
    const deserialized = EventSerializer.deserialize(serialized);

    expect(deserialized.id).toBe(originalEvent.id);
    expect(deserialized.type).toBe(originalEvent.type);
    expect(deserialized.payload).toEqual(originalEvent.payload);
    expect(deserialized.timestamp.toISOString()).toBe(
      originalEvent.timestamp.toISOString(),
    );
  });
});

// --------------------------------------------------------------------------
// TEST: EventBus (local only, no remote)
// --------------------------------------------------------------------------

describe("EventBus (local only)", () => {
  const owners: ViewModel[] = [];

  afterEach(() => {
    // Cleanup all ViewModels created during tests (except those already disposed)
    owners.forEach((owner) => {
      if (!owner.disposed) {
        owner[Symbol.dispose]();
      }
    });
    owners.length = 0;
  });
  let bus: EventBus;
  let mockHandler1: UntypedLocalEventHandler;
  let mockHandler2: UntypedLocalEventHandler;
  const event = new UserCreatedEvent({
    userId: "3",
    email: "inmemory@test.com",
  });

  beforeEach(() => {
    bus = new EventBus({ monitoringService: mockMonitoring });

    // Success/failure handler: use a named function for a robust name
    const HandlerSuccessOrFail: UntypedLocalEventHandler = async (
      e: UntypedDomainEventType,
    ) => {
      // Simulate an async action
      await new Promise((resolve) => setTimeout(resolve, 1));
      if ((e.payload as any).userId === "FAIL") {
        throw new Error("Domain Logic Failed");
      }
    };

    // Success handler: use a named function for a robust name
    const HandlerAlwaysSuccess: UntypedLocalEventHandler = async () => {};

    mockHandler1 = vi.fn(HandlerSuccessOrFail);
    mockHandler2 = vi.fn(HandlerAlwaysSuccess);

    Object.defineProperty(mockHandler1, "name", {
      value: "HandlerSuccessOrFail",
    });
    Object.defineProperty(mockHandler2, "name", {
      value: "HandlerAlwaysSuccess",
    });
  });

  it("should register a handler and publish an event successfully", async () => {
    bus.registerLocalHandler<UserCreatedEvent>("UserCreated", mockHandler1);
    await bus.publish(event);

    expect(mockHandler1).toHaveBeenCalledWith(event);
    expect(mockMonitoring.trackDomainError).not.toHaveBeenCalled();
  });

  it("should execute multiple handlers in parallel and wait for all to resolve", async () => {
    bus.registerLocalHandler<UserCreatedEvent>("UserCreated", mockHandler1);
    bus.registerLocalHandler<UserCreatedEvent>("UserCreated", mockHandler2);

    // Publish and get results
    const results = await bus.publish(event);

    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });

  it("should track one handler's error, but continue with others and return correct status", async () => {
    // Register one handler that will fail
    bus.registerLocalHandler<UserCreatedEvent>("UserCreated", mockHandler1); // Fails if userId is 'FAIL'
    bus.registerLocalHandler<UserCreatedEvent>("UserCreated", mockHandler2); // Will succeed

    const failingEvent = new UserCreatedEvent({
      userId: "FAIL",
      email: "fail@test.com",
    });

    const results = await bus.publish(failingEvent);

    // The error is tracked
    expect(mockMonitoring.trackDomainError).toHaveBeenCalledTimes(1);

    // The second handler was still called
    expect(mockHandler2).toHaveBeenCalledTimes(1);

    // Verify the status of the results
    expect(results).toHaveLength(2);

    const failingResult = results.find(
      (r) => r.handlerName === "HandlerSuccessOrFail",
    ) as PublishResultInterface;
    const successResult = results.find(
      (r) => r.handlerName === "HandlerAlwaysSuccess",
    ) as PublishResultInterface;

    expect(failingResult.status).toBe("rejected");
    expect(failingResult.reason).toBeInstanceOf(Error);
    expect(successResult.status).toBe("fulfilled");
  });

  it("should correctly unregister a handler", async () => {
    const unsubscribe = bus.registerLocalHandler<UserCreatedEvent>(
      "UserCreated",
      mockHandler1,
    );
    bus.registerLocalHandler<UserCreatedEvent>("UserCreated", mockHandler2);

    unsubscribe(); // Unregister HandlerSuccessOrFail

    await bus.publish(event);

    expect(mockHandler1).not.toHaveBeenCalled();
    expect(mockHandler2).toHaveBeenCalledTimes(1);

    const results = await bus.publish(event);
    expect(results).toHaveLength(1); // Only HandlerAlwaysSuccess is remaining
  });

  it("should handle an event with no registered handlers", async () => {
    // No handlers registered
    const results = await bus.publish(event);

    expect(results).toEqual([]);
    expect(mockMonitoring.trackDomainError).not.toHaveBeenCalled();
  });

  it("should register multiple handlers with EventHandlerBuilder", async () => {
    const handler3: UntypedLocalEventHandler = vi.fn(async () => {});
    Object.defineProperty(handler3, "name", { value: "Handler3" });

    const owner = new TestViewModel();
    owners.push(owner);
    createEventBusHandlers(owner, bus)
      .on<UserCreatedEvent>("UserCreated", mockHandler1)
      .on<UserCreatedEvent>("UserCreated", mockHandler2)
      .on<UserCreatedEvent>("UserCreated", handler3)
      .build();

    const results = await bus.publish(event);
    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
    expect(handler3).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(3);
  });

  it("should unsubscribe all handlers when calling the returned cleanup function", async () => {
    const handler3: UntypedLocalEventHandler = vi.fn(async () => {});
    Object.defineProperty(handler3, "name", { value: "Handler3" });

    const owner = new TestViewModel();
    createEventBusHandlers(owner, bus)
      .on<UserCreatedEvent>("UserCreated", mockHandler1)
      .on<UserCreatedEvent>("UserCreated", mockHandler2)
      .on<UserCreatedEvent>("UserCreated", handler3)
      .build();

    // Verify all handlers are registered
    let results = await bus.publish(event);
    expect(results).toHaveLength(3);

    // Unsubscribe all at once by disposing owner
    owner[Symbol.dispose]();

    // Verify no handlers are called
    results = await bus.publish(event);
    expect(results).toHaveLength(0);
  });

  it("should register handlers for different event types with EventHandlerBuilder", async () => {
    const userDeletedHandler: UntypedLocalEventHandler = vi.fn(async () => {});
    Object.defineProperty(userDeletedHandler, "name", {
      value: "UserDeletedHandler",
    });

    const owner = new TestViewModel();
    createEventBusHandlers(owner, bus)
      .on<UserCreatedEvent>("UserCreated", mockHandler1)
      .on<UserDeletedEvent>("UserDeleted", userDeletedHandler)
      .build();

    // Publish UserCreated event
    let results = await bus.publish(event);
    expect(mockHandler1).toHaveBeenCalledTimes(1);
    expect(userDeletedHandler).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);

    // Publish UserDeleted event
    const deleteEvent = new UserCreatedEvent({
      userId: "10",
      email: "deleted@test.com",
    });
    // Override type for this test
    Object.defineProperty(deleteEvent, "type", { value: "UserDeleted" });
    results = await bus.publish(deleteEvent);
    expect(userDeletedHandler).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
  });

  it("should work with EventHandlerBuilder", async () => {
    const handler2: UntypedLocalEventHandler = vi.fn(async () => {});
    const handler3: UntypedLocalEventHandler = vi.fn(async () => {});

    // Use builder pattern for fluent API
    const owner = new TestViewModel();
    createEventBusHandlers(owner, bus)
      .on<UserCreatedEvent>("UserCreated", handler2)
      .on<UserCreatedEvent>("UserCreated", handler3)
      .build();

    // Verify handlers are registered
    let results = await bus.publish(event);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler3).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);

    // Unsubscribe all handlers registered via builder by disposing owner
    owner[Symbol.dispose]();

    // Should not trigger handlers anymore
    results = await bus.publish(event);
    expect(handler2).toHaveBeenCalledTimes(1); // Still 1, not called again
    expect(handler3).toHaveBeenCalledTimes(1); // Still 1, not called again
    expect(results).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// TEST: EventBus
// --------------------------------------------------------------------------

describe("EventBus", () => {
  let bus: EventBus;
  let mockRemotePublisher: MockRemotePublisher;
  let mockHandler: UntypedLocalEventHandler;
  const eventLocal = new UserCreatedEvent({
    userId: "4",
    email: "hybrid@test.com",
  });
  const eventRemote = new RemoteUserCreatedEvent({
    userId: "5",
    email: "remote@test.com",
  });

  beforeEach(() => {
    mockRemotePublisher = new MockRemotePublisher();

    bus = new EventBus({
      remotePublisher: mockRemotePublisher,
      monitoringService: mockMonitoring,
    });

    mockHandler = vi.fn(async () => {});
    Object.defineProperty(mockHandler, "name", { value: "HybridLocalHandler" });

    bus.registerLocalHandler<UserCreatedEvent>("UserCreated", mockHandler);

    vi.spyOn(EventSerializer, "serialize");
    vi.spyOn(EventSerializer, "deserialize");
  });

  it("should publish the event only locally if not marked as remote", async () => {
    const results = await bus.publish(eventLocal);

    // EventSerializer should not be called
    expect(EventSerializer.serialize).not.toHaveBeenCalled();
    // RemotePublisher should not be called
    expect(mockRemotePublisher.sendRemote).not.toHaveBeenCalled();

    // Verify results: only 1 (from local handler)
    expect(results).toHaveLength(1);
    expect(results[0]?.handlerName).toBe("HybridLocalHandler");
    expect(results[0]?.status).toBe("fulfilled");
  });

  it("should publish both locally and remotely if marked as remote", async () => {
    const results = await bus.publish(eventRemote);

    // Serialization MUST occur
    expect(EventSerializer.serialize).toHaveBeenCalledWith(eventRemote);
    // RemotePublisher MUST be called
    expect(mockRemotePublisher.sendRemote).toHaveBeenCalledTimes(1);

    // Verify results: 2 (Local Handler + Remote Publisher)
    expect(results).toHaveLength(2);
    expect(
      results.some(
        (r) =>
          r.handlerName === "HybridLocalHandler" && r.status === "fulfilled",
      ),
    ).toBe(true);
    expect(
      results.some(
        (r) => r.handlerName === "RemotePublisher" && r.status === "fulfilled",
      ),
    ).toBe(true);
  });

  it("should track RemotePublisher failure but complete the flow", async () => {
    // Create an event that will force remote failure (based on MockRemotePublisher logic)
    const failingEventRemote = new RemoteUserCreatedEvent({
      userId: "FAIL_REMOTE",
      email: "failremote@test.com",
    });

    const results = await bus.publish(failingEventRemote);

    // Infrastructure error is tracked
    expect(mockMonitoring.trackInfrastructureError).toHaveBeenCalledTimes(1);
    // Remote publisher is called once
    expect(mockRemotePublisher.sendRemote).toHaveBeenCalledTimes(1);

    // Verify results: 2 (Local Handler (fulfilled) + Remote Publisher (rejected))
    expect(results).toHaveLength(2);
    expect(
      results.some(
        (r) =>
          r.handlerName === "HybridLocalHandler" && r.status === "fulfilled",
      ),
    ).toBe(true);
    expect(
      results.some(
        (r) => r.handlerName === "RemotePublisher" && r.status === "rejected",
      ),
    ).toBe(true);
  });

  it("should handle events received from remote (receiveFromRemote)", async () => {
    const rawEvent =
      '{"id":"rc-1","type":"UserCreated","timestamp":"2024-03-03T14:00:00.000Z","payload":{"userId":"6","email":"received@test.com"}}';

    await bus.receiveFromRemote(rawEvent);

    // The event must be deserialized
    expect(EventSerializer.deserialize).toHaveBeenCalledWith(rawEvent);

    // And the local handler MUST be called with the deserialized Event object
    expect(mockHandler).toHaveBeenCalledTimes(1);
    const publishedEvent = (mockHandler as any).mock
      .calls[0][0] as UntypedDomainEventType;
    expect(publishedEvent.id).toBe("rc-1");
    expect((publishedEvent.payload as any).email).toBe("received@test.com");
  });
});
