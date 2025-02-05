
const resources = [
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/cocreate.js',
	'https://marko-choi.github.io/cocreate/cocreate-qualtrics/dist/static/index-BDiMeRyN.css'
];

Qualtrics.SurveyEngine.addOnload(function() {

	let questionId = this.getQuestionInfo()
	console.log(questionId)

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

	async function loadReactApp() {
		try {
			
			await loadResource(resources[0], 'script'); // Load React App
			await loadResource(resources[1], 'link');   // Load CSS
			
			const questionImage = document.querySelector('.QuestionText img')
			if (questionImage) {
				questionImage.style.display = 'none';
			}

			const questionBody = document.querySelector('.QuestionBody');
			if (questionBody) {
				
				let appContainer = document.createElement('div');
				appContainer.id = 'root';
				questionBody.appendChild(appContainer);
				
				console.log('React app loaded!');
			} else {
				console.error("Unable to find the QuestionBody container.")
			}
			
		} catch (error) {
			console.error('Error loading resources:', error);
		}
	}

	loadReactApp();
});


Qualtrics.SurveyEngine.addOnReady(function() {
	/* JavaScript to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(function() {
	/* JavaScript to run when the page is unloaded */

const selections = JSON.parse(localStorage.getItem('cocreate-canvasSelections'));
if (selections) {
	console.log('Selections data:', selections);
} else {
	console.error('No selections data found in localStorage.');
}
});