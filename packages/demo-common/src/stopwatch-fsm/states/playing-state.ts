import type { FSMState, FSMStateConfig } from "@xndrjs/fsm";
import type { StopwatchFSM } from "../fsm";
import { IdleState } from "./idle-state";
import { PausedState } from "./paused-state";

export type PlayingStatePayload = { intent: "pause" } | { intent: "reset" };

export type PlayingStateConfig = FSMStateConfig<"playing", PlayingStatePayload>;

export class PlayingState implements FSMState<StopwatchFSM, "playing"> {
  name = "playing" as const;
  isFinal = false;

  async onEnter(context: StopwatchFSM): Promise<void> {
    // Start auto-incrementing every second (increment timeIntPort by 1)
    const intervalId = setInterval(() => {
      context.timeIntPort.set((prev: number) => prev + 1);
    }, 1000);
    context._setIntervalId(intervalId);
  }

  async handleNext(
    context: StopwatchFSM,
    payload: PlayingStatePayload,
  ): Promise<void> {
    // Clear interval before transitioning
    context._clearInterval();

    switch (payload.intent) {
      case "pause":
        await context.transitionTo(new PausedState());
        break;
      case "reset":
        await context.transitionTo(new IdleState());
        break;
    }
  }
}
