import React from "react";
import { useTimeTracker } from "../hooks/useTimeTracker";
import { useScreenshots } from "../hooks/useScreenshots";

interface TimeTrackerProps {
  onTimerStateChange?: (isRunning: boolean) => void;
  onTaskNameChange?: (name: string) => void;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  onTimerStateChange,
  onTaskNameChange,
}) => {
  const {
    isTimerOn,
    currentTime,
    formatTime,
    newEntryName,
    savedTimes,
    handleStart,
    handleStop,
    handleNameChange,
  } = useTimeTracker({
    onIsRunningChange: onTimerStateChange,
  });

  const { takeScreenshot } = useScreenshots();

  const handleStopWithScreenshot = async () => {
    handleStop();
    if (newEntryName) {
      await takeScreenshot(newEntryName);
    }
  };

  const handleNameChangeWithUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleNameChange(e);
    onTaskNameChange?.(e.target.value);
  };

  return (
    <div
      className="time-tracker"
      style={{ maxWidth: "600px", margin: "0 auto" }}
    >
      <div
        className="time-display"
        style={{
          fontSize: "2em",
          margin: "20px 0",
        }}
      >
        {currentTime}
      </div>

      <div
        className="controls"
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={newEntryName}
          onChange={handleNameChangeWithUpdate}
          placeholder="Enter task name"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            flexGrow: 1,
          }}
        />
        {!isTimerOn ? (
          <button
            onClick={handleStart}
            disabled={newEntryName.trim() === ""}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleStopWithScreenshot}
            style={{
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            Stop
          </button>
        )}
      </div>

      {savedTimes.length > 0 && (
        <div
          className="saved-times"
          style={{
            marginTop: "30px",
            border: "1px solid #eee",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Saved Times</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {savedTimes.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              >
                <span>{entry.name}</span>
                <span style={{ fontFamily: "monospace" }}>
                  {formatTime(entry.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
