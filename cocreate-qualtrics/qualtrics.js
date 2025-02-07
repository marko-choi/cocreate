Qualtrics.SurveyEngine.addOnload(function() {
	loadReactApp(this);
});


Qualtrics.SurveyEngine.addOnPageSubmit(function(type) {
	handleDataSubmission(this, type)
});