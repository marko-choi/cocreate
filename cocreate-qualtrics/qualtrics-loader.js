/**
 * Fetch and parse CSV configuration from a URL
 * @param {string} csvUrl - The URL of the CSV file
 * @returns {Promise<Object>} - A promise that resolves to the parsed configuration object
 */
async function fetchCsvConfig(csvUrl) {
  try {
    console.log('[Qualtrics Loader] Fetching CSV config from:', csvUrl);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();

    // Parse CSV content
    const lines = csvText.trim().split('\n');
    const config = {};

    lines.forEach(line => {
      const [key, value] = line.split(',').map(item => item.trim());
      config[key] = value.toLowerCase() === 'true';
    });

    console.log('[Qualtrics Loader] Parsed CSV config:', config);
    return config;
  } catch (error) {
    console.error('[Qualtrics Loader] Error fetching CSV config:', error);
    // Return default configuration if CSV fetch fails
    return {
      showFunctionValue: true,
      showAestheticValue: true,
      showComment: true
    };
  }
}

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

const CANVAS_SELECTIONS_KEY = 'cocreate-canvasSelections';
const CANVAS_SIZE_KEY = 'cocreate-canvasSize';
const QUESTION_IDS_KEY = 'cocreate-questionIds';
const IMAGE_MAP_KEY = 'cocreate-imageMap';
const SURVEY_SESSION_KEY = 'cocreate-surveySessionId';

const safeParse = (value, fallback) => {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch (error) {
    console.warn('[Qualtrics Loader] Failed to parse value, using fallback', error);
    return fallback;
  }
};

const getSurveySessionId = (qualtricsSurveyEngine) => {
  try {
    if (qualtricsSurveyEngine?.getSurveyID) return qualtricsSurveyEngine.getSurveyID();
    const questionInfo = qualtricsSurveyEngine?.getQuestionInfo?.();
    if (questionInfo?.SurveyID) return questionInfo.SurveyID;
    if (typeof window !== 'undefined') {
      return `${window.location.pathname}${window.location.search}`;
    }
  } catch (error) {
    console.warn('[Qualtrics Loader] Unable to derive survey session id', error);
  }
  return 'unknown-session';
};

const ensureSurveySession = (qualtricsSurveyEngine) => {
  const currentSessionId = getSurveySessionId(qualtricsSurveyEngine);
  const storedSessionId = localStorage.getItem(SURVEY_SESSION_KEY);

  // If we can't distinguish sessions, avoid clearing to prevent data loss
  if (!currentSessionId) return currentSessionId;

  if (!storedSessionId || storedSessionId !== currentSessionId) {
    // New survey detected — clear previous run’s data
    localStorage.removeItem(CANVAS_SELECTIONS_KEY);
    localStorage.removeItem(CANVAS_SIZE_KEY);
    localStorage.removeItem(QUESTION_IDS_KEY);
    localStorage.removeItem(IMAGE_MAP_KEY);
    localStorage.setItem(SURVEY_SESSION_KEY, currentSessionId);
    console.log('[Qualtrics Loader] Reset localStorage for new survey session:', currentSessionId);
  }

  return currentSessionId;
};

async function loadReactApp(qualtricsSurveyEngine, csvConfigUrl = null) {

	let qualtricsResources = [
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate-new.js',
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-DJdpblcO.css'
	];

	// Fetch CSV configuration if URL is provided
	let feedbackConfig = {
		showFunctionValue: true,
		showAestheticValue: true,
		showComment: true
	};

	if (csvConfigUrl) {
		feedbackConfig = await fetchCsvConfig(csvConfigUrl);
	}

	let questionData = qualtricsSurveyEngine.getQuestionInfo()
	let questionContainer = qualtricsSurveyEngine.getQuestionContainer()
	console.log("[Qualtrics Loader] QuestionData:", questionData)
	console.log("[Qualtrics Loader] Feedback config:", feedbackConfig)

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

	try {
		// Set feedback configuration on global window object for React app to access
		window.cocreateFeedbackConfig = feedbackConfig;
		console.log("[Qualtrics Loader] Set global feedback config:", window.cocreateFeedbackConfig);

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
				questionImage.style.visibility = 'hidden';
				// questionImage.style.maxHeight = '85vh';
				console.log("[Qualtrics Loader] Updated question image")
			}

			// Hide question image - inside text editor
			const textEditorImage = questionContainer.querySelector('.question-display-wrapper img')
			if (textEditorImage) {
				textEditorImage.style.display = 'none';
				textEditorImage.style.visibility = 'hidden';
				console.log("[Qualtrics Loader] Updated image inside text editor")
			}

			// Hide additional question text images (for non-first questions)
			const questionTextImages = questionContainer.querySelectorAll('.QuestionText img')
			questionTextImages.forEach(img => {
				img.style.display = 'none';
				img.style.visibility = 'hidden';
				console.log("[Qualtrics Loader] Updated additional QuestionText image")
			});

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
	// Ensure per-survey isolation while still appending within a survey
	ensureSurveySession(qualtricsSurveyEngine);

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

	const buildResponseData = (overrides = {}) => {
		const selectionsData = overrides.selectionsData ?? safeParse(localStorage.getItem(CANVAS_SELECTIONS_KEY), {});
		const metadata = overrides.metadata ?? safeParse(localStorage.getItem(CANVAS_SIZE_KEY), {});
		const imageMapFromStorage = overrides.imageMap ?? safeParse(localStorage.getItem(IMAGE_MAP_KEY), {});
		const existingQuestionIds = safeParse(localStorage.getItem(QUESTION_IDS_KEY), []);
		const aggregatedQuestionIds = Array.from(new Set([
			...existingQuestionIds,
			...Object.keys(selectionsData),
			...Object.keys(metadata),
			questionId
		]));

		// Only add the question image if we actually found one, so we don't overwrite
		// a valid image entry with an undefined/empty value from another question.
		const imageMap = imageLink
			? { ...imageMapFromStorage, [questionId]: imageLink }
			: { ...imageMapFromStorage };

		localStorage.setItem(QUESTION_IDS_KEY, JSON.stringify(aggregatedQuestionIds));
		localStorage.setItem(IMAGE_MAP_KEY, JSON.stringify(imageMap));

		return {
			image: imageMap,
			questionIds: aggregatedQuestionIds,
			selectionsData,
			metadata
		};
	};

	let responseData = buildResponseData();

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

	// Keep Qualtrics Embedded Data in sync so multiple questions aggregate correctly
	function syncEmbeddedData(newData) {
		try {
			const stringifiedQuestionIds = JSON.stringify(newData?.questionIds ?? []);
			const stringifiedImageMap = JSON.stringify(newData?.image ?? {});
			const stringifiedSelections = JSON.stringify(newData?.selectionsData ?? {});
			const stringifiedMetadata = JSON.stringify(newData?.metadata ?? {});

			console.log(`[Qualtrics Loader][${questionId}] stringifiedQuestionIds: ${stringifiedQuestionIds}`)
			console.log(`[Qualtrics Loader][${questionId}] stringifiedImageMap: ${stringifiedImageMap}`)
			console.log(`[Qualtrics Loader][${questionId}] stringifiedSelections: ${stringifiedSelections}`)
			console.log(`[Qualtrics Loader][${questionId}] stringifiedMetadata: ${stringifiedMetadata}`)

			qualtricsSurveyEngine.setEmbeddedData('questionIds', stringifiedQuestionIds);
			qualtricsSurveyEngine.setEmbeddedData('image', stringifiedImageMap);
			qualtricsSurveyEngine.setEmbeddedData('selectionsData', stringifiedSelections);
			qualtricsSurveyEngine.setEmbeddedData('metadata', stringifiedMetadata);

			console.log(`[Qualtrics Loader][${questionId}] Synced embedded data`);
		} catch (error) {
			console.warn(`[Qualtrics Loader][${questionId}] Failed to sync embedded data`, error);
		}
	}

	// Add localStorage event listener to update responseData and questionTextArea
	window.addEventListener('storage', function(e) {
		if (e.key === CANVAS_SELECTIONS_KEY || e.key === CANVAS_SIZE_KEY || e.key === IMAGE_MAP_KEY || e.key === QUESTION_IDS_KEY) {
			console.log(`[Qualtrics Loader][${questionId}] localStorage changed:`, e.key);
			const overrides = {};

			if (e.key === CANVAS_SELECTIONS_KEY) {
				overrides.selectionsData = safeParse(e.newValue, {});
			} else if (e.key === CANVAS_SIZE_KEY) {
				overrides.metadata = safeParse(e.newValue, {});
			} else if (e.key === IMAGE_MAP_KEY) {
				overrides.imageMap = safeParse(e.newValue, {});
			}

			responseData = buildResponseData(overrides);
			updateTextArea(responseData);
			syncEmbeddedData(responseData);
		}
	});

	// Also listen for custom events that might be dispatched from the same window
	window.addEventListener('localStorageUpdated', function(e) {
		if (e.detail && (e.detail.key === CANVAS_SELECTIONS_KEY || e.detail.key === CANVAS_SIZE_KEY || e.detail.key === IMAGE_MAP_KEY || e.detail.key === QUESTION_IDS_KEY)) {
			console.log(`[Qualtrics Loader][${questionId}] Custom event detected:`, e.detail.key);

			const overrides = {};
			if (e.detail.key === CANVAS_SELECTIONS_KEY) {
				overrides.selectionsData = typeof e.detail.value === 'string'
					? safeParse(e.detail.value, {})
					: (e.detail.value || {});
			} else if (e.detail.key === CANVAS_SIZE_KEY) {
				overrides.metadata = typeof e.detail.value === 'string'
					? safeParse(e.detail.value, {})
					: (e.detail.value || {});
			} else if (e.detail.key === IMAGE_MAP_KEY) {
				overrides.imageMap = typeof e.detail.value === 'string'
					? safeParse(e.detail.value, {})
					: (e.detail.value || {});
			}

			responseData = buildResponseData(overrides);
			updateTextArea(responseData);
			syncEmbeddedData(responseData);
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
	syncEmbeddedData(responseData);
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