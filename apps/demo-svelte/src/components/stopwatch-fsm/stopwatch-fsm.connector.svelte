<script lang="ts">
  import { ReactiveObject, ReactiveValue, ViewModel, type StatePort } from "@xndrjs/core";
  import { StopwatchFSM } from "@xndrjs/demo-common";
  import type { FSMContextState } from "@xndrjs/fsm";
  import { reactiveValue, useViewModel } from "@xndrjs/adapter-svelte";
  import { eventBus } from "../../messaging";
  import StopwatchFSMView from "./stopwatch-fsm.view.svelte";

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

  const stopwatchCurrentStatePort = new ReactiveObject(
    StopwatchFSM.defaults.initialState,
  );
  const stopwatchTimeIntPort = new ReactiveValue<number>(
    StopwatchFSM.defaults.timeIntPort,
  );

  const vm = useViewModel(
    () => new StopwatchFSMViewModel(stopwatchCurrentStatePort, stopwatchTimeIntPort),
  );
  const stopwatchFSM = vm.fsm;

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

