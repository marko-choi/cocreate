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
				console.log("[Qualtrics Loader] Removing resource:", url);
				// remove it
				const element = document.querySelector(selector);
				if (element) {
					element.remove();
					console.log("[Qualtrics Loader] Removed resource:", element);
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
			const questionImage = document.querySelector('.question-display img')
			console.log("[Qualtrics Loader] questionImage", questionImage)
			if (questionImage) {
				questionImage.style.display = 'none';
				// questionImage.style.maxHeight = '85vh';
				console.log("[Qualtrics Loader] Updated question image")
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

		let existingRawEmbeddedImage = qualtricsSurveyEngine.getJSEmbeddedData("image");
		let existingRawQuestionIds = qualtricsSurveyEngine.getJSEmbeddedData("questionIds");
		let existingRawSelectionsData = qualtricsSurveyEngine.getJSEmbeddedData("selectionsData");
		let existingRawMetadata = qualtricsSurveyEngine.getJSEmbeddedData("metadata");

		let existingEmbeddedImage = {};
		let existingQuestionIds = [];
		let existingSelectionsData = {};
		let existingMetadata = {};

		if (existingRawEmbeddedImage) {
			existingEmbeddedImage = JSON.parse(existingRawEmbeddedImage);
		}
		
		if (existingRawQuestionIds) {
			existingQuestionIds = JSON.parse(existingRawQuestionIds);
		}

		if (existingRawSelectionsData) {
			existingSelectionsData = JSON.parse(existingRawSelectionsData);
		}

		if (existingRawMetadata) {
			existingMetadata = JSON.parse(existingRawMetadata);
		}
		console.log("[Qualtrics Loader] existingEmbeddedImage", existingEmbeddedImage)
		console.log("[Qualtrics Loader] existingQuestionIds", existingQuestionIds)
		console.log("[Qualtrics Loader] existingSelectionsData", existingSelectionsData)
		console.log("[Qualtrics Loader] existingMetadata", existingMetadata)

		// Extract the image as a link
		let imageLink;
		const image = document.querySelector('.question-content img')
		if (image) { imageLink = image.src }

		if (existingEmbeddedImage) {
			existingEmbeddedImage[questionId] = imageLink;
		} else {
			existingEmbeddedImage = { [questionId]: imageLink }
		}

		if (existingQuestionIds) {
			existingQuestionIds.push(questionId);
		} else {
			existingQuestionIds = [questionId];
		}

		if (existingSelectionsData) {
			existingSelectionsData[questionId] = selections;
		} else {
			existingSelectionsData = { [questionId]: selections }
		}

		if (existingMetadata) {
			existingMetadata[questionId] = metadata;
		} else {
			existingMetadata = { [questionId]: metadata }
		}

		// Store question ID and selections
		qualtricsSurveyEngine.setJSEmbeddedData("image", JSON.stringify(existingEmbeddedImage))
		qualtricsSurveyEngine.setJSEmbeddedData("questionIds", JSON.stringify(existingQuestionIds))
		qualtricsSurveyEngine.setJSEmbeddedData("selectionsData", JSON.stringify(existingSelectionsData))
		qualtricsSurveyEngine.setJSEmbeddedData("metadata", JSON.stringify(existingMetadata))

		console.log("[Qualtrics Loader] new embeded image:", qualtricsSurveyEngine.getJSEmbeddedData("image"))
		console.log("[Qualtrics Loader] new embeded questionIds:", qualtricsSurveyEngine.getJSEmbeddedData("questionIds"))
		console.log("[Qualtrics Loader] new embeded selectionsData:", qualtricsSurveyEngine.getJSEmbeddedData("selectionsData"))
		console.log("[Qualtrics Loader] new embeded metadata:", qualtricsSurveyEngine.getJSEmbeddedData("metadata"))
	}
}