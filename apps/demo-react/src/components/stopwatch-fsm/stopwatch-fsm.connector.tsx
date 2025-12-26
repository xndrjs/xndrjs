import {
  useCreateStatePort,
  useReactiveValue,
  useViewModel,
} from "@xndrjs/adapter-react";
import { ViewModel, type StatePort } from "@xndrjs/core";
import { StopwatchFSM } from "@xndrjs/demo-common";
import type { FSMContextState } from "@xndrjs/fsm";
import { StopwatchFSMView } from "./stopwatch-fsm.view";
import { eventBus } from "../../messaging";
import { useMonitorFSM } from "@xndrjs/devtools-react";

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
  // Create StatePorts with initial values from FSM defaults
  const stopwatchCurrentStatePort = useCreateStatePort(
    StopwatchFSM.defaults.initialState,
  );
  const stopwatchTimeIntPort = useCreateStatePort<number>(
    StopwatchFSM.defaults.timeIntPort,
  );

  // Create ViewModel that wraps the FSM manager
  const vm = useViewModel(
    () =>
      new StopwatchFSMViewModel(
        stopwatchCurrentStatePort,
        stopwatchTimeIntPort,
      ),
  );
  const stopwatchFSM = vm.fsm;

  // Derive reactive values
  const currentState = useReactiveValue(stopwatchFSM.currentState);
  const time = useReactiveValue(stopwatchFSM.timePort);

  // Monitor FSM for DevTools
  useMonitorFSM(stopwatchFSM, { name: "StopwatchFSM" });

  const stateName = currentState?.name ?? "idle";
  const isPlaying = stateName === "playing";
  const isPaused = stateName === "paused";
  const isIdle = stateName === "idle";

  const handlePlayPause = async () => {
    if (isPlaying) {
      await stopwatchFSM.pause();
    } else if (isIdle) {
      await stopwatchFSM.start();
    } else if (isPaused) {
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
