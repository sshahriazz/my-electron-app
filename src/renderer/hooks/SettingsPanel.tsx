import React from 'react';
import { intervalOptions } from '../hooks/useScreenshotSettings';

interface SettingsPanelProps {
  isCapturing: boolean;
  screenshotInterval: number;
  customInterval: string;
  intervalError: string;
  onToggleCapturing: () => void;
  onIntervalChange: (value: string) => void;
  onCustomIntervalChange: (value: string) => void;
  onDeleteAll: () => void;
  lastScreenshot?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isCapturing,
  screenshotInterval,
  customInterval,
  intervalError,
  onToggleCapturing,
  onIntervalChange,
  onCustomIntervalChange,
  onDeleteAll,
  lastScreenshot,
}) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      {lastScreenshot && (
        <p>Last screenshot saved: {lastScreenshot.split("/").pop()}</p>
      )}
      <button
        onClick={onDeleteAll}
        style={{
          backgroundColor: "#dc3545",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        Delete All Screenshots
      </button>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "15px", display: "flex", alignItems: "center" }}>
          <label style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: "10px" }}>Auto Screenshot:</span>
            <div
              onClick={onToggleCapturing}
              style={{
                width: "50px",
                height: "24px",
                backgroundColor: isCapturing ? "#4CAF50" : "#ccc",
                borderRadius: "12px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "2px",
                  left: isCapturing ? "28px" : "2px",
                  transition: "left 0.3s",
                }}
              />
            </div>
          </label>
          <span style={{ marginLeft: "10px", fontSize: "14px", color: isCapturing ? "#4CAF50" : "#666" }}>
            {isCapturing ? "Enabled" : "Disabled"}
          </span>
        </div>
        <label htmlFor="interval" style={{ marginRight: "10px" }}>
          Screenshot Interval:
        </label>
        <select
          id="interval"
          value={customInterval ? 'custom' : screenshotInterval}
          onChange={(e) => onIntervalChange(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginRight: "10px",
          }}
        >
          {intervalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {intervalOptions.find((opt) => opt.value === 'custom')?.value === 'custom' && (
          <div style={{ display: 'inline-block' }}>
            <input
              type="number"
              value={customInterval}
              onChange={(e) => onCustomIntervalChange(e.target.value)}
              placeholder="Enter seconds"
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                width: "120px",
              }}
              min="1"
              max="3600"
            />
            <span style={{ marginLeft: "5px" }}>seconds</span>
            {intervalError && (
              <div style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
                {intervalError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
