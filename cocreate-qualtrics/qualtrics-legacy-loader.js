const qualtricsResources = [
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate-new.js',
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-CacrYfD-.css'
];


/**
 * Load a resource from a URL only if it is not already loaded
 * @param {string} url - The URL of the resource to load
 * @param {string} resourceType - The type of resource to load
 * @returns {Promise} - A promise that resolves when the resource is loaded
 */
function loadResource(url, resourceType) {
	return new Promise((resolve, reject) => {
		let element;
		if (resourceType === 'script') {
			element = document.createElement('script');
			element.src = url;
			element.async = true;
			element.onload = resolve;
			element.onerror = reject;
		} else if (resourceType === 'link') {
			element = document.createElement('link');
			element.href = url;
			element.rel = 'stylesheet';
			element.onload = resolve;
			element.onerror = reject;
		}
		document.head.appendChild(element);
	});
}


async function loadReactApp(qualtricsSurveyEngine) {

	let questionData = qualtricsSurveyEngine.getQuestionInfo()
	let questionContainer = qualtricsSurveyEngine.getQuestionContainer()
	console.log("[Qualtrics Loader] QuestionData:", questionData)
	console.log("[Qualtrics Loader] QuestionContainer:", questionContainer)

	if (questionContainer) {
		questionContainer.style.overflow = 'visible';
		questionContainer.style.padding = '0px';
		questionContainer.style.paddingBottom = '0px !important';
	}

	let questionText = document.querySelector('.QuestionText')
	if (questionText) {
		questionText.style.padding = '0px';
		console.log("[Qualtrics Loader] Updated question text")
	}

	let questionContainerInner = document.querySelector(".SkinInner")
	if (questionContainerInner) {
		questionContainerInner.style.width = '100%'
		questionContainerInner.style.paddingTop = '0px'
		console.log("[Qualtrics Loader] Updated inner question container")
	}

	let questionSkinContainer = document.querySelector(".Skin #Questions")
	if (questionSkinContainer) {
		questionSkinContainer.style.overflow = 'visible';
		console.log("[Qualtrics Loader] Updated question container")
	}

	let questionBody = document.querySelector('.QuestionBody')
	if (questionBody) {
		questionBody.style.padding = '0px !important';
		questionBody.style.paddingBottom = '0px !important';
		questionBody.style.paddingTop = '0px !important';
		questionBody.style.paddingLeft = '0px !important';
		questionBody.style.paddingRight = '0px !important';
		console.log("[Qualtrics Loader] Updated question body")
	}

	let questionButton = document.querySelector('#Buttons')
	if (questionButton) {
		questionButton.style.paddingTop = '0px';
		questionButton.style.paddingBottom = '0px';
		console.log("[Qualtrics Loader] Updated question button")
	}

	try {
		console.log("[Qualtrics Loader] loading script")
		await loadResource(qualtricsResources[0], 'script'); // Load React App
		console.log("[Qualtrics Loader] loading css")
		await loadResource(qualtricsResources[1], 'link');   // Load CSS

		if (questionContainer) {
			// Hide question image
			const questionImage = document.querySelector('.QuestionText img')
			if (questionImage) {
				questionImage.style.display = 'none';
				questionImage.style.maxHeight = '85vh';
				console.log("[Qualtrics Loader] Updated question image")
			}
			let appContainer = document.createElement('div');
			appContainer.id = `cocreate-root-${questionData.QuestionID}`;
			appContainer.className = 'cocreate-root';
			appContainer.dataset.questionId = questionData.QuestionID;
			if (questionButton) {
				questionContainer.insertBefore(appContainer, questionButton);
			} else {
			questionContainer.appendChild(appContainer);
			}

			if (appContainer) {
				appContainer.style.display = 'flex';
				appContainer.style.alignItems = 'center';
				appContainer.style.justifyContent = 'center';
				appContainer.style.overflow = 'visible';
				appContainer.style.height = '65vh';
			}

			console.log('[Qualtrics Loader] React app loaded!');
		} else {
			console.error("[Qualtrics Loader] Unable to find the QuestionBody container.")
		}

	} catch (error) {
		console.error("[Qualtrics Loader] Error loading resources:", error);
	}
}

function handleDataSubmission(qualtricsSurveyEngine, pageInfo, type) {

	console.log('[Qualtrics Loader] Qualtrics Survey Engine:', qualtricsSurveyEngine)
	console.log('[Qualtrics Loader] Page Info:', pageInfo)
	console.log('[Qualtrics Loader] Type:', type)

	if (type == "next") {
		const selections = JSON.parse(localStorage.getItem('cocreate-canvasSelections'));
		const metadata = JSON.parse(localStorage.getItem('cocreate-canvasSize'));
		const questionInfo = pageInfo.getQuestionInfo()
		const questionId = questionInfo.QuestionID

		let textEditorImageContainer = ".QuestionText img"
		let QUESTION_IMAGE_SOURCE = textEditorImageContainer
		let imageLink = ""
		let image = document.querySelector(QUESTION_IMAGE_SOURCE)
		if (image) {
			imageLink = image.src
		}


		if (selections) {
			console.log('[Qualtrics Loader] Selections data:', selections);
		} else {
			console.error('[Qualtrics Loader] No selections data found in localStorage.');
		}

		// Store question ID and selections
		qualtricsSurveyEngine.setEmbeddedData("image", imageLink)
		qualtricsSurveyEngine.setEmbeddedData("questionId", questionId)
		qualtricsSurveyEngine.setEmbeddedData("selectionsData", JSON.stringify(selections))
		qualtricsSurveyEngine.setEmbeddedData("metadata", JSON.stringify(metadata))
	}
}

