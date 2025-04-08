/**
 * Load a resource from a URL only if it is not already loaded
 * @param {string} url - The URL of the resource to load
 * @param {string} resourceType - The type of resource to load
 * @returns {Promise} - A promise that resolves when the resource is loaded
 */
function loadResource(url, resourceType) {
  return new Promise((resolve, reject) => {
    const selector =
      resourceType === 'script'
        ? `script[src="${url}"]`
        : `link[href="${url}"]`;

    // If it's already loaded, resolve immediately
    if (document.querySelector(selector)) {
      console.log('[Qualtrics Loader] Resource already loaded:', url);
      resolve();
      return;
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
    console.log('[Qualtrics Loader] Loaded resource:', url);
  });
}


async function loadReactApp(qualtricsSurveyEngine) {

	let qualtricsResources = [
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate-new.js',
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-DJdpblcO.css'
	];

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

		if (questionContainer) {

			// Hide the question image
			const questionImage = questionContainer.querySelector('.question-content img')
			console.log("[Qualtrics Loader] questionImage", questionImage)
			if (questionImage) {
				questionImage.style.display = 'none';
				// questionImage.style.maxHeight = '85vh';
				console.log("[Qualtrics Loader] Updated question image")
			}

			// Hide question image - inside text editor
			const textEditorImage = questionContainer.querySelector('.question-display-wrapper img')
			if (textEditorImage) {
				textEditorImage.style.display = 'none';
				console.log("[Qualtrics Loader] Updated image inside text editor")
			}

			// Hide question text area
			const questionTextArea = questionContainer.querySelector('.question-content textarea')
			if (questionTextArea) {
				questionTextArea.style.display = 'none';
				console.log("[Qualtrics Loader] Updated question text area")
			}

			let appContainer = document.createElement('div');
			appContainer.id = `cocreate-root-${questionData.QuestionID}`;
			appContainer.className = 'cocreate-root';
			appContainer.dataset.questionId = questionData.QuestionID;
			questionContainer.appendChild(appContainer);

			if (appContainer) {
				appContainer.style.display = 'flex';
				appContainer.style.alignItems = 'center';
				appContainer.style.justifyContent = 'center';
				appContainer.style.overflow = 'visible';
				appContainer.style.height = '65vh';
			}

			console.log('React app loaded!');
			createQuestionListeners(qualtricsSurveyEngine)

		} else {
			console.error("[Qualtrics Loader] Unable to find the QuestionBody container.")
		}

	} catch (error) {
		console.error("[Qualtrics Loader] Error loading resources:", error);
	}
}

function createQuestionListeners(qualtricsSurveyEngine) {
	let questionData = qualtricsSurveyEngine.getQuestionInfo()
	let questionContainer = qualtricsSurveyEngine.getQuestionContainer()
	let questionId = questionData.QuestionID

	let textEditorImageContainer = ".question-display-wrapper img"
	let questionImageContainer = ".question-content img"

	const QUESTION_IMAGE_SOURCE = textEditorImageContainer
	let imageLink = ""
	let image = questionContainer.querySelector(QUESTION_IMAGE_SOURCE)
	if (image) {
		imageLink = image.src
	}

	const selectionsData = JSON.parse(localStorage.getItem('cocreate-canvasSelections'))
	const metadata = JSON.parse(localStorage.getItem('cocreate-canvasSize'))
	let responseData = {
		image: imageLink,
		selectionsData: selectionsData,
		metadata: metadata
	}

	// Function to update the textarea with new data
	function updateTextArea(newData) {
		const questionTextAreas = questionContainer.querySelectorAll('.question-content textarea');
		if (questionTextAreas) {
			// Update the value
			let stringifiedData = JSON.stringify(newData)
			console.log(`[Qualtrics Loader][${questionId}] Updating questionTextArea with new data: ${stringifiedData}`);
			questionTextAreas.forEach(textarea => {
				textarea.value = stringifiedData;
			});

			// Trigger input and change events to ensure Qualtrics recognizes the change
			const inputEvent = new Event('input', { bubbles: true });
			const changeEvent = new Event('change', { bubbles: true });
			questionTextAreas.forEach(textarea => {
				textarea.dispatchEvent(inputEvent);
				textarea.dispatchEvent(changeEvent);
			});

			console.log(`[Qualtrics Loader][${questionId}] Updated questionTextArea with new data: ${JSON.stringify(newData)}`);
		}
	}

	// Add localStorage event listener to update responseData and questionTextArea
	window.addEventListener('storage', function(e) {
		if (e.key === 'cocreate-canvasSelections' || e.key === 'cocreate-canvasSize') {
			console.log(`[Qualtrics Loader][${questionId}] localStorage changed:`, e.key);

			// Update responseData with new values
			if (e.key === 'cocreate-canvasSelections') {
				responseData.selectionsData = JSON.parse(e.newValue);
			} else if (e.key === 'cocreate-canvasSize') {
				responseData.metadata = JSON.parse(e.newValue);
			}

			// Update questionTextArea with new responseData
			updateTextArea(responseData);
		}
	});

	// Also listen for custom events that might be dispatched from the same window
	window.addEventListener('localStorageUpdated', function(e) {
		if (e.detail && (e.detail.key === 'cocreate-canvasSelections' || e.detail.key === 'cocreate-canvasSize')) {
			console.log(`[Qualtrics Loader][${questionId}] Custom event detected:`, e.detail.key);

			// Update responseData with new values
			if (e.detail.key === 'cocreate-canvasSelections') {
				responseData.selectionsData = e.detail.value;
			} else if (e.detail.key === 'cocreate-canvasSize') {
				responseData.metadata = e.detail.value;
			}

			// Update questionTextArea with new responseData
			updateTextArea(responseData);
		}
	});

	// Set up a MutationObserver to watch for changes to the textarea
	const textAreaObserver = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
				console.log(`[Qualtrics Loader][${questionId}] Textarea value changed via DOM:`, mutation.target.value);
			}
		});
	});

	// Start observing the textarea if it exists
	const questionTextArea = questionContainer.querySelector('.question-content textarea');
	if (questionTextArea) {
		textAreaObserver.observe(questionTextArea, { attributes: true });
	}

	// Initial update of the textarea
	updateTextArea(responseData);
}

function handleDataSubmission(qualtricsSurveyEngine, pageInfo, type) { }
	// const questionInfo = pageInfo.getQuestionInfo()
	// const questionId = questionInfo.QuestionID
	// const questionContainer = pageInfo.getQuestionContainer()

	// console.log(`[Qualtrics Loader][${questionId}] qualtricsSurveyEngine`, qualtricsSurveyEngine)
	// console.log(`[Qualtrics Loader][${questionId}] type`, type)

	// if (type == "next") {
	// 	const selections = JSON.parse(localStorage.getItem('cocreate-canvasSelections'));
	// 	const metadata = JSON.parse(localStorage.getItem('cocreate-canvasSize'));

	// 	// Destroy the main container #cocreate-root
	// 	const rootDiv = document.querySelector('#cocreate-root');
	// 	if (rootDiv) {
	// 		rootDiv.remove();
	// 	}

	// 	if (selections) {
	// 		console.log(`[Qualtrics Loader][${questionId}] Selections data:`, selections);
	// 	} else {
	// 		console.error(`[Qualtrics Loader][${questionId}] No selections data found in localStorage.`);
	// 	}

	// 	let existingRawEmbeddedImage = qualtricsSurveyEngine.getJSEmbeddedData("image");
	// 	let existingRawQuestionIds = qualtricsSurveyEngine.getJSEmbeddedData("questionIds");
	// 	let existingRawSelectionsData = qualtricsSurveyEngine.getJSEmbeddedData("selectionsData");
	// 	let existingRawMetadata = qualtricsSurveyEngine.getJSEmbeddedData("metadata");

	// 	let existingEmbeddedImage = {};
	// 	let existingQuestionIds = [];
	// 	let existingSelectionsData = {};
	// 	let existingMetadata = {};

	// 	if (existingRawEmbeddedImage) {
	// 		existingEmbeddedImage = JSON.parse(existingRawEmbeddedImage);
	// 	}

	// 	if (existingRawQuestionIds) {
	// 		existingQuestionIds = JSON.parse(existingRawQuestionIds);
	// 	}

	// 	if (existingRawSelectionsData) {
	// 		existingSelectionsData = JSON.parse(existingRawSelectionsData);
	// 	}

	// 	if (existingRawMetadata) {
	// 		existingMetadata = JSON.parse(existingRawMetadata);
	// 	}
	// 	console.log(`[Qualtrics Loader][${questionId}] existingEmbeddedImage`, existingEmbeddedImage)
	// 	console.log(`[Qualtrics Loader][${questionId}] existingQuestionIds`, existingQuestionIds)
	// 	console.log(`[Qualtrics Loader][${questionId}] existingSelectionsData`, existingSelectionsData)
	// 	console.log(`[Qualtrics Loader][${questionId}] existingMetadata`, existingMetadata)

	// 	// Extract the image as a link
	// 	let imageLink;
	// 	const image = document.querySelector('.question-content img')
	// 	if (image) { imageLink = image.src }

	// 	if (existingEmbeddedImage) {
	// 		existingEmbeddedImage[questionId] = imageLink;
	// 	} else {
	// 		existingEmbeddedImage = { [questionId]: imageLink }
	// 	}

	// 	if (existingQuestionIds) {
	// 		existingQuestionIds.push(questionId);
	// 	} else {
	// 		existingQuestionIds = [questionId];
	// 	}

	// 	if (existingSelectionsData) {
	// 		existingSelectionsData[questionId] = selections[questionId];
	// 	} else {
	// 		existingSelectionsData = { [questionId]: selections[questionId] }
	// 	}

	// 	if (existingMetadata) {
	// 		existingMetadata[questionId] = metadata[questionId];
	// 	} else {
	// 		existingMetadata = { [questionId]: metadata[questionId] }
	// 	}

	// 	let responseData = {
	// 		image: existingEmbeddedImage,
	// 		questionIds: existingQuestionIds,
	// 		selectionsData: existingSelectionsData,
	// 		metadata: existingMetadata
	// 	}

	// 	let stringifiedResponseData = JSON.stringify(responseData)

	// 	// Store in textarea from question container
	// 	const questionTextArea = questionContainer.querySelector('.question-content textarea')
	// 	if (questionTextArea) {
	// 		questionTextArea.value = stringifiedResponseData
	// 	}

		// Store question ID and selections
		// qualtricsSurveyEngine.setJSEmbeddedData("image", JSON.stringify(existingEmbeddedImage))
		// qualtricsSurveyEngine.setJSEmbeddedData("questionIds", JSON.stringify(existingQuestionIds))
		// qualtricsSurveyEngine.setJSEmbeddedData("selectionsData", JSON.stringify(existingSelectionsData))
		// qualtricsSurveyEngine.setJSEmbeddedData("metadata", JSON.stringify(existingMetadata))

		// console.log(`[Qualtrics Loader][${questionId}] new embeded image:`, qualtricsSurveyEngine.getJSEmbeddedData("image"))
		// console.log(`[Qualtrics Loader][${questionId}] new embeded questionIds:`, qualtricsSurveyEngine.getJSEmbeddedData("questionIds"))
		// console.log(`[Qualtrics Loader][${questionId}] new embeded selectionsData:`, qualtricsSurveyEngine.getJSEmbeddedData("selectionsData"))
		// console.log(`[Qualtrics Loader][${questionId}] new embeded metadata:`, qualtricsSurveyEngine.getJSEmbeddedData("metadata"))
	// }