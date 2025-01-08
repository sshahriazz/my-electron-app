import React from "react";

interface ScreenshotGridProps {
  files: string[];
  imageUrls: Record<string, string>;
  imageLoadErrors: Record<string, number>;
  onRetryLoad: (file: string) => void;
}

export const ScreenshotGrid: React.FC<ScreenshotGridProps> = ({
  files,
  imageUrls,
  imageLoadErrors,
  onRetryLoad,
}) => {
  console.log("imageUrls:", imageUrls);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "20px",
        padding: "20px",
      }}
    >
      {files
        .sort((a, b) => b.localeCompare(a))
        .map((file, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {imageUrls[file] ? (
              <img
                src={imageUrls[file]}
                alt={file}
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  console.error(`Failed to load image: ${file}`);
                  if (!imageLoadErrors[file]) {
                    onRetryLoad(file);
                  } else {
                    e.currentTarget.style.display = "none";
                  }
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f5f5f5",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div>Failed to load image</div>
                <button
                  onClick={() => onRetryLoad(file)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            <div style={{ padding: "10px", fontSize: "14px" }}>
              {file.split("/").pop()}
            </div>
          </div>
        ))}
    </div>
  );
};
