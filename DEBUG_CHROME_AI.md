# Debug Guide: Chrome AI Summarizer Issues

## Your Situation
- ✅ Chrome Version: 146 (AI should be available!)
- ❌ Getting "not available" message
- ❌ Seeing language warning

## Fixes Applied

### 1. Fixed Language Specification Error
**Before:** Used deprecated `expectedInputLanguages` and `outputLanguage` properties
**After:** Removed these properties (not needed in latest API)

### 2. Updated Availability Check
**Before:** Checked for `'unavailable'` and `'downloadable'`
**After:** Checks for `'no'` and `'after-download'` (correct API values)

### 3. Enhanced Error Logging
Added detailed console logging to help debug issues.

## How to Debug

### Step 1: Check if API Exists
Open DevTools Console (F12) and run:
```javascript
'Summarizer' in self
```
**Expected:** `true`

### Step 2: Check Availability
```javascript
await Summarizer.availability()
```
**Expected:** `"readily"` or `"after-download"`  
**Not:** `"no"`

### Step 3: Check Gemini Nano Status
1. Go to: `chrome://on-device-internals`
2. Look for **"Summarizer API"** section
3. Check status - should show "Ready" or "Available"

### Step 4: Enable Optimization Guide (if needed)
1. Go to: `chrome://flags`
2. Search for: **"Optimization Guide On Device Model"**
3. Set to: **"Enabled BypassPerfRequirement"**
4. Restart Chrome

### Step 5: Enable Summarizer API (if needed)
1. Go to: `chrome://flags`
2. Search for: **"Summarization API for Gemini Nano"**
3. Set to: **"Enabled"**
4. Restart Chrome

### Step 6: Force Model Download
If status shows "after-download", you can trigger download:
```javascript
const summarizer = await Summarizer.create();
// Model will download automatically
```

## Common Issues & Fixes

### Issue 1: "No output language specified"
**Cause:** Older API syntax used  
**Fix:** ✅ Already fixed! Removed language properties from create() options

### Issue 2: "Summarizer not available"
**Possible Causes:**
1. Flags not enabled
2. Model not downloaded
3. Insufficient storage
4. Chrome profile issue

**Solutions:**
```bash
# Check storage space
chrome://settings/storage

# Should have 22+ GB free
```

### Issue 3: API Returns "no"
**Possible Causes:**
1. Hardware requirements not met
2. Operating system not supported
3. Chrome version issue

**Check Hardware:**
```javascript
// In console, check what's blocking
console.log(await Summarizer.availability())
```

## Testing After Fix

### Test 1: Quick Availability Check
1. Reload the extension
2. Open analysis page
3. Open Console (F12)
4. Look for: `"✅ Summarizer initialized successfully!"`

### Test 2: Analyze Sample Text
Paste this in the textarea:
```
We collect your personal information including name, email, and location. 
This data is shared with third-party advertisers for marketing purposes. 
We use cookies to track your browsing activity across websites. You can 
request deletion of your data at any time.
```

Click "Analyze Policy" and check:
- ✅ Green badge: "✓ AI-Powered Analysis"
- ✅ Bullet points appear
- ✅ No errors in console

### Test 3: Check Console Logs
You should see:
```
PolicyPeek analysis page loaded
Initializing analysis page...
Summarizer API detected, checking availability...
Summarizer availability: readily
Creating Summarizer instance with options: {...}
✅ Summarizer initialized successfully!
Starting analysis...
Analyzing policy text: 234 characters
Using Chrome AI Summarizer...
Summarizer instance: Summarizer {...}
Calling summarize() with options: {...}
✅ AI Summary generated successfully
Summary preview: • Collects personal information...
```

## What Changed in Code

### Before (Had Errors):
```javascript
summarizerInstance = await self.Summarizer.create({
  expectedInputLanguages: ['en'],  // ❌ Causes warning
  outputLanguage: 'en',             // ❌ Causes warning
  expectedContextLanguages: ['en'], // ❌ Not needed
  // ... other options
});
```

### After (Fixed):
```javascript
const options = {
  sharedContext: 'This is a privacy policy or terms of service document',
  type: 'key-points',
  format: 'markdown',
  length: 'medium',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      const progress = Math.round(e.loaded * 100);
      console.log(`Summarizer model download progress: ${progress}%`);
      updateDownloadProgress(progress);
    });
  }
};

summarizerInstance = await self.Summarizer.create(options);
```

## Chrome Flags Reference

### Essential Flags for Chrome 146:

1. **Optimization Guide On Device Model**
   - URL: `chrome://flags/#optimization-guide-on-device-model`
   - Set to: `Enabled BypassPerfRequirement`
   - Why: Allows model to run even if hardware check fails

2. **Summarization API**
   - URL: `chrome://flags/#summarization-api-for-gemini-nano`
   - Set to: `Enabled`
   - Why: Enables the Summarizer API

3. **Prompt API for Gemini Nano** (optional, for future)
   - URL: `chrome://flags/#prompt-api-for-gemini-nano`
   - Set to: `Enabled`
   - Why: Enables Prompt API features

## Expected Console Output (Success)

```
PolicyPeek analysis page loaded
Initializing analysis page...
Summarizer API detected, checking availability...
Summarizer availability: readily
Creating Summarizer instance with options: {
  sharedContext: "This is a privacy policy...",
  type: "key-points",
  format: "markdown",
  length: "medium"
}
✅ Summarizer initialized successfully!

[User clicks Analyze]

Starting analysis...
Analyzing policy text: 234 characters
Using Chrome AI Summarizer...
Summarizer instance: Summarizer {/* ... */}
Calling summarize() with options: {
  context: "This document is a privacy policy..."
}
✅ AI Summary generated successfully
Summary preview: • Collects personal information including name, email, and location
```

## Expected Console Output (Fallback)

```
PolicyPeek analysis page loaded
Initializing analysis page...
Summarizer API detected, checking availability...
Summarizer availability: no
Chrome AI Summarizer not available
summarizerAvailable: false
summarizerInstance: null

[User clicks Analyze]

Starting analysis...
Analyzing policy text: 234 characters
Chrome AI Summarizer not available
Creating basic summary...
```

## Troubleshooting Checklist

- [ ] Chrome version is 146 ✅
- [ ] `chrome://flags` settings enabled
- [ ] Chrome restarted after flag changes
- [ ] At least 22 GB storage free
- [ ] `chrome://on-device-internals` shows Summarizer as "Ready"
- [ ] Console shows "✅ Summarizer initialized successfully!"
- [ ] No errors in console
- [ ] Extension reloaded after code changes

## Still Not Working?

### Nuclear Option: Reset Everything

1. **Clear Chrome Component:**
   ```
   chrome://components
   ```
   Find "Optimization Guide On Device Model"
   Click "Check for update"

2. **Reset Flags:**
   ```
   chrome://flags/#reset-all
   ```
   Then re-enable the needed flags

3. **Clear Extension Storage:**
   ```javascript
   chrome.storage.local.clear()
   ```

4. **Reload Extension:**
   - Go to `chrome://extensions`
   - Toggle off/on
   - Or click "Reload"

5. **Restart Chrome Completely:**
   - Close ALL Chrome windows
   - Reopen Chrome
   - Test again

## Get More Info

### Check Model Status:
```javascript
// In console
const capabilities = await ai.summarizer.capabilities();
console.log(capabilities);
```

### Check Model Version:
Go to `chrome://on-device-internals` and look for:
- Model version
- Download status
- File size
- Last update date

## Success Indicators

You'll know it's working when:
1. ✅ Console shows "Summarizer initialized successfully"
2. ✅ Green badge appears: "✓ AI-Powered Analysis"
3. ✅ Summary has bullet points
4. ✅ No "Install Chrome 138+" message
5. ✅ No language warnings in console

## Contact for Help

If still having issues, provide:
1. Console output (copy all logs)
2. `chrome://version` info
3. `chrome://on-device-internals` screenshot
4. Flags that are enabled
5. Storage space available

---

**Last Updated:** October 20, 2025  
**Chrome Version:** 146  
**API Version:** Latest (as of Oct 2025)
