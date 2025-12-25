import {
  useCreateStatePort,
  useReactiveValue,
  useViewModel,
  useFSM,
} from "@xndrjs/adapter-react";
import { StopwatchFSM } from "@xndrjs/demo-common";
import { StopwatchFSMView } from "./stopwatch-fsm.view";
import { eventBus } from "../../messaging";
import { useMonitorFSM } from "@xndrjs/devtools-react";

export function StopwatchFSMConnector() {
  // Create StatePorts with initial values from FSM defaults
  const stopwatchCurrentStatePort = useCreateStatePort(
    StopwatchFSM.defaults.initialState,
  );
  const stopwatchTimeIntPort = useCreateStatePort<number>(
    StopwatchFSM.defaults.timeIntPort,
  );

  // Create StopwatchFSM once - ports are stable so manager doesn't need to be recreated
  const stopwatchFSM = useViewModel(
    () =>
      new StopwatchFSM(
        stopwatchCurrentStatePort,
        stopwatchTimeIntPort,
        eventBus,
      ),
  );

  // Register FSM subscriptions
  useFSM(stopwatchFSM);

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
