import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }

  // Initialize the app
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
