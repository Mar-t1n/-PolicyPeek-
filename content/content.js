// PolicyPeek Content Script
// Runs on all web pages to detect and mark policy links

console.log('PolicyPeek content script loaded');

// Configuration
const POLICY_KEYWORDS = [
  'privacy policy',
  'privacy notice',
  'terms of service',
  'terms and conditions',
  'terms of use',
  'user agreement',
  'cookie policy',
  'cookies policy',
  'data policy',
  'eula',
  'end user license agreement',
  'acceptable use policy',
  'legal notice',
  'terms & conditions',
  'privacy & cookies'
];

// State
let detectedLinks = [];

// Initialize content script
function init() {
  console.log('PolicyPeek: Initializing content script');
  
  // Scan page for policy links
  scanForPolicyLinks();
  
  // Set up message listener for popup communication
  setupMessageListener();
  
  // Set up mutation observer to detect dynamically added links
  setupMutationObserver();
}

// Scan the page for policy links
function scanForPolicyLinks() {
  console.log('PolicyPeek: Scanning for policy links...');
  
  detectedLinks = [];
  
  // Get all anchor elements
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const linkText = link.textContent.toLowerCase().trim();
    const linkHref = link.href.toLowerCase();
    
    // Check if link matches policy keywords
    const isPolicy = POLICY_KEYWORDS.some(keyword => 
      linkText.includes(keyword) || linkHref.includes(keyword.replace(/\s+/g, '-'))
    );
    
    if (isPolicy) {
      detectedLinks.push({
        text: link.textContent.trim(),
        url: link.href,
        element: link
      });
      
      // Mark the link (to be implemented in Phase 2)
      console.log('Policy link found:', link.textContent, link.href);
    }
  });
  
  console.log(`PolicyPeek: Found ${detectedLinks.length} policy links`);
  
  // Notify background script if links were found
  if (detectedLinks.length > 0) {
    notifyLinksFound();
  }
}

// Notify background script about detected links
function notifyLinksFound() {
  chrome.runtime.sendMessage({
    type: 'LINKS_DETECTED',
    count: detectedLinks.length,
    links: detectedLinks.map(l => ({ text: l.text, url: l.url }))
  }).catch(error => {
    console.log('Could not send message to background:', error);
  });
}

// Set up message listener for communication with popup
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    if (message.type === 'GET_POLICY_LINKS') {
      sendResponse({
        success: true,
        links: detectedLinks.map(l => ({ text: l.text, url: l.url }))
      });
    }
    
    return true; // Keep channel open for async response
  });
}

// Set up mutation observer to detect dynamically added links
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldRescan = false;
    
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'A' || node.querySelector('a')) {
              shouldRescan = true;
            }
          }
        });
      }
    });
    
    if (shouldRescan) {
      console.log('PolicyPeek: DOM changed, rescanning...');
      scanForPolicyLinks();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
