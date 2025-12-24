import type { Accessor } from "solid-js";

interface StopwatchFSMViewProps {
  time: Accessor<{ hours: number; minutes: number; seconds: number }>;
  stateName: Accessor<string>;
  isPlaying: Accessor<boolean>;
  isIdle: Accessor<boolean>;
  onPlayPause: () => Promise<void>;
  onStop: () => Promise<void>;
}

export function StopwatchFSMView({
  time,
  stateName,
  isPlaying,
  isIdle,
  onPlayPause,
  onStop,
}: StopwatchFSMViewProps) {
  const formatTime = (t: {
    hours: number;
    minutes: number;
    seconds: number;
  }) => {
    const hh = t.hours.toString().padStart(2, "0");
    const mm = t.minutes.toString().padStart(2, "0");
    const ss = t.seconds.toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div class="demo-section">
      <h2>Stopwatch FSM</h2>
      <div class="stopwatch-fsm">
        <div class="counter-display">{formatTime(time())}</div>
        <div class="fsm-state">State: {stateName()}</div>
        <div class="counter-actions">
          <button
            onClick={onPlayPause}
            class={isPlaying() ? "pause-button" : "play-button"}
          >
            {isPlaying() ? "⏸ Pause" : "▶ Play"}
          </button>
          <button onClick={onStop} disabled={isIdle()} class="stop-button">
            ⏹ Stop
          </button>
        </div>
        <p
          style={{
            "font-size": "0.9rem",
            color: "#7f8c8d",
            "margin-top": "1rem",
          }}
        >
          The stopwatch auto-increments every second when in "playing" state.
          Use pause/resume to control the state, or reset to go back to idle.
        </p>
      </div>
    </div>
  );
}
