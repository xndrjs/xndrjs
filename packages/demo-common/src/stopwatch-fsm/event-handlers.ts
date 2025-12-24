import { DomainEvent } from "@xndrjs/cqrs";

// Event definitions
export class StopwatchPlayEvent extends DomainEvent<
  "StopwatchPlay",
  { time: number }
> {
  get type() {
    return "StopwatchPlay" as const;
  }
}

export class StopwatchPauseEvent extends DomainEvent<
  "StopwatchPause",
  { time: number }
> {
  get type() {
    return "StopwatchPause" as const;
  }
}

export class StopwatchStopEvent extends DomainEvent<
  "StopwatchStop",
  { time: number }
> {
  get type() {
    return "StopwatchStop" as const;
  }
}

export type StopwatchEvent =
  | StopwatchPlayEvent
  | StopwatchPauseEvent
  | StopwatchStopEvent;
