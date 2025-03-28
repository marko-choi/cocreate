import { createRoot } from 'react-dom/client'
import App from './App'

const observeAndRenderCocreate = () => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const rootElement = document.querySelector('#cocreate-root');

        if (rootElement && !rootElement.hasAttribute('data-react-mounted')) {
          const root = createRoot(rootElement);
          root.render(<App />);
          rootElement.setAttribute('data-react-mounted', 'true');
        }
      }
    }
  });

  // Observe the entire document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

// Initial render
const rootElement = document.querySelector('#cocreate-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}

// Start observing for dynamic content changes
observeAndRenderCocreate();
