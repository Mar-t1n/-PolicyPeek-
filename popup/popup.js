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
    // This will be implemented in Phase 2
    setTimeout(() => {
      // Placeholder: Show no links for now
      showNoLinks();
    }, 1000);

  } catch (error) {
    console.error('Error initializing popup:', error);
    showError(error.message || 'An unexpected error occurred');
  }
}

// UI State Management
function showLoading() {
  hideAll();
  loadingEl.classList.remove('hidden');
}

function showLinks(links) {
  hideAll();
  linksContainerEl.classList.remove('hidden');
  
  // Clear existing links
  linksListEl.innerHTML = '';
  
  // Populate links (to be implemented)
  console.log('Links to display:', links);
}

function showNoLinks() {
  hideAll();
  noLinksEl.classList.remove('hidden');
}

function showError(message) {
  hideAll();
  errorEl.classList.remove('hidden');
  errorMessageEl.textContent = message;
}

function hideAll() {
  loadingEl.classList.add('hidden');
  linksContainerEl.classList.add('hidden');
  noLinksEl.classList.add('hidden');
  errorEl.classList.add('hidden');
}

// Event Listeners
manualAnalysisBtn.addEventListener('click', () => {
  console.log('Manual analysis requested');
  // Open manual analysis page (to be implemented in Phase 3)
  chrome.tabs.create({ url: chrome.runtime.getURL('analysis/analysis.html') });
});

refreshBtn.addEventListener('click', () => {
  console.log('Refresh requested');
  init();
});

settingsBtn.addEventListener('click', () => {
  console.log('Settings requested');
  // Open settings page (to be implemented in later phase)
  chrome.runtime.openOptionsPage();
});

// Start initialization when popup opens
init();
