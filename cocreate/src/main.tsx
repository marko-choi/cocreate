import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Function to ensure the #root element exists before rendering
function mountApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('React app mounted!');
  } 
}

// Attempt to mount the app
mountApp();

// ================================================================================================
// Qualtrics SurveyEngine interface
// ================================================================================================
/**
 * Loads an external resource (script or stylesheet) by appending it to document.head.
 *
 * @param url - The URL of the resource.
 * @param type - The type of resource to load; either 'script' or 'link'.
 * @returns A Promise that resolves when the resource loads, or rejects on error.
 */
export function loadResource(url: string, type: 'script' | 'link'): Promise<void> {
	return new Promise((resolve, reject) => {
		let element: HTMLElement | null = null;
		if (type === 'script') {
			element = document.createElement('script');
			(element as HTMLScriptElement).src = url;
			(element as HTMLScriptElement).async = true;
			element.onload = () => resolve;
			element.onerror = (e) => reject(e);
		} else if (type === 'link') {
			element = document.createElement('link');
			(element as HTMLLinkElement).href = url;
			(element as HTMLLinkElement).rel = 'stylesheet';
			element.onload = () => resolve;
			element.onerror = (e) => reject(e);
		}
		document.head.appendChild(element as Node);
	});
}

/**
 * An interface describing the Qualtrics SurveyEngine,
 * based on the methods used in your code.
 */
export interface QualtricsSurveyEngine {
  getQuestionInfo(): any; // Adjust this type if you know more about the returned data.
  getQuestionContainer(): HTMLElement;
}


/**
 * Loads the React application into the Qualtrics question container.
 *
 * This function adjusts various container styles to ensure that your React
 * app is displayed correctly and that no content is clipped.
 *
 * @param qualtricsSurveyEngine - The Qualtrics SurveyEngine instance.
 */
export async function loadReactApp(
  qualtricsSurveyEngine: QualtricsSurveyEngine,
  resources: [string, string]
): Promise<void> {

	let questionData = qualtricsSurveyEngine.getQuestionInfo()
	let questionBody = qualtricsSurveyEngine.getQuestionContainer()
	console.log("QuestionBody:", questionData)
	questionBody.style.overflow = 'visible';
	questionBody.style.padding = '0px';
	
	let questionContainerInner = document.querySelector(".SkinInner") as HTMLElement;
  if (questionContainerInner) {
    questionContainerInner.style.width = '100%'
    questionContainerInner.style.paddingTop = '0px'
  }
	
	
	let questionSkinContainer = document.querySelector(".Skin #Questions") as HTMLElement;
  if (questionSkinContainer) {
    questionSkinContainer.style.overflow = 'visible';
  }
	
	try {

		await loadResource(resources[0], 'script'); // Load React App
		await loadResource(resources[1], 'link');   // Load CSS

		const questionImage = document.querySelector('.QuestionText img') as HTMLElement;
		if (questionImage) {
			questionImage.style.display = 'none';
		}

		if (questionBody) {

			let appContainer = document.createElement('div');
			appContainer.id = 'root';
			questionBody.appendChild(appContainer);

			const rootDiv = document.querySelector('#root') as HTMLElement;
			if (rootDiv) {
				rootDiv.style.display = 'flex';
				rootDiv.style.alignItems = 'center';
				rootDiv.style.justifyContent = 'center';
				rootDiv.style.overflow = 'visible';
			}	

			console.log('React app loaded!');
		} else {
			console.error("Unable to find the QuestionBody container.")
		}

	} catch (error) {
		console.error('Error loading resources:', error);
	}
}

if (typeof window !== 'undefined') {
  (window as any).loadReactApp = loadReactApp;
}
// ================================================================================================