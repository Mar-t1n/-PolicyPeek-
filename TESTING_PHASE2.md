# Phase 2 Testing Guide

## Quick Start Testing (5 minutes)

### Step 1: Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `Policy-Peek V2` folder
5. ✅ Extension should load (ignore icon warnings for now)

### Step 2: Test on GitHub
1. Go to [https://github.com](https://github.com)
2. Scroll to the footer
3. **Look for 🔍 icons** next to "Privacy" and "Terms" links
4. Open browser console (F12) and check for:
   ```
   PolicyPeek content script loaded
   PolicyPeek: Found X policy links
   ```

### Step 3: Test the Notifier
1. **Click the 🔍 icon** next to "Privacy"
2. A tooltip should appear saying "Review with PolicyPeek"
3. **Click "Analyze Policy"** button
4. You should see:
   - Notification: "Analyzing policy..."
   - Console log: "PolicyPeek: Extracted XXXX characters from policy"
   - Notification: "Analysis complete!" or "Analysis will be implemented in Phase 4"

### Step 4: Test the Popup
1. Click the PolicyPeek extension icon in toolbar
2. Popup should show:
   - Loading spinner (briefly)
   - List of detected policy links with "Analyze" buttons
3. Click any "Analyze" button
4. Should trigger the same analysis flow

### Step 5: Test Rescan
1. Click "Refresh Scan" button in popup
2. Console should show: "PolicyPeek: DOM changed, rescanning..."
3. Links should refresh in popup

## Detailed Test Cases

### Test Case 1: Multiple Keywords
**Website:** [https://www.google.com](https://www.google.com)
- **Expected:** 🔍 icons next to "Privacy", "Terms", and any policy links in footer
- **Verify:** Console shows multiple links detected
- **Check:** Each link has unique notifier (no duplicates)

### Test Case 2: Hyphenated URLs
**Website:** Any site with URLs like `/privacy-policy` or `/terms-of-service`
- **Expected:** Links detected even if text doesn't match
- **Example:** Link text "Legal" with href="privacy-policy" should be detected
- **Console:** Should show "Policy link found: Legal https://..."

### Test Case 3: Dynamic Content
**Website:** Single Page Applications (SPAs) like Twitter/X
- **Expected:** Links that load after page navigation still get notifiers
- **Test:** Navigate around the site, check footer updates
- **Console:** Should see "DOM changed, rescanning..." after 1 second

### Test Case 4: Tooltip Positioning
**Test:** Click 🔍 icons at different page positions:
- Top of page
- Bottom of page
- Left edge
- Right edge
- **Expected:** Tooltip always stays within viewport, no cutoff

### Test Case 5: Click Outside Tooltip
1. Click 🔍 to open tooltip
2. Click anywhere else on page
3. **Expected:** Tooltip closes
4. **Check:** Only one tooltip visible at a time

### Test Case 6: Notification System
1. Click "Analyze Policy" on a valid link
2. **Expected Sequence:**
   - "Analyzing policy..." with loading spinner
   - After ~2 seconds: Success or error message
   - Notification auto-closes after 3 seconds
3. **Check:** Notifications appear top-right corner

### Test Case 7: Error Handling
**Test:** Click 🔍 on a link that leads to CORS-blocked or 404 page
- **Expected:** Error notification "Could not fetch policy content"
- **Console:** Should show error but not crash extension

### Test Case 8: Large Pages
**Website:** Sites with 50+ links
- **Expected:** No performance issues
- **Console:** Scan completes in < 1 second
- **Check:** Page remains responsive

## Expected Console Output

### Successful Detection:
```
PolicyPeek content script loaded
PolicyPeek: Initializing content script
PolicyPeek: Scanning for policy links...
Policy link found: Privacy Policy https://github.com/site/privacy
Policy link found: Terms https://github.com/site/terms
PolicyPeek: Found 2 policy links
PolicyPeek: MutationObserver set up with 1-second debounce
Background received message: {type: 'LINKS_DETECTED', count: 2, links: Array(2)}
```

### Successful Analysis:
```
PolicyPeek: Analyzing policy: https://github.com/site/privacy
PolicyPeek: Extracted 15234 characters from policy
Background received message: {type: 'ANALYZE_POLICY', url: '...', content: '...'}
```

## Visual Verification Checklist

| Element | Expected Appearance | Status |
|---------|-------------------|--------|
| 🔍 Notifier | Black circle, 20px, emoji visible | [ ] |
| Notifier Hover | Scales up 1.15x, turns gray | [ ] |
| Tooltip | Black gradient box, rounded corners | [ ] |
| Tooltip Arrow | Points upward to notifier | [ ] |
| Analyze Button | Black gradient, white text | [ ] |
| Button Hover | Slight lift, shadow appears | [ ] |
| Notification | Top-right corner, slides in | [ ] |
| Loading Notification | Has spinning loader icon | [ ] |
| Popup Links | List with titles, URLs, analyze buttons | [ ] |
| Link Hover | Slight movement, background darkens | [ ] |

## Common Issues & Solutions

### Issue: No 🔍 icons appearing
**Solutions:**
1. Check console for errors
2. Verify content script loaded: Look for "PolicyPeek content script loaded"
3. Try clicking extension icon - popup should list links even if icons don't show
4. Hard refresh page (Ctrl+Shift+R)

### Issue: Tooltip doesn't appear
**Solutions:**
1. Check console for JavaScript errors
2. Verify `content.css` is loaded
3. Try clicking different notifier icons
4. Check if tooltip is hidden off-screen (try scrolling)

### Issue: "Could not send message to background"
**Solutions:**
1. This is normal if background script isn't ready
2. Doesn't affect functionality
3. Message will be sent on next attempt

### Issue: Analysis shows "Phase 4" message
**Expected behavior!** Phase 4 will implement actual AI analysis.
Current phase just verifies content extraction works.

### Issue: Duplicate notifiers
**Solutions:**
1. Click "Refresh Scan" in popup
2. Reload extension (chrome://extensions/ → reload button)
3. Check console for "already processed" messages

## Performance Benchmarks

### Expected Performance:
- **Initial Scan:** < 100ms for pages with < 50 links
- **Rescan (after DOM change):** < 200ms
- **Notifier Injection:** < 5ms per link
- **Content Extraction:** 100-500ms depending on policy size
- **Memory:** < 5MB per tab

### Signs of Issues:
- ❌ Scan takes > 1 second
- ❌ Page becomes unresponsive
- ❌ Multiple rescans triggered rapidly
- ❌ Memory usage > 50MB

## Test Sites Recommendations

### ✅ Easy Testing (Clear Policy Links):
1. **GitHub** - github.com
2. **Twitter** - twitter.com  
3. **Reddit** - reddit.com
4. **Amazon** - amazon.com
5. **Microsoft** - microsoft.com

### ✅ Advanced Testing (Dynamic Content):
1. **Gmail** - mail.google.com
2. **YouTube** - youtube.com
3. **Facebook** - facebook.com
4. **LinkedIn** - linkedin.com

### ✅ Edge Cases:
1. **No policies:** blank HTML pages
2. **Many policies:** legal aggregator sites
3. **Hidden policies:** Sites with policies in modals
4. **Slow loading:** Sites with lazy-loaded footers

## Debugging Tips

### Enable Verbose Logging:
Already enabled! All `console.log()` statements will show activity.

### Check Extension Errors:
1. Go to `chrome://extensions/`
2. Click "Errors" button under PolicyPeek
3. Should be empty if working correctly

### Inspect Content Script:
1. Right-click page → Inspect
2. Console tab → Filter: "PolicyPeek"
3. Should see initialization and detection logs

### Inspect Background Script:
1. Go to `chrome://extensions/`
2. Click "service worker" link under PolicyPeek
3. Opens DevTools for background script

## Success Criteria

Phase 2 is working if:
- ✅ 🔍 icons appear on policy links
- ✅ Tooltip opens on click with correct content
- ✅ "Analyze Policy" triggers content extraction
- ✅ Notifications show analysis status
- ✅ Popup lists detected links
- ✅ Refresh/rescan works
- ✅ No console errors (warnings OK)
- ✅ No performance degradation
- ✅ Works on multiple test sites

## Next Phase Preview

**Phase 4 will add:**
- Actual AI summarization using Chrome Summarizer API
- Key points extraction using Chrome Prompt API
- Results display in popup
- Analysis history/storage
- Export functionality

**Current behavior:** System fetches and extracts content, then shows "Phase 4" message. This is expected and correct!

---

Happy testing! 🔍✨

Report any issues and let's move to Phase 4 for AI integration!
