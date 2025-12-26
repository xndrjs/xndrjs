import { createMemo } from "solid-js";
import {
  ReactiveObject,
  ReactiveValue,
  ViewModel,
  type StatePort,
} from "@xndrjs/core";
import { useReactiveValue, useViewModel } from "@xndrjs/adapter-solid";
import { StopwatchFSMView } from "./stopwatch-fsm.view";
import { StopwatchFSM } from "@xndrjs/demo-common";
import type { FSMContextState } from "@xndrjs/fsm";
import { eventBus } from "../../messaging";

class StopwatchFSMViewModel extends ViewModel {
  readonly fsm: StopwatchFSM;

  constructor(
    currentStatePort: StatePort<FSMContextState<StopwatchFSM>>,
    timeIntPort: StatePort<number>,
  ) {
    super();
    this.fsm = new StopwatchFSM(this, currentStatePort, timeIntPort, eventBus);
    this.fsm.initialize();
  }
}

export function StopwatchFSMConnector() {
  const stopwatchCurrentStatePort = new ReactiveObject(
    StopwatchFSM.defaults.initialState,
  );
  const stopwatchTimeIntPort = new ReactiveValue<number>(
    StopwatchFSM.defaults.timeIntPort,
  );

  const vm = useViewModel(
    () =>
      new StopwatchFSMViewModel(
        stopwatchCurrentStatePort,
        stopwatchTimeIntPort,
      ),
  );
  const stopwatchFSM = vm.fsm;

  const currentState = useReactiveValue(stopwatchFSM.currentState);
  const time = useReactiveValue(stopwatchFSM.timePort);

  const stateName = createMemo(() => currentState().name);
  const isPlaying = createMemo(() => stateName() === "playing");
  const isPaused = createMemo(() => stateName() === "paused");
  const isIdle = createMemo(() => stateName() === "idle");

  const handlePlayPause = async () => {
    if (isPlaying()) {
      await stopwatchFSM.pause();
    } else if (isIdle()) {
      await stopwatchFSM.start();
    } else if (isPaused()) {
      await stopwatchFSM.resume();
    }
  };

  const handleStop = async () => {
    await stopwatchFSM.reset();
  };

  return (
    <StopwatchFSMView
      time={time}
      stateName={stateName}
      isIdle={isIdle}
      isPlaying={isPlaying}
      onPlayPause={handlePlayPause}
      onStop={handleStop}
    />
  );
}
