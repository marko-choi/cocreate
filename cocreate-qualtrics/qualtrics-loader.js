const qualtricsResources = [
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate-new.js',
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-BjgQIF21.css'
];


function loadResource(url, type) {
	return new Promise((resolve, reject) => {
		let element;
		if (type === 'script') {
			element = document.createElement('script');
			element.src = url;
			element.async = true;
			element.onload = resolve;
			element.onerror = reject;
		} else if (type === 'link') {
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
	console.log("QuestionData:", questionData)

	if (questionContainer) { 
		questionContainer.style.overflow = 'visible';
		questionContainer.style.padding = '0px';
		questionContainer.style.paddingBottom = '0px !important';
	}

	let questionText = document.querySelector('.QuestionText')
	if (questionText) {
		questionText.style.padding = '0px';
	}
	
	let questionContainerInner = document.querySelector(".SkinInner")
	if (questionContainerInner) {
		questionContainerInner.style.width = '100%'
		questionContainerInner.style.paddingTop = '0px'
	}
	
	let questionSkinContainer = document.querySelector(".Skin #Questions")
	if (questionSkinContainer) {
		questionSkinContainer.style.overflow = 'visible';
	}

	let questionBody = document.querySelector('.QuestionBody')
	if (questionBody) {
		questionBody.style.padding = '0px';
	}

	let questionButton = document.querySelector('#Buttons')
	if (questionButton) {
		questionButton.style.paddingTop = '0px';
		questionButton.style.paddingBottom = '0px';
	}
	
	try {

		console.log("loading script")
		await loadResource(qualtricsResources[0], 'script'); // Load React App
		console.log("loading css")
		await loadResource(qualtricsResources[1], 'link');   // Load CSS

		const questionImage = document.querySelector('.QuestionText img')
		if (questionImage) {
			questionImage.style.display = 'none';
			questionImage.style.maxHeight = '85vh';
		}

		if (questionContainer) {

			let appContainer = document.createElement('div');
			appContainer.id = 'root';

			// if (questionButton) {
			// 	questionContainer.insertBefore(appContainer, questionButton);
			// } else {
			questionContainer.appendChild(appContainer);
			// }

			const rootDiv = document.querySelector('#root');
			if (rootDiv) {
				rootDiv.style.display = 'flex';
				rootDiv.style.alignItems = 'center';
				rootDiv.style.justifyContent = 'center';
				rootDiv.style.overflow = 'visible';
				rootDiv.style.height = '75vh';
			}	

			console.log('React app loaded!');
		} else {
			console.error("Unable to find the QuestionBody container.")
		}

	} catch (error) {
		console.error('Error loading resources:', error);
	}
}

function handleDataSubmission(qualtricsSurveyEngine, pageInfo, type) {
	console.log(qualtricsSurveyEngine)
	console.log(type)
	if (type == "next") {
		const selections = JSON.parse(localStorage.getItem('cocreate-canvasSelections'));
		const metadata = JSON.parse(localStorage.getItem('cocreate-canvasSize'));
		const questionInfo = pageInfo.getQuestionInfo()
		const questionId = questionInfo.QuestionID

		if (selections) {
			console.log('Selections data:', selections);
		} else {
			console.error('No selections data found in localStorage.');
		}

		// Extract image as a png image
		const canvas = document.querySelector('canvas')
		if (canvas) {
			const imageData = canvas.toDataURL("image/png")
			qualtricsSurveyEngine.setEmbeddedData("image", imageData);
		} else {
			qualtricsSurveyEngine.setEmbeddedData("image", null);
		}

		// Store question ID and selections
		qualtricsSurveyEngine.setEmbeddedData("questionId", questionId)
		qualtricsSurveyEngine.setEmbeddedData("selectionsData", JSON.stringify(selections))
		qualtricsSurveyEngine.setEmbeddedData("metadata", JSON.stringify(metadata))
	}
}