// PolicyPeek Manual Analysis Page
// Handles manual policy text input and analysis

console.log('PolicyPeek analysis page loaded');

// DOM Elements
const inputSection = document.getElementById('input-section');
const resultsSection = document.getElementById('results-section');
const loadingSection = document.getElementById('loading-section');
const policyInput = document.getElementById('policy-input');
const analyzeBtn = document.getElementById('analyze-btn');
const clearBtn = document.getElementById('clear-btn');
const newAnalysisBtn = document.getElementById('new-analysis-btn');
const resultsContent = document.getElementById('results-content');

// State
let isAnalyzing = false;

// Initialize page
function init() {
  console.log('Initializing analysis page...');
  setupEventListeners();
  
  // Check for URL parameters (auto-analysis from popup)
  const urlParams = new URLSearchParams(window.location.search);
  const policyUrl = urlParams.get('url');
  const policyTitle = urlParams.get('title');
  
  if (policyUrl) {
    // Auto-analyze from URL
    analyzeFromUrl(policyUrl, policyTitle);
  } else {
    // Check for saved manual input
    checkForSavedInput();
  }
}

// Set up event listeners
function setupEventListeners() {
  analyzeBtn.addEventListener('click', handleAnalyze);
  clearBtn.addEventListener('click', handleClear);
  newAnalysisBtn.addEventListener('click', handleNewAnalysis);
  
  // Enable/disable analyze button based on input
  policyInput.addEventListener('input', () => {
    const hasInput = policyInput.value.trim().length > 0;
    analyzeBtn.disabled = !hasInput || isAnalyzing;
  });
  
  // Auto-save input
  policyInput.addEventListener('input', () => {
    chrome.storage.local.set({ manualInputDraft: policyInput.value });
  });
}

// Check for saved input from previous session
async function checkForSavedInput() {
  try {
    const { manualInputDraft } = await chrome.storage.local.get('manualInputDraft');
    if (manualInputDraft) {
      policyInput.value = manualInputDraft;
      analyzeBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error checking saved input:', error);
  }
}

// Handle analyze button click
async function handleAnalyze() {
  const text = policyInput.value.trim();
  
  if (!text) {
    alert('Please paste some policy text to analyze.');
    return;
  }
  
  console.log('Starting analysis...');
  isAnalyzing = true;
  analyzeBtn.disabled = true;
  
  showLoading();
  
  try {
    // This will be implemented in Phase 4
    // For now, simulate analysis
    await simulateAnalysis(text);
    
  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message || 'An error occurred during analysis');
  } finally {
    isAnalyzing = false;
  }
}

// Simulate analysis (placeholder for Phase 4 implementation)
async function simulateAnalysis(text) {
  console.log('Simulating analysis for', text.length, 'characters');
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Show placeholder results
  showResults({
    summary: 'Analysis functionality will be implemented in Phase 4',
    wordCount: text.split(/\s+/).length,
    characterCount: text.length
  });
}

// Analyze from URL (when clicking "Analyze" button in popup)
async function analyzeFromUrl(url, title = 'Policy Document') {
  console.log('Analyzing policy from URL:', url);
  
  showLoading();
  
  try {
    // Request content from background script with timeout
    const response = await Promise.race([
      chrome.runtime.sendMessage({
        type: 'ANALYZE_POLICY',
        url: url,
        title: title
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      )
    ]);
    
    console.log('Response from background:', response);
    
    if (!response) {
      throw new Error('No response from background script');
    }
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch policy content');
    }
    
    console.log('Received policy content:', response.content.length, 'characters');
    
    // Display the fetched content
    showResults({
      title: response.title,
      url: response.url,
      summary: 'Policy content fetched successfully!',
      wordCount: response.content.split(/\s+/).length,
      characterCount: response.content.length,
      fullText: response.content
    });
    
  } catch (error) {
    console.error('Error analyzing from URL:', error);
    showError(error.message);
  }
}

// Handle clear button click
function handleClear() {
  policyInput.value = '';
  analyzeBtn.disabled = true;
  chrome.storage.local.remove('manualInputDraft');
  policyInput.focus();
}

// Handle new analysis button click
function handleNewAnalysis() {
  hideAll();
  inputSection.classList.remove('hidden');
  handleClear();
}

// Show loading state
function showLoading() {
  hideAll();
  loadingSection.classList.remove('hidden');
}

// Show results
function showResults(data) {
  hideAll();
  resultsSection.classList.remove('hidden');
  
  // Build results HTML
  let html = `
    <div style="padding: 20px; background: #f5f5f5; border-radius: 6px; margin-bottom: 20px;">
      <h3 style="margin-bottom: 12px;">Analysis Complete</h3>
  `;
  
  if (data.title) {
    html += `<p><strong>Policy:</strong> ${data.title}</p>`;
  }
  
  if (data.url) {
    html += `<p><strong>URL:</strong> <a href="${data.url}" target="_blank" style="color: #1a1a1a;">${data.url}</a></p>`;
  }
  
  html += `
      <p><strong>Word Count:</strong> ${data.wordCount.toLocaleString()}</p>
      <p><strong>Character Count:</strong> ${data.characterCount.toLocaleString()}</p>
      <p style="margin-top: 16px; color: #666;">${data.summary}</p>
    </div>
  `;
  
  // Show full text if available
  if (data.fullText) {
    html += `
      <div style="padding: 20px; background: white; border: 1px solid #e5e5e5; border-radius: 6px;">
        <h4 style="margin-bottom: 12px;">Policy Text Preview (first 2000 characters)</h4>
        <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; line-height: 1.5; color: #333; max-height: 400px; overflow-y: auto;">${data.fullText.substring(0, 2000)}${data.fullText.length > 2000 ? '...\n\n[Content truncated]' : ''}</pre>
      </div>
    `;
  }
  
  resultsContent.innerHTML = html;
}

// Show error
function showError(message) {
  hideAll();
  inputSection.classList.remove('hidden');
  alert(message);
}

// Hide all sections
function hideAll() {
  inputSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
}

// Initialize when page loads
init();
