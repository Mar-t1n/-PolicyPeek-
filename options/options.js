// PolicyPeek Options/Settings Page

console.log('PolicyPeek options page loaded');

// DOM Elements
const notificationsEnabled = document.getElementById('notifications-enabled');
const autoScan = document.getElementById('auto-scan');
const showMagnifyingGlass = document.getElementById('show-magnifying-glass');
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
      notificationsEnabled: false,
      autoScan: true,
      showMagnifyingGlass: true
    });
    
    notificationsEnabled.checked = settings.notificationsEnabled;
    autoScan.checked = settings.autoScan;
    showMagnifyingGlass.checked = settings.showMagnifyingGlass;
    
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
      notificationsEnabled: notificationsEnabled.checked,
      autoScan: autoScan.checked,
      showMagnifyingGlass: showMagnifyingGlass.checked
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
