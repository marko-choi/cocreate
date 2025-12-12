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

// Use var to avoid duplicate-declaration errors if this loader is injected twice
var QUALTRICS_LEGACY_CANVAS_SELECTIONS_KEY = typeof QUALTRICS_LEGACY_CANVAS_SELECTIONS_KEY !== 'undefined' ? QUALTRICS_LEGACY_CANVAS_SELECTIONS_KEY : 'cocreate-canvasSelections';
var QUALTRICS_LEGACY_CANVAS_SIZE_KEY = typeof QUALTRICS_LEGACY_CANVAS_SIZE_KEY !== 'undefined' ? QUALTRICS_LEGACY_CANVAS_SIZE_KEY : 'cocreate-canvasSize';
var QUALTRICS_LEGACY_QUESTION_IDS_KEY = typeof QUALTRICS_LEGACY_QUESTION_IDS_KEY !== 'undefined' ? QUALTRICS_LEGACY_QUESTION_IDS_KEY : 'cocreate-questionIds';
var QUALTRICS_LEGACY_IMAGE_MAP_KEY = typeof QUALTRICS_LEGACY_IMAGE_MAP_KEY !== 'undefined' ? QUALTRICS_LEGACY_IMAGE_MAP_KEY : 'cocreate-imageMap';

// Also guard safeParse against redefinition
var safeParse = (typeof safeParse !== 'undefined' && safeParse) || ((value, fallback) => {
	try {
		if (!value) return fallback;
		return JSON.parse(value);
	} catch (error) {
		console.warn('[Qualtrics Legacy Loader] Failed to parse value, using fallback', error);
		return fallback;
	}
});

async function loadReactApp(qualtricsSurveyEngine, csvConfigUrl = null) {

	const qualtricsResources = [
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate-new.js',
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-D6HOnyYW.css'
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
	console.log("[Qualtrics Loader] QuestionContainer:", questionContainer)
	console.log("[Qualtrics Loader] Feedback config:", feedbackConfig)

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

	if (questionContainer) {
		// Hide question image - with comprehensive selectors and dual hiding method
		const questionImage = document.querySelector('.QuestionText img')
		if (questionImage) {
			questionImage.style.display = 'none';
			questionImage.style.visibility = 'hidden';
			questionImage.style.maxHeight = '85vh';
			console.log("[Qualtrics Loader] Updated question image")
		}

		// Hide all question content images
		const questionContentImages = document.querySelectorAll('.question-content img')
		questionContentImages.forEach(img => {
			img.style.display = 'none';
			img.style.visibility = 'hidden';
			console.log("[Qualtrics Loader] Updated question content image")
		});

		// Hide question image - inside text editor
		const textEditorImages = document.querySelectorAll('.question-display-wrapper img')
		textEditorImages.forEach(img => {
			img.style.display = 'none';
			img.style.visibility = 'hidden';
			console.log("[Qualtrics Loader] Updated image inside text editor")
		});

		// Hide additional question text images (for non-first questions)
		const questionTextImages = document.querySelectorAll('.QuestionText img')
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
		questionContainer.insertBefore(appContainer, questionContainer.firstChild);
		console.log("[Qualtrics Loader] Inserted app container")

		if (appContainer) {
			appContainer.style.display = 'flex';
			appContainer.style.alignItems = 'center';
			appContainer.style.justifyContent = 'center';
			appContainer.style.overflow = 'visible';
			appContainer.style.height = '65vh';
		}

		try {
			// Set feedback configuration on global window object for React app to access
			window.cocreateFeedbackConfig = feedbackConfig;
			console.log("[Qualtrics Loader] Set global feedback config:", window.cocreateFeedbackConfig);

			console.log("[Qualtrics Loader] loading script")
			await loadResource(qualtricsResources[0], 'script'); // Load React App
			console.log("[Qualtrics Loader] loading css")
			await loadResource(qualtricsResources[1], 'link');   // Load CSS
		} catch (error) {
			console.error("[Qualtrics Loader] Error loading resources:", error);
		}

		console.log('[Qualtrics Loader] React app loaded!');

		console.log('[Qualtrics Loader] React app loaded!');

// ============================================
// ADD EVENT LISTENERS FOR REAL-TIME DATA SYNC
// ============================================
function setupDataSync(qualtricsSurveyEngine) {
	const questionData = qualtricsSurveyEngine.getQuestionInfo();
	const questionContainer = qualtricsSurveyEngine.getQuestionContainer();
	const questionId = questionData.QuestionID;

	console.log(`[Qualtrics Loader][${questionId}] Setting up data sync`);

	// Get image URL
	let textEditorImageContainer = ".QuestionText img";
	let imageLink = "";
	let image = document.querySelector(textEditorImageContainer);
	if (image) {
		imageLink = image.src;
	}

	const buildResponseData = (overrides = {}) => {
		const selectionsData = overrides.selectionsData ?? safeParse(localStorage.getItem(QUALTRICS_LEGACY_CANVAS_SELECTIONS_KEY), {});
		const metadata = overrides.metadata ?? safeParse(localStorage.getItem(QUALTRICS_LEGACY_CANVAS_SIZE_KEY), {});
		const existingQuestionIds = overrides.questionIds ?? safeParse(localStorage.getItem(QUALTRICS_LEGACY_QUESTION_IDS_KEY), []);
		const aggregatedQuestionIds = Array.from(new Set([
			...existingQuestionIds,
			...Object.keys(selectionsData),
			...Object.keys(metadata),
			questionId
		].filter(Boolean)));
		const imageMapFromStorage = overrides.imageMap ?? safeParse(localStorage.getItem(QUALTRICS_LEGACY_IMAGE_MAP_KEY), {});
		const imageMap = imageLink
			? { ...imageMapFromStorage, [questionId]: imageLink }
			: { ...imageMapFromStorage };

		localStorage.setItem(QUALTRICS_LEGACY_QUESTION_IDS_KEY, JSON.stringify(aggregatedQuestionIds));
		localStorage.setItem(QUALTRICS_LEGACY_IMAGE_MAP_KEY, JSON.stringify(imageMap));

		return {
			image: imageMap,
			questionIds: aggregatedQuestionIds,
			selectionsData,
			metadata
		};
	};

	// Function to update the textarea with new data
	function updateTextArea(newData) {
		const questionTextAreas = questionContainer.querySelectorAll('.question-content textarea');
		if (questionTextAreas && questionTextAreas.length > 0) {
			let stringifiedData = JSON.stringify(newData);
			console.log(`[Qualtrics Loader][${questionId}] Updating textarea with data`);

			questionTextAreas.forEach(textarea => {
				textarea.value = stringifiedData;

				// Trigger events so Qualtrics recognizes the change
				const inputEvent = new Event('input', { bubbles: true });
				const changeEvent = new Event('change', { bubbles: true });
				textarea.dispatchEvent(inputEvent);
				textarea.dispatchEvent(changeEvent);
			});
		}
	}

	function syncEmbeddedData(newData) {
		try {
			const stringifiedQuestionIds = JSON.stringify(newData?.questionIds ?? []);
			const stringifiedImageMap = JSON.stringify(newData?.image ?? {});
			const stringifiedSelections = JSON.stringify(newData?.selectionsData ?? {});
			const stringifiedMetadata = JSON.stringify(newData?.metadata ?? {});

			qualtricsSurveyEngine.setEmbeddedData('questionIds', stringifiedQuestionIds);
			qualtricsSurveyEngine.setEmbeddedData('image', stringifiedImageMap);
			qualtricsSurveyEngine.setEmbeddedData('selectionsData', stringifiedSelections);
			qualtricsSurveyEngine.setEmbeddedData('metadata', stringifiedMetadata);

			console.log(`[Qualtrics Loader][${questionId}] Synced embedded data`);
		} catch (error) {
			console.warn(`[Qualtrics Loader][${questionId}] Failed to sync embedded data`, error);
		}
	}

	// Listen for localStorage updates from Canvas
	window.addEventListener('localStorageUpdated', function(e) {
		if (e.detail && (e.detail.key === QUALTRICS_LEGACY_CANVAS_SELECTIONS_KEY || e.detail.key === QUALTRICS_LEGACY_CANVAS_SIZE_KEY || e.detail.key === QUALTRICS_LEGACY_IMAGE_MAP_KEY || e.detail.key === QUALTRICS_LEGACY_QUESTION_IDS_KEY)) {
			console.log(`[Qualtrics Loader][${questionId}] Custom event detected:`, e.detail.key);

			const overrides = {};
			if (e.detail.key === QUALTRICS_LEGACY_CANVAS_SELECTIONS_KEY) {
				overrides.selectionsData = typeof e.detail.value === 'string'
					? safeParse(e.detail.value, {})
					: (e.detail.value || {});
			} else if (e.detail.key === QUALTRICS_LEGACY_CANVAS_SIZE_KEY) {
				overrides.metadata = typeof e.detail.value === 'string'
					? safeParse(e.detail.value, {})
					: (e.detail.value || {});
			} else if (e.detail.key === QUALTRICS_LEGACY_IMAGE_MAP_KEY) {
				overrides.imageMap = typeof e.detail.value === 'string'
					? safeParse(e.detail.value, {})
					: (e.detail.value || {});
			} else if (e.detail.key === QUALTRICS_LEGACY_QUESTION_IDS_KEY) {
				overrides.questionIds = typeof e.detail.value === 'string'
					? safeParse(e.detail.value, [])
					: (e.detail.value || []);
			}

			const responseData = buildResponseData(overrides);
			updateTextArea(responseData);
			syncEmbeddedData(responseData);
		}
	});

	// Also do initial update
	const responseData = buildResponseData();
	updateTextArea(responseData);
	syncEmbeddedData(responseData);
	console.log(`[Qualtrics Loader][${questionId}] Data sync setup complete`);
}

// Call the setup function
setupDataSync(qualtricsSurveyEngine);
// ============================================
// END EVENT LISTENERS
// ============================================

	} else {
		console.error("[Qualtrics Loader] Unable to find the QuestionBody container.")
	}
}

function handleDataSubmission(qualtricsSurveyEngine, pageInfo, type) {

	console.log('[Qualtrics Loader] Qualtrics Survey Engine:', qualtricsSurveyEngine)
	console.log('[Qualtrics Loader] Page Info:', pageInfo)
	console.log('[Qualtrics Loader] Type:', type)

	if (type == "next") {
		const selections = safeParse(localStorage.getItem(QUALTRICS_LEGACY_CANVAS_SELECTIONS_KEY), {});
		const metadata = safeParse(localStorage.getItem(QUALTRICS_LEGACY_CANVAS_SIZE_KEY), {});
		const storedQuestionIds = safeParse(localStorage.getItem(QUALTRICS_LEGACY_QUESTION_IDS_KEY), []);
		const storedImageMap = safeParse(localStorage.getItem(QUALTRICS_LEGACY_IMAGE_MAP_KEY), {});
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

		// Aggregate questionIds and image map before embedding
		const aggregatedQuestionIds = Array.from(new Set([
			...storedQuestionIds,
			...Object.keys(selections || {}),
			...Object.keys(metadata || {}),
			questionId
		].filter(Boolean)));

		const imageMap = imageLink
			? { ...storedImageMap, [questionId]: imageLink }
			: { ...storedImageMap };

		// Store question ID and selections
		qualtricsSurveyEngine.setEmbeddedData("image", JSON.stringify(imageMap))
		qualtricsSurveyEngine.setEmbeddedData("questionIds", JSON.stringify(aggregatedQuestionIds))
		qualtricsSurveyEngine.setEmbeddedData("selectionsData", JSON.stringify(selections))
		qualtricsSurveyEngine.setEmbeddedData("metadata", JSON.stringify(metadata))
	}
}

