const qualtricsResources = [
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate-new.js',
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-DcZ2BxwU.css'
];


/**
 * Load a resource from a URL only if it is not already loaded
 * @param {string} url - The URL of the resource to load
 * @param {string} resourceType - The type of resource to load
 * @returns {Promise} - A promise that resolves when the resource is loaded
 */
function loadResource(url, resourceType) {
	return new Promise((resolve, reject) => {
			const selector = resourceType === 'script'
				? `script[src="${url}"]`
				: `link[href="${url}"]`;

			if (document.querySelector(selector)) {
				// remove it
				console.log("[Qualtrics Loader] Removing resource:", url);
				const element = document.querySelector(selector);
				if (element) {
					element.remove();
				}
			}

			const element = document.createElement(resourceType);

			if (resourceType === 'script') {
				Object.assign(element, { src: url, async: true });
			} else {
				Object.assign(element, { href: url, rel: 'stylesheet' });
			}

			element.onload = resolve;
			element.onerror = reject;
			document.head.appendChild(element);
			console.log("[Qualtrics Loader] Loaded resource:", url);
	});
}

async function loadReactApp(qualtricsSurveyEngine) {

	let questionData = qualtricsSurveyEngine.getQuestionInfo()
	let questionContainer = qualtricsSurveyEngine.getQuestionContainer()
	console.log("[Qualtrics Loader] QuestionData:", questionData)

	if (questionContainer) { 
		questionContainer.style.overflow = 'visible';
		questionContainer.style.padding = '0px';
		questionContainer.style.paddingBottom = '0px !important';
	}

	let surveyCanvas = document.querySelector('#survey-canvas')
	if (surveyCanvas) {
		surveyCanvas.style.width = '100%';
		surveyCanvas.style.margin = '0px';
	}

	// Legacy Qualtrics CSS
	// let questionText = document.querySelector('.QuestionText')
	// if (questionText) {
	// 	questionText.style.padding = '0px';
	// }

	// let questionContainerInner = document.querySelector(".SkinInner")
	// if (questionContainerInner) {
	// 	questionContainerInner.style.width = '100%'
	// 	questionContainerInner.style.paddingTop = '0px'
	// }

	// let questionSkinContainer = document.querySelector(".Skin #Questions")
	// if (questionSkinContainer) {
	// 	questionSkinContainer.style.overflow = 'visible';
	// }

	// let questionBody = document.querySelector('.QuestionBody')
	// if (questionBody) {
	// 	questionBody.style.padding = '0px !important';
	// 	questionBody.style.paddingBottom = '0px !important';
	// 	questionBody.style.paddingTop = '0px !important';
	// 	questionBody.style.paddingLeft = '0px !important';
	// 	questionBody.style.paddingRight = '0px !important';
	// }

	// let questionButton = document.querySelector('#Buttons')
	// if (questionButton) {
	// 	questionButton.style.paddingTop = '0px';
	// 	questionButton.style.paddingBottom = '0px';
	// }
	
	try {

		console.log("[Qualtrics Loader] loading script")
		await loadResource(qualtricsResources[0], 'script'); // Load React App
		console.log("[Qualtrics Loader] loading css")
		await loadResource(qualtricsResources[1], 'link');   // Load CSS

		// image via text
		// const questionImage = document.querySelector('.question-display img')
		// console.log("[Qualtrics Loader] questionImage", questionImage)
		// if (questionImage) {
		// 	questionImage.style.display = 'none';
		// 	// questionImage.style.maxHeight = '85vh';
		// 	console.log("[Qualtrics Loader] Updated question image")
		// }

		// image via graphics
		const questionGraphics = document.querySelector('.question-content img')
		console.log("[Qualtrics Loader] questionGraphics", questionGraphics)
		if (questionGraphics) {
			questionGraphics.style.display = 'none';
			console.log("[Qualtrics Loader] Updated question graphics")
		}

		if (questionContainer) {

			let appContainer = document.createElement('div');
			appContainer.id = 'cocreate-root';
			appContainer.dataset.questionId = questionData.QuestionID;

			// if (questionButton) {
			// 	questionContainer.insertBefore(appContainer, questionButton);
			// } else {
			questionContainer.appendChild(appContainer);
			// }

			const rootDiv = document.querySelector('#cocreate-root');
			if (rootDiv) {
				// rootDiv.style.display = 'flex';
				rootDiv.style.alignItems = 'center';
				rootDiv.style.justifyContent = 'center';
				rootDiv.style.overflow = 'visible';
				rootDiv.style.height = '75vh';
			}	

			console.log('React app loaded!');
		} else {
			console.error("[Qualtrics Loader] Unable to find the QuestionBody container.")
		}

	} catch (error) {
		console.error("[Qualtrics Loader] Error loading resources:", error);
	}
}

function handleDataSubmission(qualtricsSurveyEngine, pageInfo, type) {
	console.log("[Qualtrics Loader] qualtricsSurveyEngine", qualtricsSurveyEngine)
	console.log("[Qualtrics Loader] type", type)
	if (type == "next") {
		const selections = JSON.parse(localStorage.getItem('cocreate-canvasSelections'));
		const metadata = JSON.parse(localStorage.getItem('cocreate-canvasSize'));
		const questionInfo = pageInfo.getQuestionInfo()
		const questionId = questionInfo.QuestionID

		// Destroy the main container #cocreate-root
		const rootDiv = document.querySelector('#cocreate-root');
		if (rootDiv) {
			rootDiv.remove();
		}

		if (selections) {
			console.log("[Qualtrics Loader] Selections data:", selections);
		} else {
			console.error("[Qualtrics Loader] No selections data found in localStorage.");
		}

		// Extract image as a png image
		// const canvas = document.querySelector('canvas')
		// if (canvas) {
		// 	const imageData = canvas.toDataURL("image/png")
		// 	qualtricsSurveyEngine.setJSEmbeddedData("image", imageData);
		// } else {
		// 	qualtricsSurveyEngine.setJSEmbeddedData("image", null);
		// }

		// Extract the image as a link
		const image = document.querySelector('.question-content img')
		if (image) {
			const imageLink = image.src
			qualtricsSurveyEngine.setJSEmbeddedData("image", imageLink);

		} else {
			qualtricsSurveyEngine.setJSEmbeddedData("image", null);
		}

		// Store question ID and selections
		qualtricsSurveyEngine.setJSEmbeddedData("questionId", questionId)
		qualtricsSurveyEngine.setJSEmbeddedData("selectionsData", JSON.stringify(selections))
		qualtricsSurveyEngine.setJSEmbeddedData("metadata", JSON.stringify(metadata))
	}
}