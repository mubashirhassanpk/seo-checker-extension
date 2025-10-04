// SEO Checker by Sekhlo - Content Script
if (typeof window.PageAnalyzer === 'undefined') {
class PageAnalyzer {
  constructor() {
    this.highlights = new Map();
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'analyzePage':
          this.analyzePage().then(sendResponse);
          return true; // Keep message channel open for async response
          
        case 'getPageData':
          this.getPageData().then(sendResponse);
          return true; // Keep message channel open for async response
          
        case 'executeVisualTool':
          this.executeVisualTool(request.tool, request.active);
          sendResponse({ success: true });
          break;
          
        case 'clearHighlights':
          this.clearAllHighlights();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    });
  }

  async analyzePage() {
    try {
      const analysis = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        
        // Basic meta information
        metaTitle: this.getMetaTitle(),
        metaDescription: this.getMetaDescription(),
        canonical: this.getCanonical(),
        
        // Content analysis
        wordCount: this.getWordCount(),
        paragraphCount: this.getParagraphCount(),
        sentenceCount: this.getSentenceCount(),
        readingTime: this.calculateReadingTime(),
        avgWordLength: this.getAverageWordLength(),
        
        // Heading analysis
        headings: this.getHeadings(),
        h1Count: this.getH1Count(),
        
        // Image analysis
        images: this.getImages(),
        imageCount: this.getImageCount(),
        imagesWithAlt: this.getImagesWithAlt(),
        imagesWithoutAlt: this.getImagesWithoutAlt(),
        largeImages: this.getLargeImages(),
        
        // Link analysis
        links: this.getLinks(),
        linkCount: this.getLinkCount(),
        internalLinks: this.getInternalLinkCount(),
        externalLinks: this.getExternalLinkCount(),
        nofollowLinks: this.getNofollowLinkCount(),
        
        // Technical SEO
        technicalChecks: this.getTechnicalChecks(),
        
        // Social media tags
        socialTags: this.getSocialTags(),
        
        // Structured data
        structuredData: this.getStructuredData(),
        
        // Keywords
        keywords: this.getKeywordDensity(),
        
        // SEO factors
        seoFactors: this.getSEOFactors(),
        
        // Performance metrics
        loadTime: this.getLoadTime(),
        pageRank: this.estimatePageRank()
      };

      return { success: true, data: analysis };
    } catch (error) {
      console.error('Page analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  async getPageData() {
    try {
      const pageData = {
        url: window.location.href,
        title: document.title || '',
        content: document.body ? document.body.innerHTML : '',
        textContent: document.body ? document.body.innerText : '',
        
        // Meta information
        metaTitle: this.getMetaTitle(),
        metaDescription: this.getMetaDescription(),
        viewport: this.getViewport(),
        
        // Content analysis
        wordCount: this.getWordCount(),
        paragraphCount: this.getParagraphCount(),
        
        // Heading analysis
        headings: this.getHeadings(),
        h1Count: this.getH1Count(),
        
        // Image analysis
        images: this.getImages(),
        imageCount: this.getImageCount(),
        
        // Link analysis
        links: this.getLinks(),
        linkCount: this.getLinkCount(),
        
        // Structured data
        structuredData: this.getStructuredData(),
        
        // Technical checks
        technicalChecks: this.getTechnicalChecks()
      };

      return { success: true, data: pageData };
    } catch (error) {
      console.error('Get page data error:', error);
      return { success: false, error: error.message };
    }
  }

  getMetaTitle() {
    const titleTag = document.querySelector('title');
    return titleTag ? titleTag.textContent.trim() : '';
  }

  getMetaDescription() {
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc ? metaDesc.getAttribute('content').trim() : '';
  }

  getCanonical() {
    const canonical = document.querySelector('link[rel="canonical"]');
    return canonical ? canonical.getAttribute('href') : '';
  }

  getViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    return viewport ? viewport.getAttribute('content').trim() : '';
  }

  getWordCount() {
    const textContent = this.getPageText();
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    console.log('📊 Word Count Analysis:', {
      totalWords: words.length,
      textLength: textContent.length,
      firstWords: words.slice(0, 20).join(' '),
      lastWords: words.slice(-20).join(' ')
    });
    return words.length;
  }

  getParagraphCount() {
    return document.querySelectorAll('p').length;
  }

  getSentenceCount() {
    const textContent = this.getPageText();
    // Split by sentence endings and filter out empty strings
    const sentences = textContent.split(/[.!?]+/).filter(sentence => 
      sentence.trim().length > 0 && sentence.trim().length > 10
    );
    return sentences.length;
  }

  calculateReadingTime() {
    const wordCount = this.getWordCount();
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes}m`;
  }

  getAverageWordLength() {
    const textContent = this.getPageText();
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return words.length > 0 ? (totalLength / words.length).toFixed(1) : 0;
  }

  getPageText() {
    // Get ALL visible text content from the page
    // Clone the body to avoid modifying the actual page
    const clone = document.body.cloneNode(true);
    
    // Remove elements that shouldn't be counted
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, svg');
    elementsToRemove.forEach(el => el.remove());
    
    // Get the text content
    const text = clone.textContent || clone.innerText || '';
    
    // Clean up extra whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  getHeadings() {
    const headings = [];
    const headingTags = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingTags.forEach(heading => {
      headings.push({
        tag: heading.tagName,
        text: heading.textContent.trim(),
        level: parseInt(heading.tagName.charAt(1))
      });
    });
    
    return headings;
  }

  getH1Count() {
    return document.querySelectorAll('h1').length;
  }

  getImages() {
    const images = [];
    const imgTags = document.querySelectorAll('img');
    
    imgTags.forEach(img => {
      const rect = img.getBoundingClientRect();
      images.push({
        src: img.src,
        alt: img.alt,
        title: img.title,
        width: rect.width,
        height: rect.height,
        hasAlt: !!img.alt,
        hasTitle: !!img.title,
        isLarge: rect.width > 1000 || rect.height > 1000,
        loading: img.loading
      });
    });
    
    return images;
  }

  getImageCount() {
    return document.querySelectorAll('img').length;
  }

  getImagesWithAlt() {
    return document.querySelectorAll('img[alt]:not([alt=""])').length;
  }

  getImagesWithoutAlt() {
    return document.querySelectorAll('img:not([alt]), img[alt=""]').length;
  }

  getLargeImages() {
    const images = document.querySelectorAll('img');
    let largeCount = 0;
    
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.width > 1000 || rect.height > 1000) {
        largeCount++;
      }
    });
    
    return largeCount;
  }

  getLinks() {
    const links = [];
    const linkTags = document.querySelectorAll('a[href]');
    const currentDomain = window.location.hostname;
    
    linkTags.forEach(link => {
      const href = link.getAttribute('href');
      const url = new URL(href, window.location.href);
      const isInternal = url.hostname === currentDomain;
      const isNofollow = link.getAttribute('rel') && link.getAttribute('rel').includes('nofollow');
      
      links.push({
        url: url.href,
        text: link.textContent.trim(),
        type: isInternal ? 'internal' : 'external',
        nofollow: isNofollow,
        broken: false // Would need to check this separately
      });
    });
    
    return links;
  }

  getLinkCount() {
    return document.querySelectorAll('a[href]').length;
  }

  getInternalLinkCount() {
    const links = document.querySelectorAll('a[href]');
    const currentDomain = window.location.hostname;
    let count = 0;
    
    links.forEach(link => {
      try {
        const url = new URL(link.href, window.location.href);
        if (url.hostname === currentDomain) count++;
      } catch (e) {
        // Invalid URL
      }
    });
    
    return count;
  }

  getExternalLinkCount() {
    const links = document.querySelectorAll('a[href]');
    const currentDomain = window.location.hostname;
    let count = 0;
    
    links.forEach(link => {
      try {
        const url = new URL(link.href, window.location.href);
        if (url.hostname !== currentDomain) count++;
      } catch (e) {
        // Invalid URL
      }
    });
    
    return count;
  }

  getNofollowLinkCount() {
    return document.querySelectorAll('a[rel*="nofollow"]').length;
  }

  getTechnicalChecks() {
    const checks = [];
    
    // HTTPS check
    checks.push({
      label: 'HTTPS',
      status: window.location.protocol === 'https:' ? 'pass' : 'fail',
      value: window.location.protocol === 'https:' ? 'Secure' : 'Not secure'
    });
    
    // Viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    checks.push({
      label: 'Viewport Meta Tag',
      status: viewport ? 'pass' : 'fail',
      value: viewport ? 'Present' : 'Missing'
    });
    
    // Charset
    const charset = document.querySelector('meta[charset]') || document.querySelector('meta[http-equiv="Content-Type"]');
    checks.push({
      label: 'Character Set',
      status: charset ? 'pass' : 'fail',
      value: charset ? (charset.getAttribute('charset') || 'UTF-8') : 'Missing'
    });
    
    // Language
    const lang = document.documentElement.getAttribute('lang');
    checks.push({
      label: 'Language Declaration',
      status: lang ? 'pass' : 'warning',
      value: lang || 'Not specified'
    });
    
    // Robots meta
    const robots = document.querySelector('meta[name="robots"]');
    checks.push({
      label: 'Robots Meta Tag',
      status: robots ? 'pass' : 'warning',
      value: robots ? robots.getAttribute('content') : 'Default'
    });
    
    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    checks.push({
      label: 'Canonical URL',
      status: canonical ? 'pass' : 'warning',
      value: canonical ? 'Present' : 'Missing'
    });
    
    return checks;
  }

  getSocialTags() {
    const socialTags = {
      openGraph: {},
      twitter: {},
      facebook: {}
    };
    
    // Open Graph tags
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    ogTags.forEach(tag => {
      const property = tag.getAttribute('property').replace('og:', '');
      socialTags.openGraph[property] = tag.getAttribute('content');
    });
    
    // Twitter Card tags
    const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
    twitterTags.forEach(tag => {
      const name = tag.getAttribute('name').replace('twitter:', '');
      socialTags.twitter[name] = tag.getAttribute('content');
    });
    
    // Facebook specific tags
    const fbTags = document.querySelectorAll('meta[property^="fb:"]');
    fbTags.forEach(tag => {
      const property = tag.getAttribute('property').replace('fb:', '');
      socialTags.facebook[property] = tag.getAttribute('content');
    });
    
    return socialTags;
  }

  getStructuredData() {
    const structuredData = [];
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        structuredData.push(data);
      } catch (e) {
        console.warn('Invalid JSON-LD:', e);
      }
    });
    
    return structuredData;
  }

  getKeywordDensity() {
    const text = this.getPageText().toLowerCase();
    const words = text.split(/\s+/).filter(word => 
      word.length > 3 && 
      !/^\d+$/.test(word) && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'with'].includes(word)
    );
    
    const wordCount = {};
    const totalWords = words.length;
    
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const keywords = Object.entries(wordCount)
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / totalWords) * 100).toFixed(2)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    return keywords;
  }

  getSEOFactors() {
    const factors = [];
    const title = this.getMetaTitle();
    const description = this.getMetaDescription();
    const h1Count = this.getH1Count();
    
    // Title length
    if (title.length === 0) {
      factors.push({ label: 'Page Title', status: 'error', value: 'Missing' });
    } else if (title.length < 30) {
      factors.push({ label: 'Page Title', status: 'warning', value: 'Too Short' });
    } else if (title.length > 60) {
      factors.push({ label: 'Page Title', status: 'warning', value: 'Too Long' });
    } else {
      factors.push({ label: 'Page Title', status: 'good', value: 'Optimal' });
    }
    
    // Description length
    if (description.length === 0) {
      factors.push({ label: 'Meta Description', status: 'error', value: 'Missing' });
    } else if (description.length < 120) {
      factors.push({ label: 'Meta Description', status: 'warning', value: 'Too Short' });
    } else if (description.length > 160) {
      factors.push({ label: 'Meta Description', status: 'warning', value: 'Too Long' });
    } else {
      factors.push({ label: 'Meta Description', status: 'good', value: 'Optimal' });
    }
    
    // H1 tags
    if (h1Count === 0) {
      factors.push({ label: 'H1 Tags', status: 'error', value: 'Missing' });
    } else if (h1Count === 1) {
      factors.push({ label: 'H1 Tags', status: 'good', value: 'Perfect' });
    } else {
      factors.push({ label: 'H1 Tags', status: 'warning', value: 'Multiple' });
    }
    
    // Images without alt text
    const imagesWithoutAlt = this.getImagesWithoutAlt();
    if (imagesWithoutAlt === 0) {
      factors.push({ label: 'Image Alt Text', status: 'good', value: 'All images have alt text' });
    } else {
      factors.push({ label: 'Image Alt Text', status: 'warning', value: `${imagesWithoutAlt} missing` });
    }
    
    return factors;
  }

  getLoadTime() {
    if (performance && performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      return (loadTime / 1000).toFixed(2) + 's';
    }
    return 'Unknown';
  }

  estimatePageRank() {
    // Simple heuristic based on various factors
    let score = 50; // Base score
    
    // Adjust based on content length
    const wordCount = this.getWordCount();
    if (wordCount > 1000) score += 10;
    else if (wordCount > 500) score += 5;
    
    // Adjust based on internal links
    const internalLinks = this.getInternalLinkCount();
    if (internalLinks > 10) score += 10;
    else if (internalLinks > 5) score += 5;
    
    // Adjust based on external links
    const externalLinks = this.getExternalLinkCount();
    if (externalLinks > 0 && externalLinks < 10) score += 5;
    
    // Adjust based on images with alt text
    const imagesWithAlt = this.getImagesWithAlt();
    const totalImages = this.getImageCount();
    if (totalImages > 0 && imagesWithAlt === totalImages) score += 5;
    
    return Math.min(100, Math.max(0, score));
  }

  executeVisualTool(tool, active) {
    if (active) {
      switch (tool) {
        case 'highlightImages':
          this.highlightImages();
          break;
        case 'showAltTags':
          this.showAltTags();
          break;
        case 'highlightHeadings':
          this.highlightHeadings();
          break;
        case 'highlightNofollow':
          this.highlightNofollowLinks();
          break;
      }
    } else {
      this.removeHighlight(tool);
    }
  }

  highlightImages() {
    const images = document.querySelectorAll('img');
    const highlights = [];
    
    images.forEach((img, index) => {
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: absolute;
        border: 3px solid #ff6b6b;
        background: rgba(255, 107, 107, 0.1);
        pointer-events: none;
        z-index: 10000;
        border-radius: 4px;
      `;
      
      const rect = img.getBoundingClientRect();
      highlight.style.top = (rect.top + window.scrollY) + 'px';
      highlight.style.left = (rect.left + window.scrollX) + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';
      
      document.body.appendChild(highlight);
      highlights.push(highlight);
    });
    
    this.highlights.set('highlightImages', highlights);
  }

  showAltTags() {
    const images = document.querySelectorAll('img');
    const highlights = [];
    
    images.forEach(img => {
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10001;
        pointer-events: none;
        max-width: 200px;
        word-wrap: break-word;
      `;
      
      const altText = img.alt || 'No alt text';
      tooltip.textContent = altText;
      
      const rect = img.getBoundingClientRect();
      tooltip.style.top = (rect.top + window.scrollY - 30) + 'px';
      tooltip.style.left = (rect.left + window.scrollX) + 'px';
      
      document.body.appendChild(tooltip);
      highlights.push(tooltip);
    });
    
    this.highlights.set('showAltTags', highlights);
  }

  highlightHeadings() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const highlights = [];
    
    headings.forEach(heading => {
      const highlight = document.createElement('div');
      const level = parseInt(heading.tagName.charAt(1));
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
      
      highlight.style.cssText = `
        position: absolute;
        border: 2px solid ${colors[level - 1]};
        background: ${colors[level - 1]}20;
        pointer-events: none;
        z-index: 10000;
        border-radius: 4px;
      `;
      
      const rect = heading.getBoundingClientRect();
      highlight.style.top = (rect.top + window.scrollY) + 'px';
      highlight.style.left = (rect.left + window.scrollX) + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';
      
      document.body.appendChild(highlight);
      highlights.push(highlight);
    });
    
    this.highlights.set('highlightHeadings', highlights);
  }

  highlightNofollowLinks() {
    const nofollowLinks = document.querySelectorAll('a[rel*="nofollow"]');
    const highlights = [];
    
    nofollowLinks.forEach(link => {
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: absolute;
        border: 2px solid #e74c3c;
        background: rgba(231, 76, 60, 0.1);
        pointer-events: none;
        z-index: 10000;
        border-radius: 4px;
      `;
      
      const rect = link.getBoundingClientRect();
      highlight.style.top = (rect.top + window.scrollY) + 'px';
      highlight.style.left = (rect.left + window.scrollX) + 'px';
      highlight.style.width = rect.width + 'px';
      highlight.style.height = rect.height + 'px';
      
      document.body.appendChild(highlight);
      highlights.push(highlight);
    });
    
    this.highlights.set('highlightNofollow', highlights);
  }

  removeHighlight(tool) {
    const highlights = this.highlights.get(tool);
    if (highlights) {
      highlights.forEach(highlight => {
        if (highlight.parentNode) {
          highlight.parentNode.removeChild(highlight);
        }
      });
      this.highlights.delete(tool);
    }
  }

  clearAllHighlights() {
    this.highlights.forEach((highlights, tool) => {
      this.removeHighlight(tool);
    });
  }
}

// Initialize the page analyzer
window.PageAnalyzer = PageAnalyzer;
if (!window.pageAnalyzerInstance) {
  window.pageAnalyzerInstance = new PageAnalyzer();
}
}
