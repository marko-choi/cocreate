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
	} else {
		console.error("[Qualtrics Loader] Unable to find the QuestionBody container.")
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

