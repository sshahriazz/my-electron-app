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
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
      devTools: true,
      webSecurity: true
    },
  });

  // Enable remote module and set session permissions
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // Set CSP headers with more permissive policy for development
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' media: data: blob:; media-src 'self' media:; connect-src 'self' ws: wss:",
          ],
        },
      });
    }
  );

  // Load the app
  try {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
      // Open DevTools immediately for development
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }
  } catch (err) {
    console.error("Failed to load the app:", err);
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
  // Install React DevTools first
  try {
    await installExtension(REACT_DEVELOPER_TOOLS);
  } catch (err) {
    console.error("Failed to install React DevTools:", err);
  }

  // Register protocol before creating window using the new protocol.handle API
  protocol.handle("media", (request) => {
    try {
      const filePath = decodeURIComponent(request.url.slice("media://".length));
      const absolutePath = path.join(screenshotsDir, filePath);

      if (!fs.existsSync(absolutePath)) {
        console.error("File not found:", absolutePath);
        return new Response("File not found", { status: 404 });
      }

      const fileStream = fs.createReadStream(absolutePath);
      return new Response(fileStream as any);
    } catch (error) {
      console.error("Error serving media:", error);
      return new Response("Error serving media", { status: 500 });
    }
  });

  await createWindow();
  registerIpcHandlers();

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
