// src/renderer/hooks/useActivityTracker.ts
import { KeyStats, MouseStats, Position } from 'keyboard-tracker';
import { useCallback, useState } from 'react';

// Reuse the activity calculation logic from TimeTracker
const calculateMouseMovementActivity = (mousePositions: Position[]): number => {
  if (mousePositions.length <= 1) return 0;

  let totalDistance = 0;
  for (let i = 1; i < mousePositions.length; i++) {
    const prevPos = mousePositions[i - 1];
    const currPos = mousePositions[i];

    const distance = Math.sqrt(
      Math.pow(currPos.x - prevPos.x, 2) +
      Math.pow(currPos.y - prevPos.y, 2)
    );

    totalDistance += distance;
  }

  const DISTANCE_THRESHOLD = 500;
  return Math.min(totalDistance / DISTANCE_THRESHOLD, 10);
};

export const useActivityTracker = () => {
  const [activityPercentage, setActivityPercentage] = useState(0);
  const [keyboardData, setKeyboardData] = useState<KeyStats | null>(null);
  const [mouseData, setMouseData] = useState<MouseStats | null>(null);

  const startTracking = useCallback(() => {
    window.electronAPI.startTrackingKeyboardStroke();
    window.electronAPI.startTrackingInputStroke();
  }, []);

  const stopTracking = useCallback(async (currentTime: string) => {
    const keyboardData: KeyStats = await window.electronAPI.getKeyboardTrackingData();
    const inputData: MouseStats = await window.electronAPI.getInputTrackingData();

    // Calculate activity percentage
    const calculateUserActivityPercentage = () => {
      const [hours, minutes, seconds] = currentTime.split(':').map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      const keyboardActivityScore = keyboardData.totalKeystrokes;
      const mouseClickScore = inputData.totalClicks;
      const mouseMovementScore = calculateMouseMovementActivity(inputData.mousePositions);

      const KEYSTROKE_WEIGHT = 1;
      const CLICK_WEIGHT = 0.5;
      const MOUSE_MOVEMENT_WEIGHT = 0.3;

      const totalActivityScore =
        (keyboardActivityScore * KEYSTROKE_WEIGHT) +
        (mouseClickScore * CLICK_WEIGHT) +
        (mouseMovementScore * MOUSE_MOVEMENT_WEIGHT);

      const activityPercentage = totalActivityScore > 0
        ? Math.min((totalActivityScore / (totalSeconds * 3)) * 100, 100)
        : 0;

      return Math.round(activityPercentage);
    };

    const percentage = calculateUserActivityPercentage();

    // Update state
    setActivityPercentage(percentage);
    setKeyboardData(keyboardData);
    setMouseData(inputData);

    // Reset tracking data
    window.electronAPI.stopTrackingKeyboardStroke();
    window.electronAPI.stopTrackingInputStroke();
    await window.electronAPI.resetKeyboardTrackingData();
    await window.electronAPI.resetInputTrackingData();

    return percentage;
  }, []);

  const resetTracking = useCallback(() => {
    setActivityPercentage(0);
    setKeyboardData(null);
    setMouseData(null);
  }, []);

  return {
    activityPercentage,
    keyboardData,
    mouseData,
    startTracking,
    stopTracking,
    resetTracking
  };
};