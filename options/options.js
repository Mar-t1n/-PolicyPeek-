// PolicyPeek Options/Settings Page

console.log('PolicyPeek options page loaded');

// DOM Elements
const autoScan = document.getElementById('auto-scan');
const saveBtn = document.getElementById('save-btn');

// Initialize
async function init() {
  await loadSettings();
  setupEventListeners();
}

// Load saved settings
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get({
      autoScan: true
    });
    
    autoScan.checked = settings.autoScan;
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  saveBtn.addEventListener('click', saveSettings);
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      autoScan: autoScan.checked
    };
    
    await chrome.storage.local.set(settings);
    
    // Show success feedback
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.disabled = true;
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
    
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Failed to save settings. Please try again.');
  }
}

// Initialize when page loads
init();
