// PolicyPeek Manual Analysis Page
// Handles manual policy text input and analysis

console.log('PolicyPeek analysis page loaded');

// Chrome AI Prompt API state
let promptSession = null;
let promptAvailable = false;

// Initialize Chrome AI Prompt API
async function initializePromptAPI() {
  try {
    // Check if Prompt API is available
    if (!('LanguageModel' in self)) {
      console.warn('Chrome AI Prompt API is not available in this browser');
      console.log('Make sure you are using Chrome 138+ and have enabled AI features');
      promptAvailable = false;
      return false;
    }

    console.log('Prompt API detected, checking availability...');
    const availability = await self.LanguageModel.availability();
    console.log('Prompt API availability:', availability);

    if (availability === 'no' || availability === 'unavailable') {
      console.warn('Prompt API is not available on this device');
      promptAvailable = false;
      return false;
    }

    if (availability === 'after-download' || availability === 'downloading' || availability === 'downloadable') {
      console.log('Gemini Nano model needs to be downloaded first...');
      // Show download progress to user
      showModelDownload();
    }

    // Create prompt session with simple default options
    console.log('Creating Prompt API session...');
    
    // Use minimal options - let Chrome use its own defaults
    promptSession = await self.LanguageModel.create({
      systemPrompt: 'You are a helpful AI assistant specialized in analyzing privacy policies and terms of service documents. Provide clear, concise summaries that highlight key points about data collection, user rights, and important terms. Search for potential safety risks that are being hidden by fancy wording and provide the results in small bullet points for easy reading.',
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const progress = Math.round(e.loaded * 100);
          console.log(`Gemini Nano model download progress: ${progress}%`);
          updateDownloadProgress(progress);
        });
      }
    });

    promptAvailable = true;
    console.log('✅ Prompt API initialized successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error initializing Prompt API:', error);
    console.error('Error details:', error.message, error.stack);
    promptAvailable = false;
    return false;
  }
}

// Show model download UI
function showModelDownload() {
  const loadingText = document.querySelector('#loading-section p');
  if (loadingText) {
    loadingText.innerHTML = `
      <strong>Downloading AI model...</strong><br>
      <span id="download-progress">Preparing download...</span>
    `;
  }
}

// Update download progress UI
function updateDownloadProgress(progress) {
  const progressElement = document.getElementById('download-progress');
  if (progressElement) {
    progressElement.textContent = `Download progress: ${progress}%`;
  }
}

// Truncate text if it exceeds reasonable limits
function truncateTextForPrompt(text, maxChars = 8000) {
  if (text.length <= maxChars) {
    return text;
  }
  
  console.log(`Text is ${text.length} chars, truncating to ${maxChars} chars for analysis`);
  
  // Try to truncate at a sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const cutoff = Math.max(lastPeriod, lastNewline);
  
  if (cutoff > maxChars * 0.8) {
    // Found a good cutoff point
    return truncated.substring(0, cutoff + 1);
  }
  
  // Just hard truncate
  return truncated + '...';
}

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
async function init() {
  console.log('Initializing analysis page...');
  setupEventListeners();
  
  // Check for URL parameters (auto-analysis from popup)
  const urlParams = new URLSearchParams(window.location.search);
  const policyUrl = urlParams.get('url');
  const policyTitle = urlParams.get('title');
  
  if (policyUrl) {
    // Show loading immediately for URL analysis
    showLoading();
    
    // Initialize Chrome AI Prompt API and WAIT for it
    console.log('URL analysis requested - initializing AI first...');
    await initializePromptAPI().catch(err => {
      console.error('Failed to initialize Prompt API:', err);
    });
    console.log('AI initialization complete, proceeding with analysis...');
    
    // Now analyze from URL with AI ready
    analyzeFromUrl(policyUrl, policyTitle);
  } else {
    // Initialize Chrome AI Prompt API in the background for manual input
    initializePromptAPI().catch(err => {
      console.error('Failed to initialize Prompt API:', err);
    });
    
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
    // Ensure AI is initialized if not already
    if (!promptAvailable && !promptSession) {
      console.log('AI not yet initialized, initializing now...');
      await initializePromptAPI().catch(err => {
        console.error('Failed to initialize Prompt API:', err);
      });
    }
    
    // Perform AI-powered analysis
    await analyzePolicy(text);
    
  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message || 'An error occurred during analysis');
  } finally {
    isAnalyzing = false;
  }
}

// Analyze policy text with Chrome AI Prompt API
async function analyzePolicy(text) {
  console.log('Analyzing policy text:', text.length, 'characters');
  
  let summary = null;
  let usedAI = false;
  let wasTruncated = false;
  
  // Try to use Chrome AI Prompt API if available
  if (promptAvailable && promptSession) {
    try {
      console.log('Using Chrome AI Prompt API...');
      console.log('Prompt session:', promptSession);
      
      // Truncate text if too large (be reasonable with prompt length)
      let textToAnalyze = text;
      if (text.length > 8000) {
        textToAnalyze = truncateTextForPrompt(text, 8000);
        wasTruncated = true;
        console.log(`⚠️ Text truncated from ${text.length} to ${textToAnalyze.length} characters`);
      }
      
      // Create a detailed prompt for policy analysis
      const prompt = `Please analyze this privacy policy or terms of service document and provide:

1. **Key Points**: The most important things users should know
2. **Data Collection**: What personal data is collected
3. **Data Usage**: How the data is used
4. **Third-Party Sharing**: If and how data is shared with others
5. **User Rights**: What rights users have regarding their data
6. **Notable Concerns**: Any concerning or unusual terms

Keep the summary clear and concise. Use bullet points for readability.

Document to analyze:
${textToAnalyze}`;
      
      console.log('Sending prompt to AI...');
      
      // Use prompt() for complete response with language specification
      summary = await promptSession.prompt(prompt, {
        outputLanguage: 'en'  // Specify output language to avoid warnings
      });
      
      // Add truncation notice if text was cut
      if (wasTruncated) {
        summary = `*Note: This policy was very long (${text.length.toLocaleString()} characters), so only the first section was analyzed.*\n\n` + summary;
      }
      
      usedAI = true;
      console.log('✅ AI Analysis generated successfully');
      console.log('Summary preview:', summary.substring(0, 200));
      
    } catch (error) {
      console.error('❌ AI Analysis failed:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.log('Falling back to basic analysis...');
      summary = null;
      usedAI = false;
    }
  } else {
    console.log('Chrome AI Prompt API not available');
    console.log('promptAvailable:', promptAvailable);
    console.log('promptSession:', promptSession);
  }
  
  // If AI failed or unavailable, create basic summary
  if (!summary) {
    console.log('Creating basic summary...');
    summary = createBasicSummary(text);
  }
  
  // Show results
  showResults({
    summary: summary,
    wordCount: text.split(/\s+/).length,
    characterCount: text.length,
    fullText: text,
    usedAI: usedAI
  });
}

// Create basic summary without AI (fallback)
function createBasicSummary(text) {
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let summary = '**Basic Analysis:**\n\n';
  summary += `- Document contains ${wordCount} words across ${sentences.length} sentences\n`;
  summary += `- Average sentence length: ${Math.round(wordCount / sentences.length)} words\n`;
  
  // Look for common privacy policy keywords
  const keywords = {
    'data collection': /collect|gathering|obtain/gi,
    'personal information': /personal\s+information|personal\s+data/gi,
    'cookies': /cookie/gi,
    'third party': /third[\s-]party/gi,
    'sharing': /share|sharing|disclose/gi,
    'rights': /rights|access|delete|opt[\s-]out/gi
  };
  
  summary += '\n**Key Topics Detected:**\n';
  for (const [topic, pattern] of Object.entries(keywords)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      summary += `- ${topic.charAt(0).toUpperCase() + topic.slice(1)}: mentioned ${matches.length} time(s)\n`;
    }
  }
  
  summary += '\n*Note: Chrome AI Prompt API is not available. Install Chrome 138+ for AI-powered analysis.*';
  
  return summary;
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
    
    // Analyze the fetched content with AI
    await analyzePolicy(response.content);
    
    // Note: The results will be shown by analyzePolicy function
    // but we can add the URL and title info
    const currentResults = resultsContent.innerHTML;
    resultsContent.innerHTML = `
      <div style="padding: 20px; background: #e3f2fd; border-radius: 6px; margin-bottom: 20px;">
        <p><strong>Policy:</strong> ${response.title}</p>
        <p><strong>URL:</strong> <a href="${response.url}" target="_blank" style="color: #1976d2;">${response.url}</a></p>
      </div>
    ` + currentResults;
    
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
  let html = '';
  
  // AI status badge
  if (data.usedAI !== undefined) {
    const badgeColor = data.usedAI ? '#4caf50' : '#ff9800';
    const badgeText = data.usedAI ? '✓ AI-Powered Analysis' : '⚠ Basic Analysis';
    html += `
      <div style="display: inline-block; padding: 6px 12px; background: ${badgeColor}; color: white; border-radius: 4px; margin-bottom: 16px; font-size: 13px; font-weight: 600;">
        ${badgeText}
      </div>
    `;
  }
  
  // Summary section
  html += `
    <div style="padding: 20px; background: #f5f5f5; border-radius: 6px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 16px 0; color: #1a1a1a;">Summary</h3>
      <div style="line-height: 1.8; color: #333;">${formatSummary(data.summary)}</div>
    </div>
  `;
  
  // Statistics section
  html += `
    <div style="padding: 20px; background: white; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #1a1a1a;">Statistics</h3>
      <p style="margin: 8px 0;"><strong>Word Count:</strong> ${data.wordCount.toLocaleString()}</p>
      <p style="margin: 8px 0;"><strong>Character Count:</strong> ${data.characterCount.toLocaleString()}</p>
      <p style="margin: 8px 0;"><strong>Estimated Reading Time:</strong> ${Math.ceil(data.wordCount / 200)} minutes</p>
    </div>
  `;
  
  // Show full text if available
  if (data.fullText) {
    html += `
      <div style="padding: 20px; background: white; border: 1px solid #e5e5e5; border-radius: 6px;">
        <h4 style="margin: 0 0 12px 0; color: #1a1a1a;">Full Policy Text</h4>
        <details>
          <summary style="cursor: pointer; color: #1976d2; font-weight: 600; margin-bottom: 12px;">Click to show/hide full text</summary>
          <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 12px; line-height: 1.6; color: #333; max-height: 500px; overflow-y: auto; background: #fafafa; padding: 16px; border-radius: 4px; margin-top: 12px;">${escapeHtml(data.fullText)}</pre>
        </details>
      </div>
    `;
  }
  
  resultsContent.innerHTML = html;
}

// Format summary text (convert markdown to HTML)
function formatSummary(text) {
  if (!text) return '';
  
  // Convert markdown-style formatting to HTML
  let formatted = text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  // Wrap list items in ul tags
  if (formatted.includes('<li>')) {
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul style="margin: 12px 0; padding-left: 24px;">$1</ul>');
  }
  
  return formatted;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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