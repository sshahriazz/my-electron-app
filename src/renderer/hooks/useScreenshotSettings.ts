import { useState, useCallback, useEffect } from "react";

export const intervalOptions = [
  { label: "5 seconds", value: 5000 },
  { label: "10 seconds", value: 10000 },
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "Custom", value: "custom" },
];

export const useScreenshotSettings = (
  onScreenshot: (name: string) => Promise<void>,
  isTimerOn: boolean,
  currentTaskName?: string
) => {
  const [isCapturing, setIsCapturing] = useState<boolean>(() => {
    const savedCapturingState = localStorage.getItem("isCapturing");
    return savedCapturingState ? JSON.parse(savedCapturingState) : true;
  });

  const [screenshotInterval, setScreenshotInterval] = useState<number>(() => {
    const savedInterval = localStorage.getItem("screenshotInterval");
    return savedInterval ? Number(savedInterval) : 10000;
  });

  const [customInterval, setCustomInterval] = useState<string>(() => {
    const savedCustomInterval = localStorage.getItem("customInterval");
    return savedCustomInterval || "";
  });

  const [intervalError, setIntervalError] = useState<string>("");

  const handleIntervalChange = (value: string) => {
    setIntervalError("");
    if (value === "custom") {
      const newCustomInterval = String(screenshotInterval / 1000);
      setCustomInterval(newCustomInterval);
      localStorage.setItem("customInterval", newCustomInterval);
      return;
    }
    setCustomInterval("");
    localStorage.setItem("customInterval", "");
    setScreenshotInterval(Number(value));
    localStorage.setItem("screenshotInterval", value);
  };

  const handleCustomIntervalChange = (value: string) => {
    setCustomInterval(value);
    localStorage.setItem("customInterval", value);

    const numValue = Number(value);
    if (isNaN(numValue)) {
      setIntervalError("Please enter a valid number");
      return;
    }
    if (numValue < 1) {
      setIntervalError("Interval must be at least 1 second");
      return;
    }
    if (numValue > 3600) {
      setIntervalError("Interval cannot exceed 1 hour (3600 seconds)");
      return;
    }
    const milliseconds = numValue * 1000;
    setScreenshotInterval(milliseconds);
    localStorage.setItem("screenshotInterval", String(milliseconds));
    setIntervalError("");
  };

  const toggleCapturing = useCallback(() => {
    const newState = !isCapturing;
    setIsCapturing(newState);
    localStorage.setItem("isCapturing", JSON.stringify(newState));
  }, [isCapturing]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // screen shot interval must be at least 3 seconds
    // screenshot should work only if the timer is on and there's a task name
    if (isCapturing && screenshotInterval > 3000 && isTimerOn && currentTaskName) {
      intervalId = setInterval(() => onScreenshot(currentTaskName), screenshotInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onScreenshot, screenshotInterval, isCapturing, isTimerOn, currentTaskName]);

  return {
    isCapturing,
    screenshotInterval,
    customInterval,
    intervalError,
    handleIntervalChange,
    handleCustomIntervalChange,
    toggleCapturing,
  };
};
