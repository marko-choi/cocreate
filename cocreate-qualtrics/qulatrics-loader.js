const resources = [
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate-new.js',
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-CEcsbSgp.css'
];


export function loadResource(url, type) {
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

export async function loadReactApp(qualtricsSurveyEngine) {

	let questionData = qualtricsSurveyEngine.getQuestionInfo()
	let questionBody = qualtricsSurveyEngine.getQuestionContainer()
	console.log("QuestionBody:", questionData)
	questionBody.style.overflow = 'visible';
	questionBody.style.padding = '0px';
	
	let questionContainerInner = document.querySelector(".SkinInner")
	questionContainerInner.style.width = '100%'
	questionContainerInner.style.paddingTop = '0px'
	
	
	let questionSkinContainer = document.querySelector(".Skin #Questions")
	questionSkinContainer.style.overflow = 'visible';
	
	try {

		console.log("loading script")
		await loadResource(resources[0], 'script'); // Load React App
		console.log("loading css")
		await loadResource(resources[1], 'link');   // Load CSS

		const questionImage = document.querySelector('.QuestionText img')
		if (questionImage) {
			questionImage.style.display = 'none';
		}

		if (questionBody) {

			let appContainer = document.createElement('div');
			appContainer.id = 'root';
			questionBody.appendChild(appContainer);

			const rootDiv = document.querySelector('#root');
			console.log(rootDiv)
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

export function handleDataSubmission(qualtricsSurveyEngine, type) {
	if (type == "next") {
		const selections = JSON.parse(localStorage.getItem('cocreate-canvasSelections'));
		const questionInfo = qualtricsSurveyEngine.getQuestionInfo()
		const questionBody = qualtricsSurveyEngine.getQuestionContainer()
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
			Qualtrics.qualtricsSurveyEngine.setEmbeddedData("image", "imageData");
		} else {
			Qualtrics.qualtricsSurveyEngine.setEmbeddedData("image", null);
		}

		// Store question ID and selections
		qualtricsSurveyEngine.setEmbeddedData("questionId", questionId)
		qualtricsSurveyEngine.setEmbeddedData("selectionsData", JSON.stringify(selections))
	}
}
