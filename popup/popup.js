// PolicyPeek Popup Script
// Handles the main popup interface and user interactions

console.log('PolicyPeek popup loaded');

// DOM Elements
const loadingEl = document.getElementById('loading');
const linksContainerEl = document.getElementById('links-container');
const linksListEl = document.getElementById('links-list');
const noLinksEl = document.getElementById('no-links');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('error-message');

// Buttons
const manualAnalysisBtn = document.getElementById('manual-analysis-btn');
const manualAnalysisBtnAlt = document.getElementById('manual-analysis-btn-alt');
const refreshBtn = document.getElementById('refresh-btn');
const settingsBtn = document.getElementById('settings-btn');

// Initialize popup
async function init() {
  console.log('Initializing popup...');
  showLoading();
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showError('Unable to access current tab');
      return;
    }

    // Request policy links from content script
    chrome.tabs.sendMessage(tab.id, { type: 'GET_POLICY_LINKS' })
      .then(response => {
        if (response && response.success) {
          if (response.links && response.links.length > 0) {
            showLinks(response.links);
          } else {
            showNoLinks();
          }
        } else {
          showNoLinks();
        }
      })
      .catch(error => {
        console.log('Could not connect to content script:', error);
        showNoLinks();
      });

  } catch (error) {
    console.error('Error initializing popup:', error);
    showError(error.message || 'An unexpected error occurred');
  }
}

// UI State Management
function showLoading() {
  hideAll();
  loadingEl.classList.remove('hidden');
  // Height fixed at 500px in CSS
}

function showLinks(links) {
  hideAll();
  linksContainerEl.classList.remove('hidden');
  
  // Show manual analysis button in footer
  if (manualAnalysisBtnAlt) {
    manualAnalysisBtnAlt.classList.remove('hidden');
  }
  
  // Clear existing links
  linksListEl.innerHTML = '';
  
  // Populate links
  links.forEach(link => {
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';
    
    const linkInfo = document.createElement('div');
    linkInfo.className = 'link-info';
    
    const linkTitle = document.createElement('div');
    linkTitle.className = 'link-title';
    linkTitle.textContent = link.text || 'Policy Link';
    
    const linkUrl = document.createElement('div');
    linkUrl.className = 'link-url';
    linkUrl.textContent = link.url;
    
    linkInfo.appendChild(linkTitle);
    linkInfo.appendChild(linkUrl);
    
    const analyzeButton = document.createElement('button');
    analyzeButton.className = 'analyze-btn';
    analyzeButton.textContent = 'Analyze';
    analyzeButton.onclick = () => analyzeLink(link.url, link.text);
    
    linkItem.appendChild(linkInfo);
    linkItem.appendChild(analyzeButton);
    linksListEl.appendChild(linkItem);
  });
  
  // Height fixed at 500px in CSS - no dynamic adjustment needed
  
  console.log(`Displayed ${links.length} policy links`);
}

// Dynamic height adjustment removed - using fixed 500px height

// Analyze a specific link
async function analyzeLink(url, title) {
  console.log('Analyzing link:', url);
  
  try {
    // Open analysis page with URL parameters
    const analysisUrl = chrome.runtime.getURL('analysis/analysis.html') + 
      `?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    
    chrome.tabs.create({ url: analysisUrl });
    
    // Close popup
    window.close();
    
  } catch (error) {
    console.error('Error analyzing link:', error);
  }
}

function showNoLinks() {
  hideAll();
  noLinksEl.classList.remove('hidden');
  // Height fixed at 500px in CSS
}

function showError(message) {
  hideAll();
  errorEl.classList.remove('hidden');
  errorMessageEl.textContent = message;
  // Height fixed at 500px in CSS
}

function hideAll() {
  loadingEl.classList.add('hidden');
  linksContainerEl.classList.add('hidden');
  noLinksEl.classList.add('hidden');
  errorEl.classList.add('hidden');
  
  // Hide manual analysis button in footer
  if (manualAnalysisBtnAlt) {
    manualAnalysisBtnAlt.classList.add('hidden');
  }
}

// Event Listeners
manualAnalysisBtn.addEventListener('click', () => {
  console.log('Manual analysis requested');
  chrome.tabs.create({ url: chrome.runtime.getURL('analysis/analysis.html') });
  window.close();
});

// Manual analysis button in links-found state
if (manualAnalysisBtnAlt) {
  manualAnalysisBtnAlt.addEventListener('click', () => {
    console.log('Manual analysis requested (from links view)');
    chrome.tabs.create({ url: chrome.runtime.getURL('analysis/analysis.html') });
    window.close();
  });
}

refreshBtn.addEventListener('click', async () => {
  console.log('Refresh requested - reloading page');
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Reload the current page
    chrome.tabs.reload(tab.id);
    
  } catch (error) {
    console.error('Error refreshing page:', error);
  }
});

settingsBtn.addEventListener('click', () => {
  console.log('Settings requested');
  // Open settings page (to be implemented in later phase)
  chrome.runtime.openOptionsPage();
});

// Start initialization when popup opens
init();
