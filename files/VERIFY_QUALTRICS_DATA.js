# Qualtrics Data Verification Script

## Quick Test: Is Data Being Saved?

Run this in your browser console after making annotations:

```javascript
// ============================================
// QUALTRICS DATA VERIFICATION SCRIPT
// ============================================

console.log('=== CoCreate Qualtrics Data Check ===');
console.log('');

// Check 1: localStorage
console.log('1️⃣ Checking localStorage...');
const selections = localStorage.getItem('cocreate-canvasSelections');
const canvasSize = localStorage.getItem('cocreate-canvasSize');

if (selections) {
  console.log('✅ Selections found in localStorage');
  console.log('   Data:', JSON.parse(selections));
} else {
  console.log('❌ No selections in localStorage');
}

if (canvasSize) {
  console.log('✅ Canvas size found in localStorage');
  console.log('   Data:', JSON.parse(canvasSize));
} else {
  console.log('❌ No canvas size in localStorage');
}

console.log('');

// Check 2: Hidden Textarea (where Qualtrics saves from)
console.log('2️⃣ Checking hidden textarea...');
const textarea = document.querySelector('.question-content textarea');

if (textarea) {
  console.log('✅ Textarea found');
  if (textarea.value) {
    console.log('✅ Textarea has data');
    try {
      const data = JSON.parse(textarea.value);
      console.log('   Data:', data);
      
      if (data.selectionsData) {
        console.log('✅ Selections data present');
        const selectionKeys = Object.keys(data.selectionsData);
        console.log('   Questions:', selectionKeys);
        selectionKeys.forEach(key => {
          const questionSelections = data.selectionsData[key];
          console.log(`   Question ${key}: ${questionSelections.length} annotations`);
        });
      } else {
        console.log('❌ No selections data in textarea');
      }
    } catch (e) {
      console.log('❌ Textarea data is not valid JSON');
      console.log('   Value:', textarea.value);
    }
  } else {
    console.log('❌ Textarea is empty');
  }
} else {
  console.log('❌ Textarea not found - this is a problem!');
}

console.log('');

// Check 3: Event Listeners
console.log('3️⃣ Testing event dispatch...');
let eventReceived = false;

const testListener = (e) => {
  eventReceived = true;
  console.log('✅ localStorageUpdated event working');
  console.log('   Event detail:', e.detail);
};

window.addEventListener('localStorageUpdated', testListener);

// Dispatch test event
window.dispatchEvent(new CustomEvent('localStorageUpdated', {
  detail: { key: 'test', value: 'test' }
}));

setTimeout(() => {
  if (eventReceived) {
    console.log('✅ Event system is working');
  } else {
    console.log('❌ Event system not working - events not being received');
  }
  window.removeEventListener('localStorageUpdated', testListener);
  
  console.log('');
  console.log('=== Summary ===');
  
  const hasLocalStorage = !!selections;
  const hasTextareaData = textarea && !!textarea.value;
  
  if (hasLocalStorage && hasTextareaData) {
    console.log('✅ DATA IS BEING SAVED - Everything looks good!');
    console.log('   When you click "Next", this data will be saved to Qualtrics.');
  } else if (hasLocalStorage && !hasTextareaData) {
    console.log('⚠️ DATA IN LOCALSTORAGE BUT NOT IN TEXTAREA');
    console.log('   Problem: Events not being dispatched');
    console.log('   Solution: Apply the Qualtrics data fix');
  } else if (!hasLocalStorage) {
    console.log('❌ NO DATA FOUND');
    console.log('   Problem: Annotations not being saved at all');
    console.log('   Solution: Check Canvas component is working');
  }
  
  console.log('');
  console.log('=================================');
}, 100);
```

---

## What Each Check Does

### Check 1: localStorage
Verifies that Canvas is saving data locally. This should ALWAYS have data after making annotations.

**If FAILS:**
- Canvas component isn't saving properly
- Check if annotations are actually being created

---

### Check 2: Hidden Textarea  
Verifies that Qualtrics loader is transferring data from localStorage to the textarea.

**If FAILS but Check 1 PASSES:**
- The `localStorageUpdated` events aren't being dispatched
- Apply the Qualtrics Data Fix

---

### Check 3: Event System
Tests if the custom event system is working at all.

**If FAILS:**
- Browser doesn't support CustomEvent (very unlikely)
- Something is blocking events

---

## Expected Output (Working Correctly)

```
=== CoCreate Qualtrics Data Check ===

1️⃣ Checking localStorage...
✅ Selections found in localStorage
   Data: {QID123: [{center: {x: 100, y: 200}, radius: 30, ...}]}
✅ Canvas size found in localStorage
   Data: {QID123: {width: 800, height: 534, ...}}

2️⃣ Checking hidden textarea...
✅ Textarea found
✅ Textarea has data
   Data: {image: "...", selectionsData: {...}, metadata: {...}}
✅ Selections data present
   Questions: ['QID123']
   Question QID123: 3 annotations

3️⃣ Testing event dispatch...
✅ localStorageUpdated event working
   Event detail: {key: 'test', value: 'test'}
✅ Event system is working

=== Summary ===
✅ DATA IS BEING SAVED - Everything looks good!
   When you click "Next", this data will be saved to Qualtrics.

=================================
```

---

## Quick Visual Check

You can also manually inspect the textarea:

```javascript
// Show textarea content in readable format
var textarea = document.querySelector('.question-content textarea');
console.log(JSON.stringify(JSON.parse(textarea.value), null, 2));
```

Should show something like:
```json
{
  "image": "https://..../image.jpg",
  "selectionsData": {
    "QID123": [
      {
        "start": {"x": 100, "y": 100},
        "end": {"x": 200, "y": 200},
        "functionValue": "good",
        "comment": "This looks great"
      }
    ]
  },
  "metadata": {
    "QID123": {
      "width": 800,
      "height": 534,
      "imageScaleFactor": 1
    }
  }
}
```

---

## After Applying the Fix

Run this script again to verify:
1. localStorage should have data ✅
2. Textarea should have data ✅
3. Events should be working ✅
4. Summary should say "DATA IS BEING SAVED" ✅

---

## Bonus: Monitor Events in Real-Time

Add this to watch events as they happen:

```javascript
// Monitor all localStorageUpdated events
window.addEventListener('localStorageUpdated', (e) => {
  console.log('🔔 Event:', e.detail.key);
  console.log('   Value:', e.detail.value);
});

// Now make some annotations and watch the console!
```

You should see events fire every time you add/edit/delete an annotation.
