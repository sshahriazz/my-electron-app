// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

export type ElectronAPI = {
  readDirectory: () => Promise<{
    path: string;
    files: string[];
    error?: string;
  }>;
  getImageUrl: (imagePath: string) => Promise<string>;
  takeScreenshot: (name: string) => Promise<void>;
  deleteAllScreenshots: () => Promise<void>;
  startTrackingKeyboardStroke: () => Promise<void>;
  stopTrackingKeyboardStroke: () => Promise<void>;
  getKeyboardTrackingData: () => Promise<{
    totalKeystrokes: number;
    keyFrequencies: Record<string, number>;
    startTime: number;
    lastKeystrokeTime: number;
  }>;
};

const electronAPI: ElectronAPI = {
  readDirectory: () => ipcRenderer.invoke("read-directory"),
  getImageUrl: (imagePath) => ipcRenderer.invoke("get-image-url", imagePath),
  takeScreenshot: (name) => ipcRenderer.invoke("take-screenshot", name),
  deleteAllScreenshots: () => ipcRenderer.invoke("delete-all-screenshots"),
  startTrackingKeyboardStroke: () =>
    ipcRenderer.invoke("start-tracking-keyboard-stroke"),
  stopTrackingKeyboardStroke: () =>
    ipcRenderer.invoke("stop-tracking-keyboard-stroke"),
  getKeyboardTrackingData: () =>
    ipcRenderer.invoke("get-keyboard-tracking-data"),
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
