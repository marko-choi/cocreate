import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Store the root instance globally so it can be accessed by unmount function
let rootInstance: ReturnType<typeof createRoot> | null = null;

// Function to unmount the React app
export function unmountApp() {
  if (rootInstance) {
    rootInstance.unmount();
    rootInstance = null;
    console.log('[Cocreate] React app unmounted!');
  }
}

// Function to ensure the #root element exists before rendering
function mountApp() {
  const rootElement = document.getElementById('cocreate-root');
  console.log("[Cocreate] Checking for root element:", rootElement);

  if (rootElement) {
    rootInstance = createRoot(rootElement);
    rootInstance.render(<App />);
    console.log('[Cocreate] React app mounted!');
  } else {
    setTimeout(mountApp, 50);
  }
}

// Attempt to mount the app
mountApp();