interface StopwatchFSMViewProps {
  time: { hours: number; minutes: number; seconds: number };
  stateName: string;
  isPlaying: boolean;
  isIdle: boolean;
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
    <div className="demo-section">
      <h2>Stopwatch FSM</h2>
      <div className="stopwatch-fsm">
        <div className="counter-display">{formatTime(time)}</div>
        <div className="fsm-state">State: {stateName}</div>
        <div className="counter-actions">
          <button
            onClick={onPlayPause}
            className={isPlaying ? "pause-button" : "play-button"}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button onClick={onStop} disabled={isIdle} className="stop-button">
            ⏹ Stop
          </button>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#7f8c8d", marginTop: "1rem" }}>
          The stopwatch auto-increments every second when in "playing" state.
          Use pause/resume to control the state, or reset to go back to idle.
        </p>
      </div>
    </div>
  );
}
