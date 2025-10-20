# Testing Guide: Phase 4 - Chrome AI Summarizer

## Prerequisites

### Chrome Version Check
1. Open Chrome and go to `chrome://version`
2. Check that version is **138 or higher**
3. If not, update Chrome or use Chrome Canary/Dev

### Hardware Check
1. Go to `chrome://on-device-internals`
2. Check Gemini Nano status
3. Verify storage availability (22 GB+ free)
4. Check hardware requirements met

## Test Suite

### Test 1: Feature Detection ✅

**Steps:**
1. Load the extension in Chrome
2. Open analysis page (`analysis/analysis.html`)
3. Open DevTools Console (F12)
4. Look for initialization messages

**Expected Output:**
```
PolicyPeek analysis page loaded
Initializing analysis page...
Summarizer availability: [ready/downloadable/unavailable]
Summarizer initialized successfully
```

**Pass Criteria:**
- No JavaScript errors
- Summarizer status logged correctly
- Page loads without issues

---

### Test 2: Manual Text Analysis (AI Mode) 🤖

**Steps:**
1. Open `analysis/analysis.html`
2. Paste the following sample privacy policy:

```
Privacy Policy

Last Updated: October 2025

We collect personal information including your name, email address, phone number, and location data when you use our services. This information is used to provide and improve our services.

We share your information with third-party service providers, advertising partners, and analytics companies. These partners may use cookies and similar technologies to track your behavior across websites.

You have the right to access, modify, or delete your personal data at any time. To exercise these rights, contact us at privacy@example.com.

We use cookies to enhance your experience, personalize content, and analyze traffic. You can opt out of cookies through your browser settings.

Your data is stored on secure servers and protected using industry-standard encryption. We retain your data for as long as necessary to provide our services.
```

3. Click "Analyze Policy" button
4. Wait for analysis to complete

**Expected Result:**
- ✅ Green badge appears: "✓ AI-Powered Analysis"
- ✅ Summary contains 5 bullet points (medium length)
- ✅ Key points about data collection, sharing, cookies mentioned
- ✅ Statistics show word count, character count, reading time
- ✅ Full text is collapsible and viewable

**Pass Criteria:**
- AI summary is relevant and accurate
- Formatting is clean (bullet points visible)
- No errors in console

---

### Test 3: Manual Text Analysis (Fallback Mode) ⚠️

**Prerequisites:**
- Use Chrome < 138, OR
- Disable Gemini Nano in `chrome://flags`

**Steps:**
1. Open `analysis/analysis.html`
2. Paste the same sample policy from Test 2
3. Click "Analyze Policy"

**Expected Result:**
- ⚠️ Orange badge: "⚠ Basic Analysis"
- ✅ Summary shows keyword detection
- ✅ Topics detected: "data collection", "cookies", "third party", etc.
- ✅ Note at bottom: "Chrome AI Summarizer is not available. Install Chrome 138+..."
- ✅ Statistics still displayed correctly

**Pass Criteria:**
- Fallback works without errors
- Keywords detected accurately
- User informed about missing AI

---

### Test 4: URL-Based Analysis 🌐

**Steps:**
1. Navigate to a website with privacy policy (e.g., google.com/policies/privacy)
2. Click PolicyPeek extension icon
3. Extension popup should show "Privacy Policy detected"
4. Click "Analyze" button in popup
5. New tab opens with analysis page

**Expected Result:**
- ✅ Policy content fetched successfully
- ✅ URL and title displayed at top
- ✅ AI summary generated (if AI available)
- ✅ Full text preview available
- ✅ No timeout errors

**Pass Criteria:**
- Background script fetches content
- Analysis page receives data
- AI summarization works on fetched content

---

### Test 5: Model Download Progress 📥

**Prerequisites:**
- Clear Chrome data to force re-download: `chrome://on-device-internals`
- Or use fresh Chrome profile

**Steps:**
1. Open `analysis/analysis.html`
2. Paste policy text
3. Click "Analyze Policy"
4. Watch loading section

**Expected Result:**
- ✅ Loading message: "Downloading AI model..."
- ✅ Progress updates: "Download progress: 25%", "50%", "75%"
- ✅ Console logs show download progress
- ✅ Analysis proceeds after download completes

**Pass Criteria:**
- Progress percentage increases
- No download errors
- Model persists for future use

---

### Test 6: Different Text Lengths 📏

**Test 6a: Short Text (<3000 chars)**
- Paste 500-word policy
- Verify summary length = "short" (3 bullet points)

**Test 6b: Medium Text (3000-8000 chars)**
- Paste 1500-word policy
- Verify summary length = "medium" (5 bullet points)

**Test 6c: Long Text (>8000 chars)**
- Paste 3000+ word policy
- Verify summary length = "long" (7 bullet points)

**Pass Criteria:**
- Summary length adapts to text size
- All lengths produce quality summaries

---

### Test 7: Error Handling ❌

**Test 7a: Empty Input**
1. Open analysis page
2. Click "Analyze Policy" with empty textarea
3. Expected: Alert "Please paste some policy text to analyze."

**Test 7b: API Timeout**
1. Simulate slow API (modify code to add delay)
2. Verify timeout error handled gracefully

**Test 7c: AI Initialization Failure**
1. Force API error (Chrome version too low)
2. Verify fallback to basic analysis

**Pass Criteria:**
- User-friendly error messages
- No unhandled exceptions
- Graceful degradation

---

### Test 8: UI/UX Elements 🎨

**Steps:**
1. Analyze a policy
2. Check all UI elements

**Verify:**
- ✅ AI status badge (green or orange)
- ✅ Summary section with 📋 icon
- ✅ Statistics section with 📊 icon
- ✅ Full text section with 📄 icon
- ✅ Collapsible details element works
- ✅ "New Analysis" button returns to input
- ✅ Responsive layout (resize window)

**Pass Criteria:**
- All icons display
- Colors correct
- Layout not broken
- Interactive elements functional

---

### Test 9: Console Logging 📝

**Steps:**
1. Open DevTools
2. Perform various actions
3. Monitor console output

**Expected Logs:**
```
PolicyPeek analysis page loaded
Initializing analysis page...
Summarizer availability: ready
Summarizer initialized successfully
Starting analysis...
Analyzing policy text: 1234 characters
Using Chrome AI Summarizer...
AI Summary generated successfully
```

**Pass Criteria:**
- Informative logs at each step
- Errors logged with details
- No unexpected warnings

---

### Test 10: Cross-Browser Compatibility 🌍

**Test on:**
- ✅ Chrome 138+ (should work with AI)
- ✅ Chrome <138 (fallback mode)
- ⚠️ Edge (check Summarizer API support)
- ❌ Firefox (expected to use fallback)
- ❌ Safari (expected to use fallback)

**Pass Criteria:**
- Extension loads in all browsers
- AI works where supported
- Fallback works where not supported
- No browser-specific errors

---

## Integration Tests

### Test 11: Storage Integration 💾

**Steps:**
1. Paste policy in manual input
2. Type some text
3. Close tab without analyzing
4. Reopen analysis page

**Expected:**
- Draft text restored in textarea
- No data loss

### Test 12: Background Script Communication 📡

**Steps:**
1. Click "Analyze" on a policy page
2. Check background script logs
3. Verify message passing

**Expected:**
- `ANALYZE_POLICY` message sent
- Background fetches content
- Content returned to analysis page
- No timeout errors

---

## Performance Tests

### Test 13: Speed ⚡

**Measure:**
- Time to initialize API: < 2 seconds
- Time to analyze 1000 words: < 5 seconds
- Time to analyze 5000 words: < 10 seconds

### Test 14: Memory Usage 💾

**Steps:**
1. Open Chrome Task Manager (Shift+Esc)
2. Run multiple analyses
3. Monitor extension memory

**Expected:**
- Memory usage < 100 MB
- No memory leaks over time

---

## Regression Tests

### Test 15: Phase 2 Features Still Work ✅

Verify Phase 2 functionality:
- ✅ Content script detects policies
- ✅ Popup shows detection status
- ✅ Badge updates correctly
- ✅ Detection toggle works

### Test 16: Phase 3 Features Still Work ✅

Verify Phase 3 functionality:
- ✅ Manual analysis page loads
- ✅ Background script fetches content
- ✅ Input/Clear buttons work
- ✅ URL parameters handled

---

## Acceptance Criteria Summary

**Phase 4 is considered complete when:**

1. ✅ Chrome AI Summarizer API integrated
2. ✅ Feature detection works correctly
3. ✅ AI summaries generated successfully (Chrome 138+)
4. ✅ Fallback analysis works (other browsers)
5. ✅ Model download tracked and displayed
6. ✅ Summary formatting renders properly
7. ✅ All UI elements functional
8. ✅ No JavaScript errors
9. ✅ Previous phases still functional
10. ✅ Documentation complete

---

## Bug Reporting Template

If you find issues, report using this format:

```
**Bug Title:** [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Environment:**
- Chrome Version: 
- OS: 
- AI API Available: Yes/No

**Console Errors:**
[Paste any console errors]

**Screenshots:**
[Attach if relevant]
```

---

## Sample Test Policies

### Sample 1: Short Policy (for testing short summaries)
```
Cookie Policy

We use cookies to improve your experience. Cookies help us remember your preferences and analyze site traffic. You can disable cookies in your browser settings. By continuing to use our site, you consent to our use of cookies.
```

### Sample 2: Medium Policy (for testing medium summaries)
```
Data Collection Notice

We collect various types of information:
- Personal identifiers (name, email, phone)
- Usage data (pages viewed, time spent)
- Device information (browser type, IP address)
- Location data (GPS coordinates)

This data helps us provide personalized services and improve our platform. We may share this information with trusted partners for analytics and advertising purposes. You can request data deletion at any time by contacting support@example.com.

We use industry-standard security measures to protect your data, including encryption and secure servers. However, no method of transmission is 100% secure.
```

### Sample 3: Long Policy (for testing long summaries)
[Use any real privacy policy from Google, Facebook, or similar - 2000+ words]

---

**Testing Status:** Ready for Phase 4 validation  
**Last Updated:** October 20, 2025
