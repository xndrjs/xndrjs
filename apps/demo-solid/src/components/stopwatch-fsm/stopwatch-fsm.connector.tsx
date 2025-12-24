import { createMemo } from "solid-js";
import { ReactiveObject, ReactiveValue } from "@xndrjs/core";
import { useReactiveValue } from "@xndrjs/adapter-solid";
import { StopwatchFSMView } from "./stopwatch-fsm.view";
import { StopwatchFSM } from "@xndrjs/demo-common";
import { eventBus } from "../../messaging";

export function StopwatchFSMConnector() {
  const stopwatchCurrentStatePort = new ReactiveObject(
    StopwatchFSM.defaults.initialState,
  );
  const stopwatchTimeIntPort = new ReactiveValue<number>(
    StopwatchFSM.defaults.timeIntPort,
  );

  const stopwatchFSM = new StopwatchFSM(
    stopwatchCurrentStatePort,
    stopwatchTimeIntPort,
    eventBus,
  );

  stopwatchFSM.initialize();

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
