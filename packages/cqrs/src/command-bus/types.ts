export interface CommandInterface<TType extends string, TPayload> {
  id: string;
  timestamp: Date;
  type: TType;
  payload: TPayload;
}

export type CommandConstructorOptions = Partial<
  Pick<CommandInterface<string, unknown>, "id" | "timestamp">
>;

export interface RemoteCommandMarkerInterface {
  isRemote: true;
}

export abstract class Command<
  TType extends string,
  TPayload,
> implements CommandInterface<TType, TPayload> {
  id: string;
  timestamp: Date;
  payload: TPayload;
  abstract get type(): TType;

  constructor(payload: TPayload, options?: CommandConstructorOptions) {
    this.id = options?.id ?? crypto.randomUUID();
    this.timestamp = options?.timestamp ?? new Date();
    this.payload = payload;
  }
}

export type UntypedCommandType = Command<string, object>;

export interface CommandHandlerInterface<TCommand extends UntypedCommandType> {
  handle(command: TCommand): Promise<void>;
}

export interface RemoteCommandSenderInterface {
  sendRemote(serializedCommand: string): Promise<void>;
}

export interface CommandBusInterface {
  registerLocalHandler<T extends UntypedCommandType>(
    commandType: T["type"],
    handler: CommandHandlerInterface<T>,
  ): void;
  dispatch(command: UntypedCommandType): Promise<void>;
}

export interface CommandBusErrorCause {
  errorType: "CommandBusError";
  code: string;
  commandType: string;
  commandId?: string;
  remoteError?: string;
}

export type CommandBusError = Partial<Error> & {
  cause: CommandBusErrorCause;
};
