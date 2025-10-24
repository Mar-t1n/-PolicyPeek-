# API Comparison: Summarizer vs Prompt API

## Side-by-Side Comparison

| Feature | Summarizer API (Old) | Prompt API (New) |
|---------|---------------------|------------------|
| **API Name** | `self.Summarizer` | `self.LanguageModel` |
| **Max Text Length** | ~4000 characters | ~8000+ characters |
| **Response Type** | Fixed summary format | Customizable responses |
| **System Prompts** | Limited (`sharedContext`) | Full system prompts |
| **Temperature Control** | No | Yes (0.0 - 2.0) |
| **TopK Control** | No | Yes (1 - 128) |
| **Output Format** | Predefined | Fully customizable |
| **Streaming** | No | Yes (`promptStreaming()`) |
| **Session Management** | Basic | Advanced (clone, destroy) |
| **Multimodal Input** | No | Yes (text, image, audio)* |

*Multimodal requires origin trial token (you have this!)

## Code Examples

### Initialization

#### Summarizer API (Old)
```javascript
// Check availability
const availability = await self.Summarizer.availability();

// Create instance
const summarizer = await self.Summarizer.create({
  sharedContext: 'This is a privacy policy',
  type: 'key-points',
  format: 'markdown',
  length: 'medium',
  outputLanguage: 'en'
});
```

#### Prompt API (New)
```javascript
// Check availability
const availability = await self.LanguageModel.availability();

// Get model parameters
const params = await self.LanguageModel.params();

// Create session
const session = await self.LanguageModel.create({
  temperature: 0.8,
  topK: 3,
  systemPrompt: 'You are an AI assistant specialized in...'
});
```

### Making Requests

#### Summarizer API (Old)
```javascript
// Simple summarization
const summary = await summarizer.summarize(text);

// With options
const summary = await summarizer.summarize(text, {
  context: 'Additional context',
  outputLanguage: 'en'
});
```

#### Prompt API (New)
```javascript
// Simple prompt
const response = await session.prompt('Analyze this: ' + text);

// Structured prompt with detailed instructions
const response = await session.prompt(`
  Please analyze this privacy policy and provide:
  1. Key Points
  2. Data Collection
  3. User Rights
  
  Policy: ${text}
`);

// Streaming response
const stream = session.promptStreaming('Write a summary...');
for await (const chunk of stream) {
  console.log(chunk);
}
```

### Session Context

#### Summarizer API (Old)
```javascript
// No session context management
// Each call is independent
const summary1 = await summarizer.summarize(text1);
const summary2 = await summarizer.summarize(text2);
```

#### Prompt API (New)
```javascript
// Session maintains context
const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a legal expert' },
    { role: 'user', content: 'Analyze this policy' },
    { role: 'assistant', content: 'I analyzed it...' }
  ]
});

// Follow-up questions use context
const response = await session.prompt('What about data sharing?');
```

## Real-World Example: PolicyPeek

### Before (Summarizer API)

```javascript
// Limited customization
const summarizerInstance = await self.Summarizer.create({
  sharedContext: 'This is a privacy policy or terms of service document',
  type: 'key-points',
  format: 'markdown',
  length: 'medium',
  outputLanguage: 'en'
});

// Simple summarization - limited control
const summary = await summarizerInstance.summarize(
  policyText.substring(0, 4000),  // Had to truncate!
  {
    context: 'This document is a privacy policy...',
    outputLanguage: 'en'
  }
);

// Result: Generic key-points summary
```

### After (Prompt API)

```javascript
// Much more customization
const params = await self.LanguageModel.params();
const promptSession = await self.LanguageModel.create({
  temperature: Math.min(params.defaultTemperature * 0.8, params.maxTemperature),
  topK: params.defaultTopK,
  systemPrompt: 'You are a helpful AI assistant specialized in analyzing privacy policies and terms of service documents. Provide clear, concise summaries that highlight key points about data collection, user rights, and important terms.'
});

// Detailed, structured analysis with specific categories
const prompt = `Please analyze this privacy policy and provide:

1. **Key Points**: The most important things users should know
2. **Data Collection**: What personal data is collected
3. **Data Usage**: How the data is used
4. **Third-Party Sharing**: If and how data is shared
5. **User Rights**: What rights users have
6. **Notable Concerns**: Any concerning terms

Document: ${policyText.substring(0, 8000)}`;  // Can handle 2x more text!

const summary = await promptSession.prompt(prompt);

// Result: Detailed, structured analysis with specific sections
```

## Benefits of Migration

### 1. More Detailed Analysis ✅
- Before: Generic bullet points
- After: Structured sections with specific categories

### 2. Better Text Handling ✅
- Before: 4000 character limit
- After: 8000+ character limit

### 3. Customizable Responses ✅
- Before: Fixed "key-points" format
- After: Define exact format needed

### 4. System Prompts ✅
- Before: Limited `sharedContext`
- After: Full system prompt for role definition

### 5. Future-Proof ✅
- Prompt API is actively developed
- Multimodal capabilities available
- Streaming support
- Better session management

## Performance Considerations

### Token Usage
```javascript
// Check how much quota a prompt uses
const usage = session.measureInputUsage(prompt);
console.log(`Uses ${usage} tokens`);

// Monitor session usage
console.log(`${session.inputUsage}/${session.inputQuota}`);
```

### Session Cloning
```javascript
// Preserve resources by cloning instead of creating new
const clonedSession = await session.clone();
```

### Cleanup
```javascript
// Free resources when done
session.destroy();
```

## Migration Checklist

- [x] Replace `Summarizer` with `LanguageModel`
- [x] Update availability check
- [x] Replace `create()` options
- [x] Update `summarize()` to `prompt()`
- [x] Increase text limit (4000 → 8000 chars)
- [x] Add structured prompt format
- [x] Update error messages
- [x] Update console logs
- [x] Test with real privacy policies
- [ ] Add streaming for better UX (optional)
- [ ] Add multimodal support (optional)

## Testing

### Test Cases

1. **Short policy** (< 1000 chars)
   - Should analyze completely
   - No truncation needed

2. **Medium policy** (1000-8000 chars)
   - Should analyze completely
   - Optimal performance

3. **Long policy** (> 8000 chars)
   - Should truncate gracefully
   - Show truncation notice

4. **Error handling**
   - API not available
   - Model not downloaded
   - Session destroyed

### Console Verification

Open DevTools and look for:
```
✅ Prompt API initialized successfully!
Using Chrome AI Prompt API...
AI Analysis generated successfully
```

## Future Enhancements

### 1. Streaming Responses
```javascript
const stream = session.promptStreaming(prompt);
let fullResponse = '';

for await (const chunk of stream) {
  fullResponse += chunk;
  updateUI(fullResponse);  // Real-time updates!
}
```

### 2. Multi-Turn Conversations
```javascript
// First analysis
await session.prompt('Analyze this policy');

// Follow-up questions
await session.prompt('What about GDPR compliance?');
await session.prompt('Are there any concerning clauses?');
```

### 3. Image Support (with your trial token!)
```javascript
const session = await LanguageModel.create({
  expectedInputs: [
    { type: "text", languages: ["en"] },
    { type: "image" }
  ]
});

// Analyze screenshot of policy
await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'Analyze this policy screenshot' },
      { type: 'image', value: imageFile }
    ]
  }
]);
```

## Summary

The migration from Summarizer API to Prompt API gives PolicyPeek:
- **2x more text capacity** (4K → 8K chars)
- **Better structure** (6 specific categories)
- **More control** (temperature, topK, system prompts)
- **Future-ready** (streaming, multimodal, sessions)

The Prompt API is more powerful, flexible, and actively maintained by Chrome!
