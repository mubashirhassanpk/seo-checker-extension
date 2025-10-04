# SEO Checker by Sekhlo

A comprehensive Chrome extension that combines the best features from multiple SEO analysis tools into one powerful, beautiful interface.

## Features

### 🔍 **Comprehensive Page Analysis**
- **Meta Tags Analysis**: Title, description, canonical URLs
- **Content Metrics**: Word count, reading time, paragraph analysis
- **Heading Structure**: H1-H6 tag analysis and hierarchy visualization
- **Image Optimization**: Alt text analysis, large image detection
- **Link Analysis**: Internal/external links, nofollow detection

### ⚡ **Technical SEO Audit**
- **HTTPS Security Check**
- **Viewport Meta Tag Validation**
- **Character Set Detection**
- **Robots Meta Tag Analysis**
- **Canonical URL Verification**

### 📊 **SEO Scoring System**
- Real-time SEO score calculation (0-100)
- Animated score visualization
- Factor-based scoring with detailed breakdown
- Performance recommendations

### 🎨 **Visual Analysis Tools**
- **Highlight Images**: Visual overlay on all page images
- **Show Alt Tags**: Display alt text tooltips
- **Highlight Headings**: Color-coded heading structure
- **Highlight Nofollow Links**: Identify nofollow links

### 🏆 **Competitor Analysis**
- Compare your site against competitors
- Keyword density comparison
- Performance metrics analysis
- Actionable recommendations

### 🌐 **Social Media Optimization**
- Open Graph tags analysis
- Twitter Card validation
- Facebook-specific tags
- Social sharing optimization

### 📈 **Structured Data Detection**
- JSON-LD schema markup detection
- Structured data validation
- Rich snippet optimization

### 🔤 **Keyword Analysis**
- Top keyword extraction
- Keyword density calculation
- Content optimization suggestions
- **🤖 AI-Powered Keywords**: Extract relevant keywords using Perplexity AI
  - Primary keywords (single words and short phrases)
  - Long-tail keywords (longer phrases for targeted traffic)
  - Semantic keywords (related terms and synonyms)
  - Click-to-search functionality

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## Usage

### Basic Analysis
1. Navigate to any webpage
2. Click the SEO Checker by Sekhlo icon
3. The extension will automatically analyze the page
4. View results across different tabs (Overview, Technical, Content, Links, Images)

### Visual Tools
1. Go to the Images tab
2. Click on visual tools like "Highlight Images" or "Show Alt Tags"
3. The page will be overlaid with visual indicators
4. Use "Clear Highlights" to remove all visual overlays

### Competitor Analysis
1. Navigate to the Competitor tab
2. Enter a competitor's URL
3. Add target keywords (comma-separated)
4. Click "Analyze Competitor"
5. View side-by-side comparison results

### AI Keywords Setup & Usage
1. **Setup**: Click the ⚙️ settings icon in the footer
2. Enter your Perplexity AI API key (get one from [Perplexity AI Settings](https://www.perplexity.ai/settings/api))
3. Click Save
4. **Usage**: Navigate to any webpage, go to the Content tab, and click "AI Keywords"
5. View categorized keywords and click any keyword to search for it on Google

### Export Reports
1. After analyzing a page, click the export button in the header
2. A JSON report will be downloaded with all analysis data
3. Use this for reporting or further analysis

## Technical Details

### Architecture
- **Manifest V3** compliance for modern Chrome extensions
- **Content Script**: Analyzes page content and DOM
- **Background Script**: Handles data storage and cross-tab communication
- **Popup Interface**: Beautiful, responsive UI with tabbed navigation

### Permissions
- `activeTab`: Access to current tab for analysis
- `scripting`: Inject content scripts for page analysis
- `storage`: Save analysis history and user preferences
- `host_permissions`: Access to all URLs for comprehensive analysis

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Features

- Detailed meta tag analysis
- Heading structure visualization
- Image and link statistics
- Social media tag detection
- Visual highlighting tools
- Comprehensive SEO scoring
- Technical audit checks
- Performance metrics
- Content analysis
- Export functionality
- Quick SEO scoring interface
- Tabbed navigation
- Analysis history
- Clean, modern UI
- Competitor comparison tools
- Keyword analysis
- Performance benchmarking
- Recommendation engine

## Development

### File Structure
```
SEO Checker by Sekhlo/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Styling and animations
├── popup.js              # Popup functionality
├── content.js            # Page analysis logic
├── background.js         # Background service worker
├── icons/                # Extension icons
└── README.md             # This file
```

### Customization
The extension is highly customizable through:
- CSS variables for theming
- Internationalization support
- Configurable analysis parameters
- Extensible scoring algorithms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project combines features from multiple SEO analysis tools and is intended for educational and development purposes.

## Support

For issues or feature requests, please create an issue in the repository.

---

**SEO Checker by Sekhlo** - The most comprehensive SEO analysis tool for Chrome, combining the best features from multiple extensions into one powerful, beautiful interface.
