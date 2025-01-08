import { useState, useEffect, useCallback } from "react";

interface TimeEntry {
  name: string;
  duration: number;
  id: string;
}

interface TimeTrackerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedTime: number;
  savedTimes: TimeEntry[];
  newEntryName: string;
}

interface UseTimeTrackerOptions {
  onIsRunningChange?: (isRunning: boolean) => void;
}

export const useTimeTracker = (options: UseTimeTrackerOptions = {}) => {
  const [state, setState] = useState<TimeTrackerState>({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    savedTimes: [],
    newEntryName: "",
  });

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const updateTime = useCallback(() => {
    if (state.isRunning) {
      setState((prevState) => ({
        ...prevState,
        elapsedTime: prevState.elapsedTime + 1000,
      }));
    }
  }, [state.isRunning]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (state.isRunning) {
      intervalId = setInterval(updateTime, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.isRunning, updateTime]);

  useEffect(() => {
    if (options.onIsRunningChange) {
      options.onIsRunningChange(state.isRunning);
    }
  }, [state.isRunning, options.onIsRunningChange]);

  const handleStart = () => {
    setState((prevState) => ({
      ...prevState,
      isRunning: true,
      startTime: Date.now(),
    }));
  };

  const handleStop = () => {
    if (state.newEntryName.trim()) {
      const newEntry: TimeEntry = {
        name: state.newEntryName,
        duration: state.elapsedTime,
        id: Date.now().toString(),
      };

      setState((prevState) => ({
        ...prevState,
        isRunning: false,
        startTime: null,
        elapsedTime: 0,
        savedTimes: [...prevState.savedTimes, newEntry],
        newEntryName: "",
      }));
    } else {
      alert("Please enter a name for this time entry");
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({
      ...prevState,
      newEntryName: event.target.value,
    }));
  };

  return {
    isTimerOn: state.isRunning,
    elapsedTime: state.elapsedTime,
    currentTime: formatTime(state.elapsedTime),
    formatTime,
    newEntryName: state.newEntryName,
    savedTimes: state.savedTimes,
    handleStart,
    handleStop,
    handleNameChange,
  };
};
