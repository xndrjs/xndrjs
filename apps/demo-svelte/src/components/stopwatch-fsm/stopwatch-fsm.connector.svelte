<script lang="ts">
  import { ReactiveObject, ReactiveValue } from "@xndrjs/core";
  import { StopwatchFSM } from "@xndrjs/demo-common";
  import { reactiveValue } from "@xndrjs/adapter-svelte";
  import { eventBus } from "../../messaging";
  import StopwatchFSMView from "./stopwatch-fsm.view.svelte";

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

  const currentStateStore = reactiveValue(() => stopwatchFSM.currentState);
  const timeStore = reactiveValue(() => stopwatchFSM.timePort);

  const stateName = $derived($currentStateStore?.name ?? "idle");
  const isPlaying = $derived(stateName === "playing");
  const isPaused = $derived(stateName === "paused");
  const isIdle = $derived(stateName === "idle");

  async function handlePlayPause() {
    if (isPlaying) {
      await stopwatchFSM.pause();
    } else if (isIdle) {
      await stopwatchFSM.start();
    } else if (isPaused) {
      await stopwatchFSM.resume();
    }
  }

  async function handleStop() {
    await stopwatchFSM.reset();
  }
</script>

<StopwatchFSMView
  time={$timeStore}
  {stateName}
  {isIdle}
  {isPlaying}
  onPlayPause={handlePlayPause}
  onStop={handleStop}
/>

