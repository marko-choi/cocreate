# CoCreate Qualtrics Module

This module contains the Qualtrics scripts and styles to embed CoCreate components in Qualtrics.

- `qualtrics.js` - script to embed CoCreate components in Qualtrics. It utilizes the `addOnload` and `addOnPageSubmit` functions to load the CoCreate React application and handle data submission.

```javascript
Qualtrics.SurveyEngine.addOnload(function() {
	loadReactApp(this);
});


Qualtrics.SurveyEngine.addOnPageSubmit(function(type) {
	handleDataSubmission(this, type)
});
```

- `qualtrics-loader.js` - script to embed on the header for loading CoCreate components in Qualtrics.

## Cocreate components:

These are located within the `dist/static` folder.
- `cocreate.js` - script containing the CoCreate React application
- `index-CEcsbSgp.css` - styles for the CoCreate React application
