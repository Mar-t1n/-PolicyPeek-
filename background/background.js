// PolicyPeek Background Service Worker
// Handles background tasks, notifications, and AI API initialization

console.log('PolicyPeek background service worker loaded');

// Extension state
let aiCapabilities = {
  summarizer: false,
  prompt: false,
  writer: false,
  rewriter: false
};

// Initialize background worker
async function init() {
  console.log('PolicyPeek: Initializing background worker...');
  
  // Check AI capabilities
  await checkAICapabilities();
  
  // Set up message listeners
  setupMessageListeners();
  
  // Set up context menu (optional, for later phases)
  // setupContextMenu();
}

// Check which Chrome Built-in AI APIs are available
async function checkAICapabilities() {
  console.log('Checking AI capabilities...');
  
  try {
    // Check Summarizer API
    if ('ai' in self && 'summarizer' in self.ai) {
      const canSummarize = await self.ai.summarizer.capabilities();
      aiCapabilities.summarizer = canSummarize.available !== 'no';
      console.log('Summarizer API available:', aiCapabilities.summarizer);
    }
    
    // Check Prompt API
    if ('ai' in self && 'languageModel' in self.ai) {
      const canPrompt = await self.ai.languageModel.capabilities();
      aiCapabilities.prompt = canPrompt.available !== 'no';
      console.log('Prompt API available:', aiCapabilities.prompt);
    }
    
    // Check Writer API
    if ('ai' in self && 'writer' in self.ai) {
      const canWrite = await self.ai.writer.capabilities();
      aiCapabilities.writer = canWrite.available !== 'no';
      console.log('Writer API available:', aiCapabilities.writer);
    }
    
    // Check Rewriter API
    if ('ai' in self && 'rewriter' in self.ai) {
      const canRewrite = await self.ai.rewriter.capabilities();
      aiCapabilities.rewriter = canRewrite.available !== 'no';
      console.log('Rewriter API available:', aiCapabilities.rewriter);
    }
    
    console.log('AI Capabilities:', aiCapabilities);
    
    // Store capabilities in storage
    await chrome.storage.local.set({ aiCapabilities });
    
  } catch (error) {
    console.error('Error checking AI capabilities:', error);
  }
}

// Set up message listeners
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.type) {
      case 'LINKS_DETECTED':
        handleLinksDetected(message, sender);
        break;
        
      case 'GET_AI_CAPABILITIES':
        sendResponse({ capabilities: aiCapabilities });
        break;
        
      case 'ANALYZE_POLICY':
        handleAnalyzePolicy(message, sender, sendResponse);
        return true; // Keep channel open for async response
        
      default:
        console.log('Unknown message type:', message.type);
    }
  });
}

// Handle links detected notification
function handleLinksDetected(message, sender) {
  console.log(`${message.count} policy links detected on tab ${sender.tab.id}`);
  
  // Show notification to user
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'PolicyPeek',
    message: `Found ${message.count} policy link${message.count > 1 ? 's' : ''} on this page`,
    priority: 1
  });
  
  // Store detected links
  chrome.storage.local.set({
    [`links_${sender.tab.id}`]: {
      count: message.count,
      links: message.links,
      timestamp: Date.now()
    }
  });
}

// Handle policy analysis request
async function handleAnalyzePolicy(message, sender, sendResponse) {
  console.log('Policy analysis requested:', message.url);
  
  // This will be fully implemented in later phases
  // For now, just acknowledge the request
  
  if (!aiCapabilities.summarizer && !aiCapabilities.prompt) {
    sendResponse({
      success: false,
      error: 'Chrome Built-in AI APIs are not available'
    });
    return;
  }
  
  // Placeholder response
  sendResponse({
    success: true,
    message: 'Analysis will be implemented in Phase 4'
  });
}

// Clean up old stored data periodically
async function cleanupOldData() {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  const storage = await chrome.storage.local.get(null);
  const keysToRemove = [];
  
  for (const [key, value] of Object.entries(storage)) {
    if (key.startsWith('links_') && value.timestamp) {
      if (now - value.timestamp > ONE_DAY) {
        keysToRemove.push(key);
      }
    }
  }
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`Cleaned up ${keysToRemove.length} old entries`);
  }
}

// Set up periodic cleanup
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldData();
  }
});

// Initialize on install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('PolicyPeek installed/updated:', details.reason);
  init();
});

// Initialize on startup
init();
