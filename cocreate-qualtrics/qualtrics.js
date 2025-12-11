Qualtrics.SurveyEngine.addOnload(function() {
	//loadReactApp(this);
	loadReactApp(this, 'https://marko-choi.github.io/cocreate/config/feedback-config.csv');
});
	
Qualtrics.SurveyEngine.addOnPageSubmit(function(type) {
	handleDataSubmission(Qualtrics.SurveyEngine, this, type)
});