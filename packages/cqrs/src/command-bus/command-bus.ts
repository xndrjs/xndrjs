import type { MonitoringPortInterface } from "../common";
import { CommandSerializer } from "./command-serializer";
import {
  type UntypedCommandType,
  type CommandHandlerInterface,
  type RemoteCommandSenderInterface,
  type RemoteCommandMarkerInterface,
  type CommandBusInterface,
  type CommandBusError,
} from "./types";

export interface CommandBusConstructorProps {
  remoteSender?: RemoteCommandSenderInterface;
  monitoringService?: MonitoringPortInterface;
}

export class CommandBus implements CommandBusInterface {
  private localHandlers = new Map<
    string,
    CommandHandlerInterface<UntypedCommandType>
  >();
  private remoteSender: RemoteCommandSenderInterface | null;
  private monitoringService: MonitoringPortInterface | null;

  constructor(props: CommandBusConstructorProps = {}) {
    const { remoteSender, monitoringService } = props;
    this.remoteSender = remoteSender ?? null;
    this.monitoringService = monitoringService ?? null;
  }

  registerLocalHandler<T extends UntypedCommandType>(
    commandType: T["type"],
    handler: CommandHandlerInterface<T>,
  ): void {
    if (this.localHandlers.has(commandType)) {
      const errorDetails: CommandBusError = {
        cause: {
          errorType: "CommandBusError",
          code: "MULTIPLE_HANDLERS_FOR_COMMAND",
          commandType,
        },
      };
      this.monitoringService?.trackInfrastructureError(
        errorDetails.cause.code,
        errorDetails,
      );
      throw createErrorWithCause(
        `Multiple handlers detected for Command type: ${commandType}. A Command must have only one handler.`,
        errorDetails,
      );
    }
    this.localHandlers.set(
      commandType,
      handler as CommandHandlerInterface<UntypedCommandType>,
    );
  }

  async dispatch(command: UntypedCommandType): Promise<void> {
    const commandType = command.type;
    const isRemote =
      "isRemote" in command &&
      (command as RemoteCommandMarkerInterface).isRemote;

    try {
      if (!isRemote) {
        await this.handleLocalCommand(command);
      } else if (this.remoteSender) {
        await this.handleRemoteSend(command);
      } else {
        this.handleMissingRemoteSender(command);
      }
    } catch (error: unknown) {
      // already handled error, just propagate it
      if (
        error &&
        typeof error === "object" &&
        "cause" in error &&
        error.cause &&
        typeof error.cause === "object" &&
        "errorType" in error.cause
      ) {
        if ((error as CommandBusError).cause.errorType === "CommandBusError") {
          throw error;
        }
      }

      const errorDetails: CommandBusError = {
        cause: {
          errorType: "CommandBusError",
          code: "FAILED_TO_DISPATCH_COMMAND",
          commandType,
          commandId: command.id,
        },
      };

      this.monitoringService?.trackInfrastructureError(
        errorDetails.cause.code,
        errorDetails,
      );

      // Errors are already tracked via monitoringService and will be visible when thrown.
      // In production, use a proper logger if additional console logging is needed.
      throw error;
    }
  }

  private async handleLocalCommand(command: UntypedCommandType): Promise<void> {
    const commandType = command.type;
    const handler = this.localHandlers.get(commandType);

    if (!handler) {
      const errorDetails: CommandBusError = {
        cause: {
          errorType: "CommandBusError",
          code: "NO_HANDLER_FOR_COMMAND",
          commandType,
        },
      };
      const error = createErrorWithCause(
        `No handler registered for local Command type: ${commandType}.`,
        errorDetails,
      );

      this.monitoringService?.trackInfrastructureError(
        errorDetails.cause.code,
        errorDetails,
      );
      throw error;
    }

    try {
      await handler.handle(command);
    } catch (error) {
      const errorDetails: CommandBusError = {
        cause: {
          errorType: "CommandBusError",
          code: "LOCAL_HANDLER_EXECUTION_FAILED",
          commandType,
          commandId: command.id,
        },
      };
      this.monitoringService?.trackInfrastructureError(
        errorDetails.cause.code,
        errorDetails,
      );

      const err = createErrorWithCause(
        error instanceof Error ? error.message : String(error),
        errorDetails, // enrich error
      );
      throw err;
    }
  }

  private async handleRemoteSend(command: UntypedCommandType): Promise<void> {
    const commandType = command.type;
    const serializedCommand = CommandSerializer.serialize(command);

    try {
      if (this.remoteSender) {
        await this.remoteSender.sendRemote(serializedCommand);
      }
    } catch (remoteError) {
      const errorDetails: CommandBusError = {
        cause: {
          errorType: "CommandBusError",
          code: "REMOTE_SEND_FAILED",
          commandType,
          commandId: command.id,
          remoteError:
            remoteError instanceof Error
              ? remoteError.message
              : String(remoteError),
        },
      };

      this.monitoringService?.trackInfrastructureError(
        errorDetails.cause.code,
        errorDetails,
      );

      const error = createErrorWithCause(
        `Failed to send remote command ${commandType}.`,
        errorDetails,
      );
      throw error;
    }
  }

  private handleMissingRemoteSender(command: UntypedCommandType): never {
    const commandType = command.type;

    const errorDetails: CommandBusError = {
      cause: {
        errorType: "CommandBusError",
        code: "REMOTE_SENDER_NOT_CONFIGURED",
        commandType,
      },
    };

    this.monitoringService?.trackInfrastructureError(
      errorDetails.cause.code,
      errorDetails,
    );

    throw createErrorWithCause(
      `Cannot dispatch remote command ${commandType}. RemoteSender service is not configured.`,
      errorDetails,
    );
  }
}

type ErrorWithCause = Error & { cause?: unknown };

function createErrorWithCause(message: string, cause: unknown): ErrorWithCause {
  const err: ErrorWithCause = new Error(message);
  err.cause = cause;
  return err;
}
