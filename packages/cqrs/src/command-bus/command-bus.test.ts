import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandBus } from "./command-bus";
import {
  type RemoteCommandSenderInterface,
  type UntypedCommandType,
  type CommandHandlerInterface,
  Command,
} from "./types"; // Assuming 'types' is in the same directory
import type { MonitoringPortInterface } from "../common";

interface TestPayload {
  data: string;
}

class TestCommand extends Command<"TestCommand", TestPayload> {
  public isRemote: boolean = false;

  get type(): "TestCommand" {
    return "TestCommand";
  }
}

// 1. Mock Command creation
const createTestCommand = (isRemote: boolean = false): TestCommand => {
  const c = new TestCommand(
    { data: "test-data" },
    {
      id: "cmd-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
    },
  );
  c.isRemote = isRemote;
  return c;
};

// 2. Mock Command Handler
const mockHandler: CommandHandlerInterface<TestCommand> = {
  handle: vi.fn(async (command: TestCommand) => {
    if (command.payload.data === "fail") {
      throw new Error("Local handler failed execution");
    }
  }),
};

// 3. Mock Remote Sender
const mockRemoteSender: RemoteCommandSenderInterface = {
  sendRemote: vi.fn(async (serializedCommand: string) => {
    const command = JSON.parse(serializedCommand) as TestCommand;
    if (command.payload.data === "network-fail") {
      throw new Error("Simulated Network Error");
    }
    // Success otherwise
  }),
};

// 4. Mock Monitoring Service
const mockMonitoringService: MonitoringPortInterface = {
  trackInfrastructureError: vi.fn(),
  trackDomainError: vi.fn(), // Added for completeness, although not used here
};

// --- Test Suite ---

describe("CommandBus", () => {
  let dispatcherWithRemote: CommandBus;
  let dispatcherLocalOnly: CommandBus;

  beforeEach(() => {
    // Setup two dispatchers: one with RemoteSender and one without
    dispatcherWithRemote = new CommandBus({
      remoteSender: mockRemoteSender,
      monitoringService: mockMonitoringService,
    });
    dispatcherWithRemote.registerLocalHandler("TestCommand", mockHandler);

    dispatcherLocalOnly = new CommandBus({
      monitoringService: mockMonitoringService,
      // remoteSender is omitted
    });
    dispatcherLocalOnly.registerLocalHandler("TestCommand", mockHandler);
  });

  // ---------------------------------------------
  // Test RegisterLocalHandler
  // ---------------------------------------------

  describe("registerLocalHandler", () => {
    it("should throw and track error if the same command type is registered twice", () => {
      // Already registered in beforeEach
      const secondHandler: CommandHandlerInterface<TestCommand> = {
        handle: vi.fn(),
      };

      expect(() => {
        dispatcherWithRemote.registerLocalHandler("TestCommand", secondHandler);
      }).toThrow(/Multiple handlers detected for Command type: TestCommand/);

      expect(
        mockMonitoringService.trackInfrastructureError,
      ).toHaveBeenCalledWith(
        "MULTIPLE_HANDLERS_FOR_COMMAND",
        expect.objectContaining({
          cause: {
            code: "MULTIPLE_HANDLERS_FOR_COMMAND",
            commandType: "TestCommand",
            errorType: "CommandBusError",
          },
        }),
      );
    });
  });

  // ---------------------------------------------
  // Test Scenario: Local Command
  // ---------------------------------------------

  describe("Local Command Dispatch", () => {
    it("should successfully dispatch to the local handler if not remote", async () => {
      const command = createTestCommand(false);
      await dispatcherWithRemote.dispatch(command);

      expect(mockHandler.handle).toHaveBeenCalledWith(command);
      expect(mockRemoteSender.sendRemote).not.toHaveBeenCalled();
      expect(
        mockMonitoringService.trackInfrastructureError,
      ).not.toHaveBeenCalled();
    });

    it("should throw and track NO_HANDLER_FOR_COMMAND if no local handler is registered", async () => {
      const command: UntypedCommandType = {
        type: "UnknownCommand",
        timestamp: new Date(),
        id: "u-1",
        payload: {},
      };

      await expect(dispatcherWithRemote.dispatch(command)).rejects.toThrow(
        /No handler registered for local Command type: UnknownCommand/,
      );

      // NO_HANDLER tracked
      expect(
        mockMonitoringService.trackInfrastructureError,
      ).toHaveBeenCalledWith(
        "NO_HANDLER_FOR_COMMAND",
        expect.objectContaining({
          cause: {
            code: "NO_HANDLER_FOR_COMMAND",
            commandType: "UnknownCommand",
            errorType: "CommandBusError",
          },
        }),
      );
    });

    it("should throw and track LOCAL_HANDLER_EXECUTION_FAILED if handler fails", async () => {
      const failingCommand = createTestCommand(false);
      failingCommand.payload.data = "fail";

      await expect(
        dispatcherWithRemote.dispatch(failingCommand),
      ).rejects.toThrow("Local handler failed execution");

      expect(
        mockMonitoringService.trackInfrastructureError,
      ).toHaveBeenCalledWith(
        "LOCAL_HANDLER_EXECUTION_FAILED",
        expect.objectContaining({
          cause: {
            code: "LOCAL_HANDLER_EXECUTION_FAILED",
            commandType: "TestCommand",
            commandId: expect.any(String),
            errorType: "CommandBusError",
          },
        }),
      );
    });
  });

  // ---------------------------------------------
  // Test Scenario: Remote Command (Success & Failure)
  // ---------------------------------------------

  describe("Remote Command Dispatch (Sender Configured)", () => {
    it("should successfully serialize and send remote command", async () => {
      const command = createTestCommand(true);
      await dispatcherWithRemote.dispatch(command);

      expect(mockRemoteSender.sendRemote).toHaveBeenCalledWith(
        expect.any(String),
      );
      expect(mockHandler.handle).not.toHaveBeenCalled();
      expect(
        mockMonitoringService.trackInfrastructureError,
      ).not.toHaveBeenCalled();
    });

    it("should throw and track REMOTE_SEND_FAILED if remoteSender fails", async () => {
      const failingRemoteCommand = createTestCommand(true);
      failingRemoteCommand.payload.data = "network-fail";

      await expect(
        dispatcherWithRemote.dispatch(failingRemoteCommand),
      ).rejects.toThrow(/Failed to send remote command TestCommand/);

      expect(
        mockMonitoringService.trackInfrastructureError,
      ).toHaveBeenCalledWith(
        "REMOTE_SEND_FAILED",
        expect.objectContaining({
          cause: expect.objectContaining({
            code: "REMOTE_SEND_FAILED",
            remoteError: "Simulated Network Error",
            errorType: "CommandBusError",
          }),
        }),
      );
    });
  });

  // ---------------------------------------------
  // Test Scenario: Remote Command (Missing Sender)
  // ---------------------------------------------

  describe("Remote Command Dispatch (Sender NOT Configured)", () => {
    it("should throw and track REMOTE_SENDER_NOT_CONFIGURED when remote command is used without sender", async () => {
      const remoteCommand = createTestCommand(true);

      // Use the dispatcher configured WITHOUT remoteSender
      await expect(dispatcherLocalOnly.dispatch(remoteCommand)).rejects.toThrow(
        /RemoteSender service is not configured/,
      );

      // REMOTE_SENDER_NOT_CONFIGURED tracked
      expect(
        mockMonitoringService.trackInfrastructureError,
      ).toHaveBeenCalledWith(
        "REMOTE_SENDER_NOT_CONFIGURED",
        expect.objectContaining({
          cause: {
            code: "REMOTE_SENDER_NOT_CONFIGURED",
            commandType: "TestCommand",
            errorType: "CommandBusError",
          },
        }),
      );
      expect(mockRemoteSender.sendRemote).not.toHaveBeenCalled();
    });
  });
});
