/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    readDirectory: () => Promise<{
      path: string;
      files: string[];
      error?: string;
    }>;
    takeScreenshot: (name: string) => Promise<{
      success: boolean;
      filename?: string;
      path?: string;
      error?: string;
    }>;
    getImageUrl: (imagePath: string) => Promise<string>;
    deleteAllScreenshots: () => Promise<{
      success: boolean;
      error?: string;
    }>;
  };
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string | undefined;
