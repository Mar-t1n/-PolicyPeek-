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
  'privacy & cookies',
  'service terms',
  'data protection policy',
  'terms of service agreement',
  'privacy statement',
  'data protection',
  'disclaimer',
  'legal information',
  'privacy practices'
];

// State
let detectedLinks = [];
let isScanning = false;
let scanTimeout = null;
let processedUrls = new Set();
let activeTooltip = null;
let settings = {
  notificationsEnabled: false,
  showMagnifyingGlass: true
};

// Initialize content script
function init() {
  console.log('PolicyPeek: Initializing content script');
  
  // Load settings first
  loadSettings().then(() => {
    // Scan page for policy links
    scanForPolicyLinks();
  });
  
  // Set up message listener for popup communication
  setupMessageListener();
  
  // Set up mutation observer to detect dynamically added links
  setupMutationObserver();
  
  // Listen for clicks outside tooltips to close them
  document.addEventListener('click', handleDocumentClick);
  
  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.showMagnifyingGlass) {
        settings.showMagnifyingGlass = changes.showMagnifyingGlass.newValue;
        updateNotifierVisibility();
      }
      if (changes.notificationsEnabled) {
        settings.notificationsEnabled = changes.notificationsEnabled.newValue;
      }
    }
  });
}

// Load settings from storage
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get({
      notificationsEnabled: false,
      showMagnifyingGlass: true
    });
    settings.notificationsEnabled = stored.notificationsEnabled;
    settings.showMagnifyingGlass = stored.showMagnifyingGlass;
  } catch (error) {
    // Extension context may be invalidated
    console.error('Error loading settings:', error);
  }
}

// Update visibility of all notifiers based on settings
function updateNotifierVisibility() {
  const notifiers = document.querySelectorAll('.policypeek-notifier');
  notifiers.forEach(notifier => {
    if (settings.showMagnifyingGlass) {
      notifier.style.display = '';
    } else {
      notifier.style.display = 'none';
    }
  });
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
      // For link text, require more exact matching (with word boundaries)
      // This prevents matching "privacy" in "privacy settings" or random text
      const words = linkText.split(/\s+/);
      const keywordWords = keyword.split(/\s+/);
      
      // Check if all keyword words appear consecutively in link text
      let foundInText = false;
      if (keywordWords.length === 1) {
        // Single word: check if it's the entire link text or surrounded by word boundaries
        foundInText = linkText === keyword || 
                      linkText === keyword + 's' || // plural
                      new RegExp(`\\b${keyword}\\b`).test(linkText);
      } else {
        // Multi-word: check if exact phrase exists
        foundInText = linkText.includes(keyword);
      }
      
      if (foundInText) {
        return true;
      }
      
      // Check href with various formats: hyphenated, underscored, concatenated
      // Only check in pathname and search params, not the entire URL
      const url = new URL(link.href);
      const pathname = url.pathname.toLowerCase();
      const search = url.search.toLowerCase();
      
      const hyphenated = keyword.replace(/\s+/g, '-');
      const underscored = keyword.replace(/\s+/g, '_');
      const concatenated = keyword.replace(/\s+/g, '');
      
      // Check for specific URL patterns (more restrictive)
      const urlPatterns = [
        `/${hyphenated}`,
        `/${underscored}`,
        `/${concatenated}`,
        `/${hyphenated}/`,
        `/${underscored}/`,
        `/${concatenated}/`,
        `/${hyphenated}.`,  // e.g., /privacy-policy.html
        `/${underscored}.`,
        `/${concatenated}.`
      ];
      
      // Check pathname for patterns
      const foundInPath = urlPatterns.some(pattern => pathname.includes(pattern));
      
      // Check search params more carefully (e.g., ?page=privacy-policy)
      const foundInSearch = search.includes(`=${hyphenated}`) || 
                           search.includes(`=${underscored}`) ||
                           search.includes(`=${concatenated}`);
      
      return foundInPath || foundInSearch;
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
    
    // Show notification if enabled
    if (settings.notificationsEnabled) {
      const message = detectedLinks.length === 1 
        ? 'Found 1 policy link on this page' 
        : `Found ${detectedLinks.length} policy links on this page`;
      showNotification(message, 'success');
    }
  }
  
  isScanning = false;
}

// Notify background script about detected links
function notifyLinksFound() {
  try {
    chrome.runtime.sendMessage({
      type: 'LINKS_DETECTED',
      count: detectedLinks.length,
      links: detectedLinks.map(l => ({ text: l.text, url: l.url }))
    }).catch(error => {
      // Extension context may be invalidated, ignore
      console.log('Could not send message to background:', error);
    });
  } catch (error) {
    // Extension context invalidated, ignore silently
    console.log('Extension context invalidated:', error);
  }
}

// Inject visual notifier badge next to policy link
function injectNotifier(linkElement) {
  // Skip if link already has a notifier
  if (linkElement.querySelector('.policypeek-notifier')) {
    return;
  }
  
  // Create notifier badge
  const notifier = document.createElement('span');
  notifier.className = 'policypeek-notifier';
  notifier.setAttribute('role', 'button');
  notifier.setAttribute('aria-label', 'Review with PolicyPeek');
  notifier.innerHTML = '🔍';
  
  // Hide if setting is disabled
  if (!settings.showMagnifyingGlass) {
    notifier.style.display = 'none';
  }
  
  // Add click handler
  notifier.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleNotifierClick(linkElement, notifier);
  });
  
  // Insert notifier INSIDE the link at the end (so it stays with the link text)
  linkElement.appendChild(notifier);
  
  // Add entrance animation (only if visible)
  if (settings.showMagnifyingGlass) {
    notifier.classList.add('animate');
    setTimeout(() => {
      notifier.classList.remove('animate');
    }, 3000);
  }
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
  
  try {
    // Open analysis page with URL parameters
    const analysisUrl = chrome.runtime.getURL('analysis/analysis.html') + 
      `?url=${encodeURIComponent(policyUrl)}&title=${encodeURIComponent(policyTitle)}`;
    
    window.open(analysisUrl, '_blank');
  } catch (error) {
    // Extension context invalidated - extension was reloaded
    console.error('Extension context invalidated. Please refresh the page.', error);
    alert('PolicyPeek extension was updated. Please refresh this page and try again.');
  }
}

// Show notification to user
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `policypeek-notification policypeek-notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Auto-hide after 3 seconds (unless loading)
  if (type !== 'loading') {
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  } else {
    // Store reference to remove later
    notification.dataset.loading = 'true';
  }
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
