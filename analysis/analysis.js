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
  checkForSavedInput();
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
  
  // Display results (placeholder)
  resultsContent.innerHTML = `
    <div style="padding: 20px; background: #f5f5f5; border-radius: 6px;">
      <h3 style="margin-bottom: 12px;">Analysis Complete</h3>
      <p><strong>Word Count:</strong> ${data.wordCount}</p>
      <p><strong>Character Count:</strong> ${data.characterCount}</p>
      <p style="margin-top: 16px; color: #666;">${data.summary}</p>
    </div>
  `;
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
