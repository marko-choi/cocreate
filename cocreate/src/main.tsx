import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
console.log("Checking for root element")
  
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Attempt to mount the app
// mountApp();


// // Qualtrics Entrypoint

// export function loadResource(url: string, type: string) {
//   return new Promise((resolve, reject) => {
//     let element;

//     // Check if the resource already exists in the document
//     if (type === 'script') {
//       element = document.createElement('script');
//       element.src = url;
//       element.async = true;
//       element.onload = resolve;
//       element.onerror = reject;
//     } else if (type === 'link') {
//       element = document.createElement('link');
//       element.href = url;
//       element.rel = 'stylesheet';
//       element.onload = resolve;
//       element.onerror = reject;
//     }

//     document.head.appendChild((element as HTMLElement));
//   });
// }


// export async function loadReactApp() {
//   try {
    
//     // await loadResource(resources[0], 'script'); // Load React App
//     // await loadResource(resources[1], 'link');   // Load CSS
    
//     const questionImage = document.querySelector('.QuestionText img')
//     if (questionImage) {
//       (questionImage as HTMLElement).style.display = 'none';
//     }

//     const questionBody = document.querySelector('.QuestionBody');
//     if (questionBody) {
      
//       let appContainer = document.createElement('div');
//       appContainer.id = 'root';
//       appContainer.style.position = 'relative';
//       appContainer.style.overflow = 'auto';
//       appContainer.style.maxWidth = '100%';
//       appContainer.style.height = '534px';
      
//       questionBody.appendChild(appContainer);
      
//       console.log('React app loaded!');
//     } else {
//       console.error("Unable to find the QuestionBody container.")
//     }
    
//   } catch (error) {
//     console.error('Error loading resources:', error);
//   }
// }
