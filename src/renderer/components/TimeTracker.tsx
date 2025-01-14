import React from "react";
import { useActivityTracker } from "../hooks/useActivityTracker";
import { useScreenshots } from "../hooks/useScreenshots";
import { useTimeTracker } from "../hooks/useTimeTracker";

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

  const {
    activityPercentage,
    startTracking,
    stopTracking
  } = useActivityTracker();

  const handleStopWithScreenshot = async () => {
    const percentage = await stopTracking(currentTime);
    console.log("Activity Percentage:", percentage);
    handleStop();
    if (newEntryName) {
      await takeScreenshot(newEntryName);
    }
  };

  const handleNameChangeWithUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleNameChange(e);
    onTaskNameChange?.(e.target.value);
  };

  const onHandleStart = () => {
    handleStart();
    startTracking();
  };

  return (
    <div
      className="max-w-md mx-auto my-8 p-6 bg-white dark:bg-[#0f1123] border border-[#e6e6e6] dark:border-[#1a1e33] 
      rounded-2xl shadow-2xl dark:shadow-[0_10px_40px_rgba(30,41,59,0.4)] transition-all duration-300 
      hover:shadow-xl dark:hover:shadow-[0_15px_50px_rgba(30,41,59,0.5)] font-['Inter'] overflow-hidden"
    >
      <div
        className="text-5xl font-bold text-center text-transparent bg-clip-text 
        bg-gradient-to-r from-[#6a11cb] to-[#2575fc] dark:from-[#8e2de2] dark:to-[#4a00e0] 
        mb-6 tracking-tight"
      >
        {currentTime}
      </div>

      <div
        className="flex flex-col space-y-4 mb-6"
      >
        <input
          type="text"
          value={newEntryName}
          onChange={handleNameChangeWithUpdate}
          placeholder="What are you working on?"
          className="px-4 py-3 border-2 border-[#e0e0e0] dark:border-[#2c3142] 
          dark:bg-[#1a1e33] dark:text-[#e0e7ff] rounded-xl text-base 
          transition-all duration-300 ease-in-out outline-none 
          focus:border-[#6a11cb] focus:ring-4 focus:ring-[#6a11cb]/20 
          dark:focus:border-[#8e2de2] dark:focus:ring-[#8e2de2]/30 
          placeholder-gray-400 dark:placeholder-gray-500
          font-medium"
          disabled={isTimerOn}
        />
        <div
          className="flex justify-center space-x-4"
        >
          {!isTimerOn ? (
            <button
              onClick={onHandleStart}
              disabled={newEntryName.trim() === ""}
              className="bg-gradient-to-r from-[#6a11cb] to-[#2575fc] 
              text-white px-6 py-3 rounded-xl 
              text-base font-semibold transition-all duration-300 ease-in-out 
              shadow-lg hover:shadow-xl hover:-translate-y-0.5 
              disabled:opacity-50 disabled:cursor-not-allowed 
              transform active:scale-95"
            >
              Start Tracking
            </button>
          ) : (
            <button
              onClick={handleStopWithScreenshot}
              className="bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] 
              text-white px-6 py-3 rounded-xl 
              text-base font-semibold transition-all duration-300 ease-in-out 
              shadow-lg hover:shadow-xl hover:-translate-y-0.5 
              transform active:scale-95"
            >
              Stop Tracking
            </button>
          )}
        </div>
      </div>

      {savedTimes.length > 0 && (
        <div
          className="mt-6 bg-[#f9fafb] dark:bg-[#161b2e] rounded-2xl p-5 
          border border-[#f0f0f0] dark:border-[#1f2937] shadow-md"
        >
          <h3
            className="mt-0 mb-4 text-[#1f2937] dark:text-[#e0e7ff] text-lg font-bold 
            border-b-2 border-[#e6e6e6] dark:border-[#2c3142] pb-3 uppercase tracking-wider"
          >
            Tracked Tasks
          </h3>
          <div
            className="flex flex-col space-y-3"
          >
            {savedTimes.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-3 
                bg-white dark:bg-[#1a1e33] rounded-xl transition-all duration-300 ease-in-out 
                hover:bg-[#f3f4f6] dark:hover:bg-[#222842] 
                border border-transparent hover:border-[#6a11cb]/20 
                dark:hover:border-[#8e2de2]/20 shadow-sm hover:shadow-md"
              >
                <span
                  className="font-medium text-[#374151] dark:text-[#e0e7ff] flex-1 mr-4 
                  truncate tracking-tight"
                >
                  {entry.name}
                </span>
                <span
                  className="font-['Roboto_Mono'] text-[#6a11cb] dark:text-[#8e2de2] 
                  font-bold tracking-tighter"
                >
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