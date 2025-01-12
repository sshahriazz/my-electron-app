import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Error boundary for catching render errors
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
      return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
      console.error("Render Error:", error);
      console.error("Error Info:", errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return <div>Something went wrong. Check the console for details.</div>;
      }
      return this.props.children;
    }
  }

  // Add error handler for uncaught exceptions
  window.addEventListener("error", (event) => {
    console.error("Uncaught error:", event.error);
  });

  // Add error handler for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
  });

  try {
    console.log("Starting renderer process...");
    const container = document.getElementById("root");
    if (!container) {
      throw new Error("Root element not found");
    }

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("Renderer process started successfully");
  } catch (error) {
    console.error("Failed to start renderer process:", error);
    document.body.innerHTML =
      "<div>Failed to start application. Check console for details.</div>";
  }
});
