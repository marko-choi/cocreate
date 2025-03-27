import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Function to ensure the #root element exists before rendering
function mountApp() {
  const rootElement = document.getElementById('cocreate-root') as any;
  console.log("Checking for root element:", rootElement);

  if (rootElement) {
    // Unmount previous app if it exists
    console.log('Unmounting previous React app');
    if (rootElement._reactRootContainer) {
      rootElement._reactRootContainer.unmount(); // Clean up before remounting
    }

    // Mount the app
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('React app mounted!');
  } else {
    // Retry after a short delay if #root is not found
    setTimeout(mountApp, 50);
  }
}

// Attempt to mount the app
mountApp();
