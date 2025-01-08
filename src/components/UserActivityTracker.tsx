import React from 'react';
import { useUserActivity } from '../hooks/useUserActivity';

interface UserActivityTrackerProps {
  isTimerOn: boolean;
}

export const UserActivityTracker: React.FC<UserActivityTrackerProps> = ({ isTimerOn }) => {
  const { activityPercentage, keyPresses, mouseMovements, resetActivity } = useUserActivity(isTimerOn);

  // Reset activity when timer is turned off
  React.useEffect(() => {
    if (!isTimerOn) {
      resetActivity();
    }
  }, [isTimerOn, resetActivity]);

  return (
    <div className="user-activity-tracker">
      <h3>User Activity</h3>
      <div>
        <p>Activity Percentage: {activityPercentage}%</p>
        <p>Key Presses: {keyPresses}</p>
        <p>Mouse Movements: {mouseMovements}</p>
      </div>
    </div>
  );
};