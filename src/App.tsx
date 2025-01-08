import React, { useEffect, useState } from "react";
import { ScreenshotGrid } from "./components/ScreenshotGrid";
import { SettingsPanel } from "./components/SettingsPanel";
import { TimeTracker } from "./components/TimeTracker";
import { useScreenshots } from "./hooks/useScreenshots";
import { useScreenshotSettings } from "./hooks/useScreenshotSettings";
import { UserActivityTracker } from "./components/UserActivityTracker";

const App: React.FC = () => {
  const [isTimerOn, setIsTimerOn] = useState(false);
  const [currentTaskName, setCurrentTaskName] = useState("");

  const {
    files,
    currentPath,
    error,
    lastScreenshot,
    imageUrls,
    imageLoadErrors,
    loadFiles,
    loadImageUrl,
    takeScreenshot,
    deleteAllScreenshots,
  } = useScreenshots();

  const {
    isCapturing,
    screenshotInterval,
    customInterval,
    intervalError,
    handleIntervalChange,
    handleCustomIntervalChange,
    toggleCapturing,
  } = useScreenshotSettings(takeScreenshot, isTimerOn, currentTaskName);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Screenshots Directory: {currentPath}</h2>
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>Error: {error}</div>
      )}
      <TimeTracker
        onTimerStateChange={setIsTimerOn}
        onTaskNameChange={setCurrentTaskName}
      />
      <div style={{ marginTop: "20px" }}>
        <UserActivityTracker isTimerOn={isTimerOn} />
      </div>
      <div style={{ marginTop: "20px" }}>
        <h3>Screenshots:</h3>
        <SettingsPanel
          isCapturing={isCapturing}
          screenshotInterval={screenshotInterval}
          customInterval={customInterval}
          intervalError={intervalError}
          onToggleCapturing={toggleCapturing}
          onIntervalChange={handleIntervalChange}
          onCustomIntervalChange={handleCustomIntervalChange}
          onDeleteAll={deleteAllScreenshots}
          lastScreenshot={lastScreenshot}
        />
        <ScreenshotGrid
          files={files}
          imageUrls={imageUrls}
          imageLoadErrors={imageLoadErrors}
          onRetryLoad={loadImageUrl}
        />
      </div>
    </div>
  );
};

export default App;
