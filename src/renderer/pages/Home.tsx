import React, { useEffect, useState } from "react";
import { ScreenshotGrid } from "../components/ScreenshotGrid";
import { SettingsPanel } from "../components/SettingsPanel";
import { TimeTracker } from "../components/TimeTracker";
import { useScreenshots } from "../hooks/useScreenshots";
import { useScreenshotSettings } from "../hooks/useScreenshotSettings";

const Home: React.FC = () => {
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

  const [getKeyboardTrackingData, setKeyboardTrackingData] = useState({});

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold mb-4">Activity Monitor</h1>
      {JSON.stringify(getKeyboardTrackingData, null, 2)}
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => window.electronAPI.startTrackingKeyboardStroke()}
        type="button"
      >
        Start
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          const data = await window.electronAPI.getKeyboardTrackingData();
          console.log(data);

          setKeyboardTrackingData(data);
        }}
        type="button"
      >
        Get Data
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => window.electronAPI.stopTrackingKeyboardStroke()}
        type="button"
      >
        Stop
      </button>
      <h2 className="text-xl font-semibold mb-4">
        Screenshots Directory: {currentPath}
      </h2>
      {error && <div className="text-red-500 mt-3">Error: {error}</div>}
      <TimeTracker
        onTimerStateChange={setIsTimerOn}
        onTaskNameChange={setCurrentTaskName}
      />
      <div className="mt-5">
        <h3 className="text-lg font-semibold mb-3">Screenshots:</h3>
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

export default Home;
