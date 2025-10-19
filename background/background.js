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
    console.log('Fetching URL:', message.url);
    
    // Try to inject content script to extract text from the actual page first
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if the tab URL matches the policy URL
      if (tab && tab.url === message.url) {
        console.log('Extracting text directly from active tab');
        
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Extract text from the page
            return document.body.innerText || document.body.textContent;
          }
        });
        
        if (results && results[0] && results[0].result) {
          const extractedText = results[0].result.trim();
          console.log('Text extracted from page:', extractedText.length, 'characters');
          
          if (extractedText.length > 100) {
            return {
              success: true,
              content: extractedText,
              url: message.url,
              title: message.title || "Policy Document"
            };
          }
        }
      }
    } catch (scriptError) {
      console.log('Could not extract from page, falling back to fetch:', scriptError);
    }
    
    // Fallback: Fetch the URL
    console.log('Fetching URL via network request');
    const response = await fetch(message.url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('HTML fetched:', html.length, 'characters');
    
    const cleanText = extractTextFromHTML(html);
    console.log('Text extracted:', cleanText.length, 'characters');
    
    if (cleanText.length < 50) {
      console.warn('Very short text extracted. HTML might be blocked or empty.');
      console.log('First 500 chars of HTML:', html.substring(0, 500));
    }
    
    return {
      success: true,
      content: cleanText,
      url: message.url,
      title: message.title || "Policy Document"
    };
  } catch (error) {
    console.error('Error in handleAnalyzePolicy:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function extractTextFromHTML(html) {
  // Remove script and style tags with their content
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, ""); // Remove HTML comments
  
  // Decode HTML entities first
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
  
  return text;
}
