# Migration from Summarizer API to Prompt API

## Summary of Changes

PolicyPeek has been successfully migrated from the Chrome AI Summarizer API to the more powerful **Prompt API**. This provides better control and more detailed analysis of privacy policies.

## What Changed

### 1. API Replacement
- **Old**: Chrome Summarizer API (`self.Summarizer`)
- **New**: Chrome Prompt API (`self.LanguageModel`)

### 2. Key Benefits of Prompt API
- More flexible and customizable responses
- Better handling of long documents (8000 chars vs 4000 chars)
- Structured analysis with specific categories:
  - Key Points
  - Data Collection
  - Data Usage
  - Third-Party Sharing
  - User Rights
  - Notable Concerns

### 3. Files Modified
- `analysis/analysis.js` - Complete migration to Prompt API
- `manifest.json` - Updated description to reflect Prompt API usage

## About Your Trial Token

### Important: No API Key Needed!
The Prompt API uses Chrome's **built-in Gemini Nano model** and does **NOT** require an API key in the traditional sense.

### What is the trial_token in manifest.json?
The trial token you have (`ArKulIMG/UIHotSMRxL/...`) is specifically for:
- **Multimodal inputs** (image and audio analysis)
- This is an **origin trial** feature
- Valid until: **January 21, 2026** (expires: 1774310400)

### Do You Need This Token for Basic Prompt API?
**No!** The basic Prompt API (text input/output) works without any tokens. Your token only enables:
- Image input capability
- Audio input capability

If you only need text analysis (which is what PolicyPeek currently does), the Prompt API will work without the trial token.

## Requirements for Users

To use PolicyPeek with the Prompt API, users need:

1. **Chrome 138+** (or later)
2. **Operating System**:
   - Windows 10 or 11
   - macOS 13+ (Ventura and onwards)
   - Linux
   - ChromeOS (Platform 16389.0.0+) on Chromebook Plus
3. **Storage**: At least 22 GB free space (for Gemini Nano download)
4. **Hardware**:
   - GPU: More than 4 GB VRAM, OR
   - CPU: 16 GB RAM + 4 CPU cores minimum
5. **Network**: Unlimited data or unmetered connection

## Testing the Extension

1. **Load the extension** in Chrome (chrome://extensions)
2. **Enable Developer Mode**
3. **Click "Load unpacked"** and select the extension folder
4. Navigate to any website with a privacy policy
5. Click the PolicyPeek icon and analyze the policy

### Checking if Prompt API is Available

Open the browser console (F12) and run:
```javascript
await LanguageModel.availability()
// Should return: 'readily', 'after-download', or 'downloading'
```

### Checking Model Download Status

Visit `chrome://on-device-internals` to see:
- Model download status
- Current model size
- Available storage space

## Troubleshooting

### Issue: "LanguageModel is not defined"
**Solution**: Ensure you're using Chrome 138+ and have enabled AI features:
1. Go to `chrome://flags`
2. Search for "Prompt API for Gemini Nano"
3. Enable it
4. Restart Chrome

### Issue: Model Not Downloading
**Solution**: 
- Check you have 22+ GB free space
- Ensure you're on an unmetered connection
- User must interact with the page (click, tap, etc.) to trigger download

### Issue: Slow or No Response
**Solution**:
- First use downloads the model (may take 5-10 minutes)
- Check download progress in console logs
- Verify hardware requirements are met

## Advanced Features (Future)

With your multimodal trial token, you could add:
- **Image analysis**: Upload policy screenshots
- **Audio analysis**: Transcribe policy videos

To use these features, you would need to:
1. Add `expectedInputs` to the session creation:
```javascript
const session = await LanguageModel.create({
  expectedInputs: [
    { type: "text", languages: ["en"] },
    { type: "image" }  // Requires trial token
  ]
});
```

2. Send multimodal prompts:
```javascript
const result = await session.prompt([
  { role: 'user', content: [
    { type: 'text', value: 'Analyze this privacy policy screenshot' },
    { type: 'image', value: imageFile }
  ]}
]);
```

## Code Changes Summary

### Old Code (Summarizer API)
```javascript
const summarizerInstance = await self.Summarizer.create({
  type: 'key-points',
  format: 'markdown',
  length: 'medium'
});

const summary = await summarizerInstance.summarize(text);
```

### New Code (Prompt API)
```javascript
const promptSession = await self.LanguageModel.create({
  temperature: 0.8,
  topK: 3,
  systemPrompt: 'You are a helpful AI assistant...'
});

const summary = await promptSession.prompt(
  'Please analyze this privacy policy...'
);
```

## Next Steps

1. ✅ Migration complete
2. ⏭️ Test the extension with various privacy policies
3. ⏭️ Optionally add streaming responses for real-time feedback
4. ⏭️ Consider adding multimodal capabilities (images/audio)

## Resources

- [Prompt API Documentation](https://developer.chrome.com/docs/ai/built-in-apis#prompt-api)
- [Chrome AI APIs Overview](https://developer.chrome.com/docs/ai/built-in)
- [Origin Trial Information](https://developer.chrome.com/origintrials)
