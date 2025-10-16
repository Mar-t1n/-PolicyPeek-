// PolicyPeek Background Service Worker
console.log("PolicyPeek background service worker loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);
  
  if (message.type === "LINKS_DETECTED") {
    handleLinksDetected(message, sender);
    return;
  }
  
  if (message.type === "ANALYZE_POLICY") {
    handleAnalyzePolicy(message, sender).then(sendResponse);
    return true;
  }
});

function handleLinksDetected(message, sender) {
  console.log(`${message.count} policy links detected on tab ${sender.tab.id}`);
  
  // Store detected links
  chrome.storage.local.set({
    [`links_${sender.tab.id}`]: {
      count: message.count,
      links: message.links,
      timestamp: Date.now()
    }
  });
}

async function handleAnalyzePolicy(message, sender) {
  try {
    const response = await fetch(message.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const cleanText = extractTextFromHTML(html);
    
    return {
      success: true,
      content: cleanText,
      url: message.url,
      title: message.title || "Policy Document"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function extractTextFromHTML(html) {
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}
