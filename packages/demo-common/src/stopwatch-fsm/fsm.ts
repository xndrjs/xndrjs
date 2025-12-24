import type { StatePort, ComputedValue } from "@xndrjs/core";
import { createComputed } from "@xndrjs/core";
import { FSMContextManager } from "@xndrjs/fsm";
import type { FSMContextState } from "@xndrjs/fsm";
import type { EventBusInterface } from "@xndrjs/cqrs";
import type {
  IdleStateConfig,
  PlayingStateConfig,
  PausedStateConfig,
} from "./states";
import { IdleState } from "./states";
import {
  StopwatchPlayEvent,
  StopwatchPauseEvent,
  StopwatchStopEvent,
} from "./event-handlers";

export type StopwatchConfig = IdleStateConfig &
  PlayingStateConfig &
  PausedStateConfig;

/**
 * Stopwatch FSM that manages stopwatch state with three states:
 * - idle: Initial state, stopwatch is at 0
 * - playing: Stopwatch is actively counting (auto-increments every second)
 * - paused: Stopwatch is paused but retains value
 *
 * Receives StatePort instances from framework (React, Solid, etc.).
 */
export class StopwatchFSM extends FSMContextManager<
  StopwatchConfig,
  StopwatchFSM
> {
  /**
   * Default values for initializing the FSM.
   */
  static readonly defaults = {
    initialState: new IdleState() as FSMContextState<StopwatchFSM>,
    timeIntPort: 0,
  };

  private _timeIntPort: StatePort<number>;
  private _timePort: ComputedValue<{
    hours: number;
    minutes: number;
    seconds: number;
  }>;
  private _eventBus: EventBusInterface;
  private _intervalId?: ReturnType<typeof setInterval>;

  /**
   * Get the time integer port (internal representation, increments by 1 every second).
   * States can access this via the context.
   */
  get timeIntPort(): StatePort<number> {
    return this._timeIntPort;
  }

  /**
   * Get the time port (display value, computed from timeIntPort).
   * Returns an object with hours, minutes, and seconds.
   * This is the value that should be shown in the UI.
   */
  get timePort(): ComputedValue<{
    hours: number;
    minutes: number;
    seconds: number;
  }> {
    return this._timePort;
  }

  /**
   * Set the interval ID for auto-increment. Used by PlayingState.
   */
  _setIntervalId(intervalId: ReturnType<typeof setInterval>): void {
    this._intervalId = intervalId;
  }

  /**
   * Clear the interval if it exists. Used by PlayingState.
   */
  _clearInterval(): void {
    if (this._intervalId !== undefined) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }

  constructor(
    currentStatePort: StatePort<FSMContextState<StopwatchFSM>>,
    timeIntPort: StatePort<number>,
    eventBus: EventBusInterface,
  ) {
    super(currentStatePort);
    this._timeIntPort = timeIntPort;
    this._eventBus = eventBus;

    // Create computed port for display value
    // Converts timeIntPort (increments by 1 every second) to hours, minutes, seconds
    this._timePort = createComputed(timeIntPort)
      .as((timeInt) => {
        const totalSeconds = timeInt;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return { hours, minutes, seconds };
      })
      .for(this);

    // Set initial state
    currentStatePort.set(new IdleState());
  }

  /**
   * Start the stopwatch (only works in idle state).
   */
  async start(): Promise<void> {
    await this.dispatch({ intent: "start" });
    const time = this._timeIntPort.get();
    this._eventBus.publish(new StopwatchPlayEvent({ time }));
  }

  /**
   * Pause the stopwatch (only works in playing state).
   */
  async pause(): Promise<void> {
    await this.dispatch({ intent: "pause" });
    const time = this._timeIntPort.get();
    this._eventBus.publish(new StopwatchPauseEvent({ time }));
  }

  /**
   * Resume the stopwatch (only works in paused state).
   */
  async resume(): Promise<void> {
    await this.dispatch({ intent: "resume" });
    const time = this._timeIntPort.get();
    this._eventBus.publish(new StopwatchPlayEvent({ time }));
  }

  /**
   * Reset the stopwatch to idle state.
   */
  async reset(): Promise<void> {
    await this.dispatch({ intent: "reset" });
    const time = this._timeIntPort.get();
    this._eventBus.publish(new StopwatchStopEvent({ time }));
  }

  [Symbol.dispose](): void {
    super._cleanup();
    this._clearInterval();
  }
}
