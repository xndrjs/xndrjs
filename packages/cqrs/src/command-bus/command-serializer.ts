import { type UntypedCommandType } from "./types";

export const CommandSerializer = {
  serialize(command: UntypedCommandType): string {
    return JSON.stringify({
      id: command.id,
      timestamp: command.timestamp.toISOString(),
      payload: command.payload,
    });
  },
};
