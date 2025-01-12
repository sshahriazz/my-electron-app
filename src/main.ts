import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  desktopCapturer,
  protocol,
  net,
} from "electron";
import path from "path";
import fs from "fs";
import started from "electron-squirrel-startup";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

// Import keyboard-tracker using require for better native module handling
import * as ActivityTracker from "keyboard-tracker";

const keystrokeCounter = new ActivityTracker.KeystrokeCounter();
const mouseTracker = new ActivityTracker.MouseTracker();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

// Ensure screenshots directory exists
const screenshotsDir = path.join(app.getPath("userData"), "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Register IPC handlers
const registerIpcHandlers = () => {
  if (ipcMain.listenerCount("read-directory") > 0) {
    return; // Already registered
  }

  // Handle IPC for Activity Monitor
  ipcMain.handle("start-tracking-keyboard-stroke", () => {
    console.log("Started tracking keyboard strokes");

    keystrokeCounter.startTracking();
  });

  ipcMain.handle("stop-tracking-keyboard-stroke", () => {
    console.log("Stopped tracking keyboard strokes");

    keystrokeCounter.stopTracking();
  });

  ipcMain.handle("get-keyboard-tracking-data", () => {
    const data = keystrokeCounter.getStats();
    console.log("Getting keyboard tracking data", data);
    return data;
  });

  ipcMain.handle("reset-keyboard-tracking-data", () => {
    console.log("Resetting keyboard tracking data");
    keystrokeCounter.resetStats();
  });

  ipcMain.handle("start-tracking-input-stroke", () => {
    console.log("Started tracking input strokes");

    mouseTracker.startTracking();
  });

  ipcMain.handle("stop-tracking-input-stroke", () => {
    console.log("Stopped tracking input strokes");

    mouseTracker.stopTracking();
  });

  ipcMain.handle("get-input-tracking-data", () => {
    const data = mouseTracker.getStats();
    console.log("Getting input tracking data", data);
    return data;
  });

  ipcMain.handle("reset-input-tracking-data", () => {
    console.log("Resetting input tracking data");
    mouseTracker.resetStats();
  });

  // Handle IPC for directory reading
  ipcMain.handle("read-directory", () => {
    try {
      const files = fs.readdirSync(screenshotsDir);
      return { path: screenshotsDir, files };
    } catch (error) {
      console.error("Error reading directory:", error);
      return { path: "", files: [], error: error.message };
    }
  });

  // Handle IPC for getting image URLs
  ipcMain.handle("get-image-url", (_, imagePath) => {
    try {
      const fullPath = path.join(screenshotsDir, imagePath);

      // Verify the file exists before returning the URL
      if (!fs.existsSync(fullPath)) {
        console.error("Image file not found:", fullPath);
        return "";
      }

      return `media://${imagePath}`;
    } catch (error) {
      console.error("Error getting image URL:", error);
      return "";
    }
  });

  // Handle IPC for taking screenshots
  ipcMain.handle("take-screenshot", async (_, name) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 1920, height: 1080 },
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${name}-${timestamp}.png`;
      const screenshotPath = path.join(screenshotsDir, filename);

      if (sources.length > 0) {
        const source = sources[0];
        fs.writeFileSync(screenshotPath, source.thumbnail.toPNG());

        // Verify file exists and is readable
        if (!fs.existsSync(screenshotPath)) {
          throw new Error("Failed to save screenshot");
        }

        // Wait a moment to ensure file is fully written
        await new Promise((resolve) => setTimeout(resolve, 100));

        return { success: true, path: screenshotPath, filename };
      }
      return { success: false, error: "No screen source found" };
    } catch (error) {
      console.error("Error taking screenshot:", error);
      return { success: false, error: error.message };
    }
  });

  // Handle IPC for deleting all screenshots
  ipcMain.handle("delete-all-screenshots", () => {
    try {
      const files = fs.readdirSync(screenshotsDir);
      for (const file of files) {
        const filePath = path.join(screenshotsDir, file);
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting screenshots:", error);
      return { success: false, error: error.message };
    }
  });
};

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
    },
  });

  // Set CSP in the main window
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' media: data: blob:",
          ],
        },
      });
    }
  );

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

// Cleanup function
const cleanup = () => {
  // Remove all IPC handlers
  ipcMain.removeHandler("read-directory");
  ipcMain.removeHandler("get-image-url");
  ipcMain.removeHandler("take-screenshot");
  ipcMain.removeHandler("delete-all-screenshots");
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  // Register protocol before anything else
  protocol.handle("media", (request) => {
    const url = request.url.replace("media://", "");
    try {
      const filePath = path.join(screenshotsDir, decodeURIComponent(url));
      if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return new Response("File not found", { status: 404 });
      }
      return net.fetch("file://" + filePath);
    } catch (error) {
      console.error("Protocol error:", error);
      return new Response("Error serving media", { status: 500 });
    }
  });

  // Set CSP headers for all sessions
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' media: data: blob:;",
        ],
      },
    });
  });

  try {
    await installExtension(REACT_DEVELOPER_TOOLS);
  } catch (e) {
    console.error("Failed to install extension:", e);
  }

  registerIpcHandlers();
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

// Cleanup when app is quitting
app.on("before-quit", cleanup);

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
