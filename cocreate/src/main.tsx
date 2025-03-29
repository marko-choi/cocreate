import { createRoot } from 'react-dom/client'
import App from './App'

const generateInstanceId = () => {
  const INSTANCE_PREFIX = "QID";
  return INSTANCE_PREFIX + Math.random().toString(36).substring(2, 15);
}

const renderAllCocreateApps = () => {
  const rootElements = document.querySelectorAll(".cocreate-root");

  rootElements.forEach((rootElement) => {
    if (!rootElement.hasAttribute("data-react-mounted")) {
      const root = createRoot(rootElement);
      const instanceId = rootElement.getAttribute("data-question-id")

      if (instanceId) {
        root.render(<App instanceId={instanceId} />);
      } else {
        console.log("[Cocreate] No instanceId found for root element");
        const generatedInstanceId = generateInstanceId();
        rootElement.setAttribute("data-question-id", generatedInstanceId);
        root.render(<App instanceId={generatedInstanceId} />);
      }

      rootElement.setAttribute("data-react-mounted", "true");
    }
  });
}

const observeAndRenderCocreate = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        renderAllCocreateApps();
      }
    });
  });

  // Observe the entire document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

// Initial render and observe for dynamic content changes
renderAllCocreateApps();
observeAndRenderCocreate();
