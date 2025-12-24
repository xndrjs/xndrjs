import type { FSMState, FSMStateConfig } from "@xndrjs/fsm";
import type { StopwatchFSM } from "../fsm";
import { IdleState } from "./idle-state";
import { PlayingState } from "./playing-state";

export type PausedStatePayload = { intent: "resume" } | { intent: "reset" };

export type PausedStateConfig = FSMStateConfig<"paused", PausedStatePayload>;

export class PausedState implements FSMState<StopwatchFSM, "paused"> {
  name = "paused" as const;
  isFinal = false;

  async handleNext(
    context: StopwatchFSM,
    payload: PausedStatePayload,
  ): Promise<void> {
    switch (payload.intent) {
      case "resume":
        await context.transitionTo(new PlayingState());
        break;
      case "reset":
        await context.transitionTo(new IdleState());
        break;
    }
  }
}
