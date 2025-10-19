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
let isScanning = false;
let scanTimeout = null;
let processedUrls = new Set();
let activeTooltip = null;

// Initialize content script
function init() {
  console.log('PolicyPeek: Initializing content script');
  
  // Scan page for policy links
  scanForPolicyLinks();
  
  // Set up message listener for popup communication
  setupMessageListener();
  
  // Set up mutation observer to detect dynamically added links
  setupMutationObserver();
  
  // Listen for clicks outside tooltips to close them
  document.addEventListener('click', handleDocumentClick);
}

// Handle clicks outside tooltips to close them
function handleDocumentClick(event) {
  if (activeTooltip && !event.target.closest('.policypeek-tooltip') && !event.target.closest('.policypeek-notifier')) {
    closeActiveTooltip();
  }
}

// Close active tooltip
function closeActiveTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}

// Scan the page for policy links
function scanForPolicyLinks() {
  // Prevent concurrent scans
  if (isScanning) {
    console.log('PolicyPeek: Scan already in progress, skipping...');
    return;
  }
  
  isScanning = true;
  console.log('PolicyPeek: Scanning for policy links...');
  
  detectedLinks = [];
  
  // Get all anchor elements
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    const linkText = link.textContent.toLowerCase().trim();
    const linkHref = link.href.toLowerCase();
    
    // Skip if already processed
    if (processedUrls.has(link.href)) {
      return;
    }
    
    // Check if link matches policy keywords
    const isPolicy = POLICY_KEYWORDS.some(keyword => {
      // Check link text
      if (linkText.includes(keyword)) {
        return true;
      }
      
      // Check href with various formats: hyphenated, underscored, concatenated
      const hyphenated = keyword.replace(/\s+/g, '-');
      const underscored = keyword.replace(/\s+/g, '_');
      const concatenated = keyword.replace(/\s+/g, '');
      
      return linkHref.includes(hyphenated) || 
             linkHref.includes(underscored) || 
             linkHref.includes(concatenated);
    });
    
    if (isPolicy && !link.querySelector('.policypeek-notifier')) {
      // Mark this URL as processed
      processedUrls.add(link.href);
      
      // Store link data
      detectedLinks.push({
        text: link.textContent.trim(),
        url: link.href,
        element: link
      });
      
      // Add CSS class to the link
      link.classList.add('policypeek-detected-link');
      
      // Inject notifier badge
      injectNotifier(link);
      
      console.log('Policy link found:', link.textContent.trim(), link.href);
    }
  });
  
  console.log(`PolicyPeek: Found ${detectedLinks.length} policy links`);
  
  // Notify background script if links were found
  if (detectedLinks.length > 0) {
    notifyLinksFound();
  }
  
  isScanning = false;
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

// Inject visual notifier badge next to policy link
function injectNotifier(linkElement) {
  // Create notifier badge
  const notifier = document.createElement('span');
  notifier.className = 'policypeek-notifier';
  notifier.setAttribute('role', 'button');
  notifier.setAttribute('aria-label', 'Review with PolicyPeek');
  notifier.innerHTML = '🔍';
  
  // Add click handler
  notifier.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleNotifierClick(linkElement, notifier);
  });
  
  // Insert notifier after the link
  linkElement.insertAdjacentElement('afterend', notifier);
  
  // Add entrance animation
  notifier.classList.add('animate');
  setTimeout(() => {
    notifier.classList.remove('animate');
  }, 3000);
}

// Handle notifier click - show tooltip with "Review with PolicyPeek"
function handleNotifierClick(linkElement, notifierElement) {
  // Close any existing tooltip
  closeActiveTooltip();
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'policypeek-tooltip show';
  
  // Create tooltip content
  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'policypeek-tooltip-content';
  
  const title = document.createElement('div');
  title.className = 'policypeek-tooltip-title';
  title.textContent = 'Review with PolicyPeek';
  
  const description = document.createElement('div');
  description.className = 'policypeek-tooltip-description';
  description.textContent = 'Get an AI-powered summary and key points';
  
  const button = document.createElement('button');
  button.className = 'policypeek-tooltip-button';
  button.textContent = 'Analyze Policy';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    analyzePolicy(linkElement.href, linkElement.textContent.trim());
  });
  
  tooltipContent.appendChild(title);
  tooltipContent.appendChild(description);
  tooltipContent.appendChild(button);
  tooltip.appendChild(tooltipContent);
  
  // Position tooltip
  document.body.appendChild(tooltip);
  const notifierRect = notifierElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Position below the notifier
  let top = notifierRect.bottom + window.scrollY + 8;
  let left = notifierRect.left + window.scrollX - (tooltipRect.width / 2) + (notifierRect.width / 2);
  
  // Keep tooltip in viewport
  if (left < 10) left = 10;
  if (left + tooltipRect.width > window.innerWidth - 10) {
    left = window.innerWidth - tooltipRect.width - 10;
  }
  
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  
  activeTooltip = tooltip;
}

// Analyze policy by opening the analysis page
function analyzePolicy(policyUrl, policyTitle) {
  console.log('PolicyPeek: Analyzing policy:', policyUrl);
  
  // Close tooltip
  closeActiveTooltip();
  
  // Open analysis page with URL parameters
  const analysisUrl = chrome.runtime.getURL('analysis/analysis.html') + 
    `?url=${encodeURIComponent(policyUrl)}&title=${encodeURIComponent(policyTitle)}`;
  
  window.open(analysisUrl, '_blank');
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
    
    if (message.type === 'RESCAN_PAGE') {
      // Clear processed URLs to allow re-detection
      processedUrls.clear();
      
      // Remove existing notifiers
      document.querySelectorAll('.policypeek-notifier').forEach(notifier => {
        notifier.remove();
      });
      
      // Remove detected link classes
      document.querySelectorAll('.policypeek-detected-link').forEach(link => {
        link.classList.remove('policypeek-detected-link');
      });
      
      // Rescan
      scanForPolicyLinks();
      
      sendResponse({ success: true });
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
      // Debounce: Clear existing timeout and set new one
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
      
      scanTimeout = setTimeout(() => {
        console.log('PolicyPeek: DOM changed, rescanning after debounce...');
        scanForPolicyLinks();
        scanTimeout = null;
      }, 1000); // Wait 1 second after last change
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('PolicyPeek: MutationObserver set up with 1-second debounce');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
