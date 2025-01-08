// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  readDirectory: () => ipcRenderer.invoke("read-directory"),
  takeScreenshot: (name: string) => ipcRenderer.invoke("take-screenshot", name),
  getImageUrl: (imagePath: string) =>
    ipcRenderer.invoke("get-image-url", imagePath),
  deleteAllScreenshots: () => ipcRenderer.invoke("delete-all-screenshots"),
});
