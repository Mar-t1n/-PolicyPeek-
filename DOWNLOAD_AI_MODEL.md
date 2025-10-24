# How to Download the Gemini Nano AI Model

If you're seeing "AI not available" or basic analysis instead of AI-powered analysis, you need to download the Gemini Nano model first.

## Quick Fix

### Method 1: Use Manual Analysis Page (Recommended)
1. Click on the PolicyPeek extension icon
2. Click "Manual Analysis" in the popup
3. Paste any text (even just "test")
4. Click the **"Analyze Policy"** button
5. This button click provides the required "user gesture" to trigger the download
6. Wait for the download to complete (~1.7 GB, one-time download)
7. Once downloaded, all AI features will work automatically

### Method 2: Use Chrome's Built-in Prompt API Test
1. Open Chrome DevTools (F12) on any page
2. Paste this code in the Console:
   ```javascript
   const session = await ai.languageModel.create();
   ```
3. This will trigger the download
4. Wait for completion

## Why Does This Happen?

Chrome's Prompt API requires a **user gesture** (like a button click) to trigger the first-time download of the AI model. This is a security feature to prevent automatic downloads without user consent.

### Scenarios:

**❌ Won't Work:**
- Automatic page load (like analyzing from popup → auto-opening analysis page)
- Background initialization without user interaction
- Scripts running automatically

**✅ Will Work:**
- Clicking a button on a page
- Any direct user interaction that triggers the API
- Manual analysis page "Analyze" button

## After First Download

Once the model is downloaded, it stays on your device and will work automatically:
- ✅ Auto-analysis from popup will work
- ✅ Manual analysis will work
- ✅ All AI features will be instant (no download needed)

## Checking Model Status

Open DevTools Console and run:
```javascript
await ai.languageModel.availability()
```

**Possible results:**
- `"readily"` - Model is downloaded and ready ✅
- `"downloadable"` - Model needs to be downloaded 📥
- `"after-download"` - Model was partially downloaded, needs completion 📥
- `"downloading"` - Currently downloading ⏳
- `"no"` - Not available on this device ❌

## Storage Requirements

- **Size:** ~1.7 GB
- **Location:** Chrome's internal storage
- **One-time download:** The model stays on your device

## Troubleshooting

### "Error: requires a gesture"
- Use the manual analysis page method above
- Make sure you're clicking a button, not just loading a page

### Download stuck or slow
- Check your internet connection
- Ensure you have 22+ GB free disk space
- Try restarting Chrome

### Model still not working after download
1. Check availability: `await ai.languageModel.availability()`
2. If it says "readily", try reloading the extension
3. If still not working, check Chrome version (needs 138+)

## Chrome Requirements

- **Chrome Version:** 138+ (Canary/Dev channel)
- **Flags Enabled:**
  - `chrome://flags/#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
  - `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
- **Restart Chrome after enabling flags**
