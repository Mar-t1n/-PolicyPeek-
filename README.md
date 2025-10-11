# PolicyPeek

**A Chrome Extension for the Google Chrome Built-in AI Challenge 2025**

## Overview

PolicyPeek automatically scans webpages to detect links to privacy policies, user agreements, cookie terms, and similar legal documents. It uses Chrome's Built-in AI APIs to simplify these policies, highlight potential risks and dangerous clauses, and help users understand what they're really agreeing to before accepting terms.

## Features

- 🔍 **Automatic Link Detection** - Scans pages for privacy policy and terms of service links
- 🤖 **AI-Powered Analysis** - Uses Chrome's Built-in AI APIs to analyze policies
- ⚠️ **Risk Highlighting** - Identifies threatening or dangerous clauses
- 📝 **Plain Language Summaries** - Converts complex legal text into understandable explanations
- 📋 **Manual Analysis** - Paste any policy text for analysis
- 🔔 **Smart Notifications** - Get alerted when policy links are found

## Chrome Built-in AI APIs Used

- **Summarizer API** - Condenses lengthy policies into digestible summaries
- **Prompt API** - Analyzes text for threatening clauses and researches company data breach history
- **Writer API** - Generates user-friendly explanations of complex legal language
- **Rewriter API** - Rephrases complex sentences when necessary

## Installation

### Development Mode

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `Policy-Peek V2` folder
6. The extension is now installed and ready to use!

### Using the Extension

1. **Automatic Detection**: Browse any website, and PolicyPeek will automatically scan for policy links
2. **View Links**: Click the PolicyPeek icon in the toolbar to see detected links
3. **Analyze Policy**: Click on any detected link notifier to analyze the policy
4. **Manual Analysis**: If no links are found, use the "Analyze Policy Manually" button to paste text directly

## Project Structure

```
Policy-Peek V2/
├── manifest.json           # Extension configuration
├── icons/                  # Extension icons (16, 32, 48, 128)
├── popup/                  # Popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/                # Content script (runs on web pages)
│   ├── content.js
│   └── content.css
├── background/             # Background service worker
│   └── background.js
├── analysis/               # Manual analysis page
│   ├── analysis.html
│   ├── analysis.css
│   └── analysis.js
├── options/                # Settings page
│   ├── options.html
│   ├── options.css
│   └── options.js
└── README.md
```

## Development Status

### Phase 1: ✅ Project Setup & Manifest (Complete)
- Manifest V3 configuration
- Folder structure
- Placeholder files
- Basic UI scaffolding

### Upcoming Phases
- Phase 2: Link Detection & Notifier Injection
- Phase 3: Popup Interface & Communication
- Phase 4: AI Integration (Summarizer & Prompt APIs)
- Phase 5: Analysis Results Display
- Phase 6: Manual Analysis Page
- Phase 7: Writer & Rewriter API Integration
- Phase 8: Data Breach Research (Stretch Goal)
- Phase 9: Polish & Accessibility
- Phase 10: Testing & Bug Fixes
- Phase 11: Documentation & Submission Prep

## Technical Requirements

- Chrome Browser (version with Built-in AI APIs enabled)
- Manifest V3
- No external API dependencies (all AI processing is local)

## Privacy & Data

- All analysis happens locally using Chrome's Built-in AI
- No data is sent to external servers
- User privacy is our top priority
- Uses `chrome.storage` API for local data storage only

## Contributing

This project is being developed for the Google Chrome Built-in AI Challenge 2025. 

## License

[Your chosen license]

## Contact

[Your contact information]

---

**Note**: This extension requires Chrome's Built-in AI APIs to be enabled. These APIs are part of Chrome's experimental features and may require specific Chrome versions or flags to be enabled.
