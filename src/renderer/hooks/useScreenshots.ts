import { useState, useCallback } from "react";

export interface Screenshot {
  path: string;
  url: string;
}

export const useScreenshots = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [lastScreenshot, setLastScreenshot] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<
    Record<string, number>
  >({});

  const loadImageUrl = async (file: string, retryCount = 0) => {
    if (!file) return;

    try {
      const url = await window.electronAPI.getImageUrl(file);

      if (!url) {
        throw new Error("No URL returned");
      }

      setImageUrls((prev) => ({ ...prev, [file]: url }));
      setImageLoadErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[file];
        return newErrors;
      });
    } catch (err) {
      console.error(`Failed to load URL for ${file}:`, err);
      if (retryCount < 3) {
        setTimeout(() => {
          loadImageUrl(file, retryCount + 1);
        }, Math.min(Math.pow(2, retryCount) * 1000, 5000));
      } else {
        setImageLoadErrors((prev) => ({ ...prev, [file]: retryCount }));
      }
    }
  };

  const loadFiles = useCallback(async () => {
    try {
      const result = await window.electronAPI.readDirectory();
      if (result.files) {
        setFiles(result.files);
        setCurrentPath(result.path);
        // Load URLs for any new files
        result.files.forEach((file) => {
          if (!imageUrls[file] && !imageLoadErrors[file]) {
            loadImageUrl(file);
          }
        });
      }
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to read directory");
      console.error(err);
    }
  }, [imageUrls, imageLoadErrors]);

  const takeScreenshot = async (name: string) => {
    try {
      // Make the filename URL-friendly
      const urlFriendlyName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // Replace any non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens

      const result = await window.electronAPI.takeScreenshot(urlFriendlyName);

      if (result.success && result.filename) {
        // Update files list with the new screenshot
        setFiles((prev) => {
          if (!prev.includes(result.filename!)) {
            return [result.filename!, ...prev];
          }
          return prev;
        });

        // Load the image URL immediately
        await loadImageUrl(result.filename);
        setLastScreenshot(result.filename);
      } else {
        console.error("Failed to take screenshot:", result.error);
      }
    } catch (error) {
      console.error("Error taking screenshot:", error);
    }
  };

  const deleteAllScreenshots = useCallback(async () => {
    try {
      const result = await window.electronAPI.deleteAllScreenshots();
      if (result.success) {
        setFiles([]);
        setLastScreenshot("");
        setImageUrls({});
        setImageLoadErrors({});
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to delete screenshots");
      console.error(err);
    }
  }, []);

  return {
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
  };
};
