import { useState, useEffect } from 'react';

interface UserActivityHook {
  activityPercentage: number;
  keyPresses: number;
  mouseMovements: number;
  resetActivity: () => void;
}

export const useUserActivity = (isTimerOn: boolean): UserActivityHook => {
  const [keyPresses, setKeyPresses] = useState(0);
  const [mouseMovements, setMouseMovements] = useState(0);
  const [activityPercentage, setActivityPercentage] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const resetActivity = () => {
    setKeyPresses(0);
    setMouseMovements(0);
    setActivityPercentage(0);
    setStartTime(null);
  };

  const handleKeyPress = () => {
    if (isTimerOn) {
      setKeyPresses(prev => prev + 1);
    }
  };

  const handleMouseMove = () => {
    if (isTimerOn) {
      setMouseMovements(prev => prev + 1);
    }
  };

  useEffect(() => {
    // Reset activity when timer is turned off
    if (!isTimerOn) {
      resetActivity();
      return;
    }

    // Set start time when timer starts
    if (isTimerOn && !startTime) {
      setStartTime(Date.now());
    }

    // Track keyboard events
    window.addEventListener('keydown', handleKeyPress);
    
    // Track mouse movement events
    window.addEventListener('mousemove', handleMouseMove);

    // Calculate activity percentage every 5 seconds
    const activityInterval = setInterval(() => {
      if (!isTimerOn || !startTime) return;

      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000; // in seconds
      
      // Simple activity calculation: total interactions / time
      const totalInteractions = keyPresses + mouseMovements;
      const interactionsPerSecond = totalInteractions / elapsedTime;
      
      // Normalize percentage (cap at 100%)
      const percentage = Math.min(Math.round((interactionsPerSecond * 10)), 100);
      
      setActivityPercentage(percentage);
    }, 5000);

    // Cleanup listeners
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(activityInterval);
    };
  }, [isTimerOn, startTime, keyPresses, mouseMovements]);

  return { activityPercentage, keyPresses, mouseMovements, resetActivity };
};