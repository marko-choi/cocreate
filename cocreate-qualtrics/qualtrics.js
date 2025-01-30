
Qualtrics.SurveyEngine.addOnload(function()
{
	const resources = [
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/static/index-lTgNI1c8.js.js',
		'https://marko-choi.github.io/cocreate/cocreate-qualtrics/static/index-CgtUkX9o.css'
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

	async function loadReactApp() {
		try {
			await loadResource(resources[0], 'script'); // Load your React App
			await loadResource(resources[1], 'link');   // Load CSS

			// Create a div to mount the React app
			let appContainer = document.createElement('div');
			appContainer.id = 'root';
			document.body.appendChild(appContainer);

			console.log('React app loaded!');
		} catch (error) {
			console.error('Error loading resources:', error);
		}
	}

	loadReactApp();

});

Qualtrics.SurveyEngine.addOnReady(function()
{
	/*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});