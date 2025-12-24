import type { FSMState, FSMStateConfig } from "@xndrjs/fsm";
import type { StopwatchFSM } from "../fsm";
import { PlayingState } from "./playing-state";

export type IdleStatePayload = { intent: "start" };

export type IdleStateConfig = FSMStateConfig<"idle", IdleStatePayload>;

export class IdleState implements FSMState<StopwatchFSM, "idle"> {
  name = "idle" as const;
  isFinal = false;

  async onEnter(context: StopwatchFSM): Promise<void> {
    context.timeIntPort.set(0);
  }

  async handleNext(
    context: StopwatchFSM,
    payload: IdleStatePayload,
  ): Promise<void> {
    if (payload.intent === "start") {
      await context.transitionTo(new PlayingState());
    }
  }
}
