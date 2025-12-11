# 🚨 CRITICAL FIX: Qualtrics Data Not Being Saved

## Problem Identified

You're absolutely right! The feedback data is **NOT being saved to Qualtrics**. Here's why:

### How It's SUPPOSED to Work:

1. User provides feedback → Canvas component saves to `localStorage`
2. Canvas dispatches a custom event `localStorageUpdated`
3. Qualtrics loader listens for this event
4. Loader updates a hidden textarea with the data
5. Qualtrics saves the textarea value when user clicks "Next"

### What's ACTUALLY Happening:

1. User provides feedback → Canvas component saves to `localStorage` ✅
2. **Canvas DOES NOT dispatch the custom event** ❌
3. Loader never knows data changed ❌
4. Textarea never gets updated ❌
5. Qualtrics saves EMPTY data ❌

---

## The Fix

You need to add code to **dispatch a custom event** every time localStorage is updated.

### Location: Canvas.tsx, line ~238 (in the useEffect that saves selections)

**REPLACE THIS ENTIRE useEffect:**

```typescript
// Save selections to localStorage whenever they change
useEffect(() => {

  // Save canvas size to localStorage
  const currentCocreateCanvasSize = localStorage.getItem(CANVAS_SIZE_KEY);
  const newCocreateCanvasSize = {
    [instanceId]: {
      width: canvasWidth,
      height: canvasHeight,
      imageScaleFactor: imageScaleFactor
    }
  }

  if (currentCocreateCanvasSize) {
    localStorage.setItem(CANVAS_SIZE_KEY, JSON.stringify({
      ...JSON.parse(currentCocreateCanvasSize),
      ...newCocreateCanvasSize
    }));
  } else {
    localStorage.setItem(CANVAS_SIZE_KEY, JSON.stringify(newCocreateCanvasSize));
  }

  // Save selections to localStorage
  const currentCocreateCanvasSelections = localStorage.getItem(CANVAS_SELECTIONS_KEY);
  const newCocreateCanvasSelections = {
    [instanceId]: selections
  }

  if (currentCocreateCanvasSelections) {
    localStorage.setItem(CANVAS_SELECTIONS_KEY, JSON.stringify({
      ...JSON.parse(currentCocreateCanvasSelections),
      ...newCocreateCanvasSelections
    }));
  } else {
    localStorage.setItem(CANVAS_SELECTIONS_KEY, JSON.stringify(newCocreateCanvasSelections));
  }

}, [selections]);
```

**WITH THIS (includes event dispatching):**

```typescript
// Save selections to localStorage whenever they change
useEffect(() => {

  // Save canvas size to localStorage
  const currentCocreateCanvasSize = localStorage.getItem(CANVAS_SIZE_KEY);
  const newCocreateCanvasSize = {
    [instanceId]: {
      width: canvasWidth,
      height: canvasHeight,
      imageScaleFactor: imageScaleFactor
    }
  }

  const newCocreateCanvasSizeString = currentCocreateCanvasSize
    ? JSON.stringify({
        ...JSON.parse(currentCocreateCanvasSize),
        ...newCocreateCanvasSize
      })
    : JSON.stringify(newCocreateCanvasSize);

  localStorage.setItem(CANVAS_SIZE_KEY, newCocreateCanvasSizeString);

  // CRITICAL: Dispatch custom event to notify Qualtrics loader
  window.dispatchEvent(new CustomEvent('localStorageUpdated', {
    detail: {
      key: CANVAS_SIZE_KEY,
      value: JSON.parse(newCocreateCanvasSizeString)
    }
  }));
  console.log('[CoCreate] Dispatched localStorageUpdated event for canvas size');

  // Save selections to localStorage
  const currentCocreateCanvasSelections = localStorage.getItem(CANVAS_SELECTIONS_KEY);
  const newCocreateCanvasSelections = {
    [instanceId]: selections
  }

  const newCocreateCanvasSelectionsString = currentCocreateCanvasSelections
    ? JSON.stringify({
        ...JSON.parse(currentCocreateCanvasSelections),
        ...newCocreateCanvasSelections
      })
    : JSON.stringify(newCocreateCanvasSelections);

  localStorage.setItem(CANVAS_SELECTIONS_KEY, newCocreateCanvasSelectionsString);

  // CRITICAL: Dispatch custom event to notify Qualtrics loader
  window.dispatchEvent(new CustomEvent('localStorageUpdated', {
    detail: {
      key: CANVAS_SELECTIONS_KEY,
      value: JSON.parse(newCocreateCanvasSelectionsString)
    }
  }));
  console.log('[CoCreate] Dispatched localStorageUpdated event for selections');

}, [selections, instanceId, canvasWidth, canvasHeight, imageScaleFactor]);
```

---

## Key Changes:

1. **Store the stringified data in variables** before setting in localStorage
2. **Dispatch CustomEvent** after each `localStorage.setItem()`
3. **Add console.log** to verify events are being dispatched
4. **Added missing dependencies** to useEffect: `instanceId`, `canvasWidth`, `canvasHeight`, `imageScaleFactor`

---

## How to Verify It's Working

### Test 1: Check Console Logs

After making feedback selections, you should see in console:
```
[CoCreate] Dispatched localStorageUpdated event for canvas size
[CoCreate] Dispatched localStorageUpdated event for selections
[Qualtrics Loader][Q123] Custom event detected: cocreate-canvasSelections
[Qualtrics Loader][Q123] Updating questionTextArea with new data: {...}
```

### Test 2: Check Hidden Textarea

In browser console, run:
```javascript
// Find the hidden textarea
var textarea = document.querySelector('.question-content textarea');
console.log('Textarea value:', textarea.value);
```

Should show JSON data with your selections.

### Test 3: Check Qualtrics Data

1. Make some annotations
2. Click "Next" in survey
3. Go to Qualtrics Data & Analysis
4. Check the response data for that question
5. Should see JSON with selections

---

## Why This Was Broken

The `storage` event in browsers **only fires for changes in OTHER tabs/windows**. It doesn't fire when localStorage changes in the SAME window. This is a browser security/design feature.

The Qualtrics loader tried to work around this by listening for a custom `localStorageUpdated` event, but the Canvas component was never dispatching it!

---

## Additional Verification Code

Add this temporary code to Canvas.tsx to verify events are firing:

```typescript
// TEMPORARY: Add after the useEffect
useEffect(() => {
  const handler = (e: CustomEvent) => {
    console.log('🔔 localStorageUpdated event received in Canvas:', e.detail);
  };
  
  window.addEventListener('localStorageUpdated', handler as any);
  
  return () => {
    window.removeEventListener('localStorageUpdated', handler as any);
  };
}, []);
```

This will log EVERY time the event is dispatched, confirming it's working.

---

## Complete Fixed useEffect

Here's the complete, copy-paste ready version:

```typescript
// Save selections to localStorage whenever they change
useEffect(() => {
  console.log('[CoCreate] Saving to localStorage - selections count:', selections.length);

  // Save canvas size to localStorage
  const currentCocreateCanvasSize = localStorage.getItem(CANVAS_SIZE_KEY);
  const newCocreateCanvasSize = {
    [instanceId]: {
      width: canvasWidth,
      height: canvasHeight,
      imageScaleFactor: imageScaleFactor
    }
  }

  const newCocreateCanvasSizeString = currentCocreateCanvasSize
    ? JSON.stringify({
        ...JSON.parse(currentCocreateCanvasSize),
        ...newCocreateCanvasSize
      })
    : JSON.stringify(newCocreateCanvasSize);

  localStorage.setItem(CANVAS_SIZE_KEY, newCocreateCanvasSizeString);

  // CRITICAL: Dispatch custom event to notify Qualtrics loader
  const sizeEvent = new CustomEvent('localStorageUpdated', {
    detail: {
      key: CANVAS_SIZE_KEY,
      value: JSON.parse(newCocreateCanvasSizeString)
    }
  });
  window.dispatchEvent(sizeEvent);
  console.log('[CoCreate] ✅ Dispatched localStorageUpdated event for canvas size');

  // Save selections to localStorage
  const currentCocreateCanvasSelections = localStorage.getItem(CANVAS_SELECTIONS_KEY);
  const newCocreateCanvasSelections = {
    [instanceId]: selections
  }

  const newCocreateCanvasSelectionsString = currentCocreateCanvasSelections
    ? JSON.stringify({
        ...JSON.parse(currentCocreateCanvasSelections),
        ...newCocreateCanvasSelections
      })
    : JSON.stringify(newCocreateCanvasSelections);

  localStorage.setItem(CANVAS_SELECTIONS_KEY, newCocreateCanvasSelectionsString);

  // CRITICAL: Dispatch custom event to notify Qualtrics loader
  const selectionsEvent = new CustomEvent('localStorageUpdated', {
    detail: {
      key: CANVAS_SELECTIONS_KEY,
      value: JSON.parse(newCocreateCanvasSelectionsString)
    }
  });
  window.dispatchEvent(selectionsEvent);
  console.log('[CoCreate] ✅ Dispatched localStorageUpdated event for selections');
  console.log('[CoCreate] Selection data:', JSON.parse(newCocreateCanvasSelectionsString));

}, [selections, instanceId, canvasWidth, canvasHeight, imageScaleFactor]);
```

---

## After Applying This Fix

1. **Rebuild** the project
2. **Deploy** to Qualtrics
3. **Test** by making annotations and clicking Next
4. **Check console** for the dispatch logs
5. **Check Qualtrics data** to verify it's saved

The data should now be properly saved to Qualtrics! 🎉
