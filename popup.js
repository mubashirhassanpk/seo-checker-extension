// SEO Checker by Sekhlo - Popup Script
class UltimateSEOAnalyzer {
  constructor() {
    this.currentTab = 'overview';
    this.currentLinkType = 'internal';
    this.analysisData = null;
    this.competitorData = null;
    this.isAnalyzing = false;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupTabs();
    this.startAnalysis();
  }





  setupEventListeners() {
    // Header actions
    document.getElementById('history-btn').addEventListener('click', () => this.showHistory());
    document.getElementById('refresh-btn').addEventListener('click', () => this.refreshAnalysis());
    document.getElementById('export-btn').addEventListener('click', () => this.exportReport());
    
    // History modal events
    document.getElementById('close-history-modal').addEventListener('click', () => this.hideHistory());
    document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());
    
    // Close modal when clicking outside
    document.getElementById('history-modal').addEventListener('click', (e) => {
      if (e.target.id === 'history-modal') {
        this.hideHistory();
      }
    });

    // Link tabs
    document.querySelectorAll('.link-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.link-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentLinkType = e.target.dataset.linkType;
        this.displayLinks();
      });
    });

    // Visual tools
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = e.currentTarget.dataset.tool;
        this.executeVisualTool(tool, e.currentTarget);
      });
    });

    // GEO analysis
    document.getElementById('analyze-geo').addEventListener('click', () => this.analyzeGEO());

    // API Settings button - opens the new modal at the bottom of the page
    // The new modal is handled by separate code at the end of this file
    

    // Copy headings button
    document.getElementById('copy-headings').addEventListener('click', () => this.copyHeadings());
    
    // Copy keywords button
    document.getElementById('copy-keywords').addEventListener('click', () => this.copyKeywords());
    
    // AI keywords button
    document.getElementById('get-ai-keywords').addEventListener('click', () => {
      console.log('🎯 AI Keywords button clicked!');
      this.getAIKeywords();
    });
    
    // AI improve headings button
    document.getElementById('improve-headings').addEventListener('click', () => {
      console.log('🎯 Improve Headings button clicked!');
      this.improveHeadings();
    });
    
    // AI improve meta tags button
    document.getElementById('improve-meta').addEventListener('click', () => {
      console.log('🎯 Improve Meta button clicked!');
      this.improveMeta();
    });
    
    // Check SEO files buttons
    document.getElementById('check-robots').addEventListener('click', () => this.checkRobotsFile());
    document.getElementById('check-sitemap').addEventListener('click', () => this.checkSitemapFile());
    document.getElementById('check-llms').addEventListener('click', () => this.checkLLMSFile());
    document.getElementById('check-all-files').addEventListener('click', () => this.checkAllSEOFiles());
    document.getElementById('generate-llms').addEventListener('click', () => this.generateLLMSTxt());
    
    // Structured data toggle button
    document.getElementById('toggle-structured-data').addEventListener('click', () => this.toggleStructuredDataView());
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const self = this; // Preserve context

    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        const targetTab = tab.dataset.tab;
        
        console.log('🔄 Tab clicked:', targetTab);
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        tabContents.forEach(content => {
          content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
        }
        
        self.currentTab = targetTab;
        
        // Handle domain tab specifically
        if (targetTab === 'domain') {
          console.log('🌐 Domain tab clicked! Running analysis...');
          setTimeout(async () => {
            await self.runDomainAnalysis();
          }, 300);
        }
        
        // Load tab-specific data
        self.loadTabData(targetTab);
      });
    });
  }

  async loadTabData(tabName) {
    console.log('📑 Loading tab data for:', tabName);
    
    // Handle domain tab
    if (tabName === 'domain') {
      console.log('🌐 Domain tab activated!');
      
      // IMMEDIATE: Run domain analysis without waiting
      this.runDomainAnalysis();
    }
  }
  
  async runDomainAnalysis() {
    console.log('🚀 Running domain analysis...');
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url) {
        console.error('❌ No active tab found');
        return;
      }
      
      console.log('📍 Current tab URL:', tab.url);
      
      if (!window.domainInspector) {
        console.error('❌ DomainInspector not initialized');
        console.log('Creating DomainInspector now...');
        window.domainInspector = new DomainInspector();
      }
      
      console.log('✅ Starting domain analysis for:', tab.url);
      await window.domainInspector.analyzeDomain(tab.url);
      
      console.log('🎉 Domain analysis complete!');
      
    } catch (error) {
      console.error('❌ Domain analysis failed:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  async startAnalysis() {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    this.showLoading(true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script if needed
      await this.ensureContentScript(tab.id);
      
      // Get page analysis
      const response = await this.sendMessageToTab(tab.id, { action: 'analyzePage' });
      
      if (response && response.success) {
        this.analysisData = response.data;
        this.displayAnalysis();
        this.updateSEOScore();
      } else {
        this.showError('Failed to analyze page');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('Error analyzing page: ' + error.message);
    } finally {
      this.isAnalyzing = false;
      this.showLoading(false);
    }
  }

  async ensureContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    } catch (error) {
      console.log('Content script already injected or error:', error);
    }
  }

  sendMessageToTab(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  displayAnalysis() {
    if (!this.analysisData) return;

    const data = this.analysisData;
    
    // Save to history (async, don't wait)
    const seoScore = this.calculateSEOScore();
    this.saveToHistory(data, seoScore).catch(error => {
      console.error('Failed to save to history:', error);
    });

    // Update basic info
    this.updateElement('meta-title', data.metaTitle || 'No title found');
    this.updateElement('meta-description', data.metaDescription || 'No description found');
    this.updateElement('title-length', `${(data.metaTitle || '').length} chars`);
    this.updateElement('desc-length', `${(data.metaDescription || '').length} chars`);

    // Update metrics with better formatting
    const wordCount = data.wordCount || 0;
    this.updateElement('word-count', wordCount.toLocaleString()); // Format with commas
    this.updateElement('h1-count', data.h1Count || 0);
    this.updateElement('image-count', data.imageCount || 0);
    this.updateElement('link-count', data.linkCount || 0);
    
    console.log('📝 Total Words on Page:', wordCount);

    // Update quick metrics
    this.updateElement('page-rank', data.pageRank || '--');
    this.updateElement('load-time', data.loadTime || '--');
    this.updateElement('total-links', data.linkCount || 0);

    // Update link stats
    this.updateElement('internal-links', data.internalLinks || 0);
    this.updateElement('external-links', data.externalLinks || 0);
    this.updateElement('nofollow-links', data.nofollowLinks || 0);

    // Update image stats
    this.updateElement('total-images', data.imageCount || 0);
    this.updateElement('images-with-alt', data.imagesWithAlt || 0);
    this.updateElement('images-without-alt', data.imagesWithoutAlt || 0);
    this.updateElement('large-images', data.largeImages || 0);

    // Update content metrics
    this.updateElement('reading-time', data.readingTime || '--');
    this.updateElement('avg-word-length', data.avgWordLength ? `${data.avgWordLength} chars` : '--');
    this.updateElement('paragraph-count', data.paragraphCount || 0);
    this.updateElement('sentence-count', data.sentenceCount || 0);
    
    // Make sure word count is prominently displayed
    console.log('📊 Content Metrics:', {
      wordCount: data.wordCount,
      readingTime: data.readingTime,
      avgWordLength: data.avgWordLength,
      paragraphs: data.paragraphCount,
      sentences: data.sentenceCount
    });

    // Display complex data
    this.displaySEOFactors(data.seoFactors || []);
    this.displayTechnicalChecks(data.technicalChecks || []);
    this.displayHeadingStructure(data.headings || []);
    this.displayKeywords(data.keywords || []);
    this.displayLinks();
    this.displayImages(data.images || []);
    this.displaySocialTags(data.socialTags || {});
    this.displayStructuredData(data.structuredData);
  }

  updateSEOScore() {
    if (!this.analysisData) return;

    const score = this.calculateSEOScore();
    const scoreElement = document.getElementById('seo-score');
    const progressElement = document.getElementById('score-progress');
    const statusElement = document.getElementById('score-status');

    // Animate score
    this.animateScore(scoreElement, score);
    
    // Update progress circle
    const circumference = 2 * Math.PI * 50; // radius = 50
    const offset = circumference - (score / 100) * circumference;
    progressElement.style.strokeDashoffset = offset;

    // Update status
    let status = 'Poor';
    if (score >= 80) status = 'Excellent';
    else if (score >= 60) status = 'Good';
    else if (score >= 40) status = 'Fair';

    statusElement.textContent = status;
  }

  calculateSEOScore() {
    if (!this.analysisData) return 0;

    const data = this.analysisData;
    let score = 0;
    let maxScore = 0;

    // Title (20 points)
    maxScore += 20;
    if (data.metaTitle) {
      const titleLength = data.metaTitle.length;
      if (titleLength >= 30 && titleLength <= 60) score += 20;
      else if (titleLength > 0) score += 10;
    }

    // Description (20 points)
    maxScore += 20;
    if (data.metaDescription) {
      const descLength = data.metaDescription.length;
      if (descLength >= 120 && descLength <= 160) score += 20;
      else if (descLength > 0) score += 10;
    }

    // H1 tags (15 points)
    maxScore += 15;
    if (data.h1Count === 1) score += 15;
    else if (data.h1Count > 0) score += 8;

    // Images with alt (15 points)
    maxScore += 15;
    if (data.imageCount > 0) {
      const altRatio = (data.imagesWithAlt || 0) / data.imageCount;
      score += Math.round(altRatio * 15);
    } else {
      score += 15; // No images is fine
    }

    // Content length (10 points)
    maxScore += 10;
    if (data.wordCount >= 300) score += 10;
    else if (data.wordCount >= 100) score += 5;

    // Internal links (10 points)
    maxScore += 10;
    if (data.internalLinks >= 3) score += 10;
    else if (data.internalLinks > 0) score += 5;

    // Technical factors (10 points)
    maxScore += 10;
    if (data.technicalChecks) {
      const passedChecks = data.technicalChecks.filter(check => check.status === 'pass').length;
      const totalChecks = data.technicalChecks.length;
      if (totalChecks > 0) {
        score += Math.round((passedChecks / totalChecks) * 10);
      }
    }

    return Math.round((score / maxScore) * 100);
  }

  animateScore(element, targetScore) {
    const startScore = 0;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (targetScore - startScore) * easeOutCubic);
      
      element.textContent = currentScore;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  displaySEOFactors(factors) {
    const container = document.getElementById('seo-factors');
    if (!container) return;

    container.innerHTML = '';

    factors.forEach(factor => {
      const item = document.createElement('div');
      item.className = 'factor-item';
      
      // Translate labels and values
      const translatedLabel = this.translateSEOFactorLabel(factor.label);
      const translatedValue = this.translateSEOFactorValue(factor.value);
      
      item.innerHTML = `
        <span class="factor-label">${translatedLabel}</span>
        <span class="factor-status ${factor.status}">${translatedValue}</span>
      `;
      
      container.appendChild(item);
    });
  }

  translateSEOFactorLabel(label) {
    const labelMap = {
      'Page Title': 'Page Title',
      'Meta Description': 'Meta Description',
      'H1 Tags': 'H1 Tags',
      'Image Alt Text': 'Image Alt Text'
    };
    return labelMap[label] || label;
  }

  translateSEOFactorValue(value) {
    const valueMap = {
      'Optimal': 'Optimal',
      'Perfect': 'Perfect',
      'Missing': 'Missing',
      'Too Short': 'Too Short',
      'Too Long': 'Too Long',
      'Multiple': 'Multiple',
      'All images have alt text': 'All images have alt text'
    };
    
    // Handle dynamic values like "X missing"
    if (value.includes('missing')) {
      const number = value.split(' ')[0];
      return `${number} missing alt text`;
    }
    
    return valueMap[value] || value;
  }


  displayTechnicalChecks(checks) {
    const container = document.getElementById('technical-checks');
    if (!container) return;

    container.innerHTML = '';

    checks.forEach(check => {
      const item = document.createElement('div');
      item.className = 'check-item';
      
      const iconText = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '!';
      
      item.innerHTML = `
        <div class="check-icon ${check.status}">${iconText}</div>
        <span class="check-label">${check.label}</span>
        <span class="check-value">${check.value || ''}</span>
      `;
      
      container.appendChild(item);
    });
  }

  displayHeadingStructure(headings) {
    const container = document.getElementById('heading-structure');
    if (!container) return;

    container.innerHTML = '';

    if (headings.length === 0) {
      container.innerHTML = '<div class="no-headings">No headings found on this page</div>';
      return;
    }

    headings.forEach(heading => {
      const item = document.createElement('div');
      item.className = `heading-item ${heading.tag.toLowerCase()}`;
      
      item.innerHTML = `
        <span class="heading-tag">${heading.tag}</span>
        <span class="heading-text">${heading.text}</span>
      `;
      
      container.appendChild(item);
    });
  }

  displayKeywords(keywords) {
    const container = document.getElementById('keyword-density');
    if (!container) return;

    container.innerHTML = '';

    if (keywords.length === 0) {
      container.innerHTML = '<div class="no-keywords">No keywords found</div>';
      return;
    }

    keywords.slice(0, 12).forEach((keyword, index) => {
      const item = document.createElement('div');
      item.className = 'keyword-item';
      
      item.innerHTML = `
        <span class="keyword-text">${keyword.word}</span>
        <span class="keyword-density">${keyword.density}%</span>
      `;
      
      container.appendChild(item);
    });
  }

  displayLinks() {
    const container = document.getElementById('links-list');
    if (!container || !this.analysisData) return;

    container.innerHTML = '';

    const links = this.analysisData.links || [];
    const filteredLinks = links.filter(link => {
      if (this.currentLinkType === 'internal') return link.type === 'internal';
      if (this.currentLinkType === 'external') return link.type === 'external';
      if (this.currentLinkType === 'broken') return link.broken;
      return true;
    });

    filteredLinks.slice(0, 20).forEach(link => {
      const item = document.createElement('div');
      item.className = 'link-item';
      
      item.innerHTML = `
        <a href="${link.url}" class="link-url" target="_blank">${link.url}</a>
        ${link.text ? `<div class="link-text">${link.text}</div>` : ''}
      `;
      
      container.appendChild(item);
    });

    if (filteredLinks.length === 0) {
      container.innerHTML = '<p>No links found for this category.</p>';
    }
  }

  displayImages(images) {
    const container = document.getElementById('images-list');
    if (!container) return;

    container.innerHTML = '';

    images.slice(0, 20).forEach(image => {
      const item = document.createElement('div');
      item.className = 'image-item';
      
      item.innerHTML = `
        <img src="${image.src}" alt="${image.alt || 'No alt text'}" loading="lazy">
        <div class="image-info">
          ${image.alt ? '✓' : '✗'} Alt
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  displaySocialTags(socialTags) {
    const container = document.getElementById('social-tags');
    if (!container) return;

    container.innerHTML = '';

    Object.keys(socialTags).forEach(platform => {
      const tags = socialTags[platform];
      if (tags && Object.keys(tags).length > 0) {
        const item = document.createElement('div');
        item.className = 'social-item';
        
        let tagsHtml = '';
        Object.keys(tags).forEach(key => {
          tagsHtml += `<div class="social-tag">${key}: ${tags[key]}</div>`;
        });
        
        item.innerHTML = `
          <div class="social-platform">${platform}</div>
          <div class="social-tags">${tagsHtml}</div>
        `;
        
        container.appendChild(item);
      }
    });
  }

  displayStructuredData(structuredData) {
    const previewContainer = document.getElementById('structured-data-preview');
    const fullContainer = document.getElementById('structured-data-full');
    const toggleButton = document.getElementById('toggle-structured-data');
    
    if (!previewContainer || !fullContainer || !toggleButton) return;

    if (structuredData && structuredData.length > 0) {
      // Show toggle button
      toggleButton.classList.remove('hidden');
      
      // Generate preview (summary + first few lines)
      const preview = this.generateStructuredDataPreview(structuredData);
      previewContainer.innerHTML = preview;
      previewContainer.classList.add('has-data');
      
      // Generate full view
      const fullView = `<pre><code>${JSON.stringify(structuredData, null, 2)}</code></pre>`;
      fullContainer.innerHTML = fullView;
      
      // Store data for toggle functionality
      this.structuredDataFull = structuredData;
      this.isStructuredDataExpanded = false;
    } else {
      // Hide toggle button and show no data message
      toggleButton.classList.add('hidden');
      previewContainer.innerHTML = '<p>No structured data found</p>';
      previewContainer.classList.remove('has-data');
      fullContainer.innerHTML = '';
    }
  }

  generateStructuredDataPreview(structuredData) {
    let preview = '';
    
    // Create summary
    const summary = this.createStructuredDataSummary(structuredData);
    preview += `<div class="structured-data-summary">${summary}</div>`;
    
    // Show first schema with limited lines
    if (structuredData.length > 0) {
      const firstSchema = structuredData[0];
      const jsonString = JSON.stringify(firstSchema, null, 2);
      const lines = jsonString.split('\n');
      const previewLines = lines.slice(0, 8); // Show first 8 lines
      
      if (lines.length > 8) {
        previewLines.push('  ...');
        previewLines.push(`  // ${lines.length - 8} more lines`);
      }
      
      preview += `<pre><code>${previewLines.join('\n')}</code></pre>`;
    }
    
    return preview;
  }

  createStructuredDataSummary(structuredData) {
    let summary = '';
    
    // Count schema types
    const schemaTypes = new Map();
    structuredData.forEach(schema => {
      const type = schema['@type'] || 'Unknown';
      schemaTypes.set(type, (schemaTypes.get(type) || 0) + 1);
    });
    
    // Create badges for each type
    schemaTypes.forEach((count, type) => {
      const badge = `<span class="schema-type-badge">${type}${count > 1 ? ` (${count})` : ''}</span>`;
      summary += badge;
    });
    
    // Add key properties from first schema
    if (structuredData.length > 0) {
      const firstSchema = structuredData[0];
      const keyProps = ['name', 'headline', 'description', 'url', 'author', 'datePublished'];
      
      summary += '<div style="margin-top: 8px;">';
      keyProps.forEach(prop => {
        if (firstSchema[prop]) {
          let value = firstSchema[prop];
          if (typeof value === 'object') {
            value = value.name || value['@type'] || JSON.stringify(value).substring(0, 30) + '...';
          }
          if (typeof value === 'string' && value.length > 40) {
            value = value.substring(0, 40) + '...';
          }
          summary += `<div class="schema-property"><span class="schema-property-key">${prop}:</span> <span class="schema-property-value">${value}</span></div>`;
        }
      });
      summary += '</div>';
    }
    
    return summary;
  }

  toggleStructuredDataView() {
    const previewContainer = document.getElementById('structured-data-preview');
    const fullContainer = document.getElementById('structured-data-full');
    const toggleButton = document.getElementById('toggle-structured-data');
    const toggleText = document.getElementById('toggle-text');
    
    if (!this.isStructuredDataExpanded) {
      // Show full view
      previewContainer.classList.add('hidden');
      fullContainer.classList.remove('hidden');
      toggleButton.classList.add('expanded');
      toggleText.textContent = 'Preview';
      this.isStructuredDataExpanded = true;
    } else {
      // Show preview
      previewContainer.classList.remove('hidden');
      fullContainer.classList.add('hidden');
      toggleButton.classList.remove('expanded');
      toggleText.textContent = 'Full View';
      this.isStructuredDataExpanded = false;
    }
  }

  async executeVisualTool(tool, button) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Toggle button state
    button.classList.toggle('active');
    
    // Send message to content script
    await this.sendMessageToTab(tab.id, {
      action: 'executeVisualTool',
      tool: tool,
      active: button.classList.contains('active')
    });
  }

  async clearHighlights() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Clear all active tool buttons
    document.querySelectorAll('.tool-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Send message to content script
    await this.sendMessageToTab(tab.id, { action: 'clearHighlights' });
  }

  async analyzeGEO() {
    const keywords = document.getElementById('geo-keywords').value.trim();
    
    // Auto-detect keywords from page if not provided
    let finalKeywords = keywords;
    if (!keywords) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const pageData = await this.sendMessageToTab(tab.id, { action: 'getPageData' });
        if (pageData && pageData.data) {
          // Extract keywords from title and meta description
          const title = pageData.data.title || '';
          const metaDesc = pageData.data.metaDescription || '';
          const combined = (title + ' ' + metaDesc).toLowerCase();
          
          // Simple keyword extraction
          const words = combined.split(/\s+/).filter(word => 
            word.length > 3 && 
            !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'then', 'them', 'well', 'were'].includes(word)
          );
          finalKeywords = words.slice(0, 3).join(', ');
          
          // Update the input field
          document.getElementById('geo-keywords').value = finalKeywords;
        }
      } catch (error) {
        console.warn('Could not auto-detect keywords:', error);
      }
    }
    
    const button = document.getElementById('analyze-geo');
    const originalHTML = button.innerHTML;
    button.disabled = true;

    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="60" stroke-dashoffset="20" opacity="0.25"/>
        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <span>Analyzing GEO...</span>
    `;

    try {
      // Get current page data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Analyzing URL:', tab.url);
      
      // Perform GEO analysis with real page data
      const geoAnalysis = await this.performGEOAnalysis(tab.url, finalKeywords || 'website optimization');
      console.log('GEO Analysis completed:', geoAnalysis);
      
      // Display current page info
      this.displayCurrentPageInfo(tab.url, geoAnalysis.pageData.title, finalKeywords);
      
      // Display GEO score
      this.displayGEOScore(geoAnalysis.score, geoAnalysis.factors);
      document.getElementById('geo-score-section').classList.remove('hidden');
      
      // Display GEO results
      this.displayGEOResults(geoAnalysis);
      document.getElementById('geo-results').classList.remove('hidden');
      
      // Get AI insights for GEO (optional)
      const apiKey = this.getAPIKey();
      let aiInsights = null;
      let apiError = null;
      
      if (apiKey && apiKey.length > 10) {
        try {
          console.log('Getting GEO AI insights with API key...');
          aiInsights = await this.getGEOAIInsights(tab.url, finalKeywords, geoAnalysis, apiKey);
          console.log('GEO AI Insights received successfully');
        } catch (error) {
          console.warn('AI insights failed:', error.message);
          apiError = error.message;
          
          // Show specific error messages
          if (error.message.includes('401') || error.message.includes('403')) {
            apiError = 'Invalid API key. Please check your Perplexity AI API key in settings.';
          } else if (error.message.includes('429')) {
            apiError = 'API rate limit exceeded. Please try again later.';
          } else if (error.message.includes('500')) {
            apiError = 'Perplexity API server error. Please try again later.';
          }
        }
      } else {
        console.log('No valid API key found, skipping AI insights');
      }
      
      // Show AI insights section only if we have insights
      if (aiInsights) {
        this.displayGEOAIInsights(aiInsights);
        document.getElementById('geo-ai-insights').classList.remove('hidden');
      } else {
        document.getElementById('geo-ai-insights').classList.add('hidden');
        // Show appropriate message based on situation
        if (!apiKey) {
          this.showGEOApiKeyMessage();
        } else if (apiError) {
          this.showGEOApiError(apiError);
        }
      }
      
      // Display GEO recommendations
      this.displayGEORecommendations(geoAnalysis.recommendations);
      document.getElementById('geo-recommendations').classList.remove('hidden');
      
    } catch (error) {
      console.error('GEO analysis error:', error);
      alert(`GEO Analysis failed: ${error.message}`);
    } finally {
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  }

  async fetchCompetitorData(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse HTML to extract SEO data
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      return {
        metaTitle: doc.querySelector('title')?.textContent || '',
        metaDescription: doc.querySelector('meta[name="description"]')?.content || '',
        h1Count: doc.querySelectorAll('h1').length,
        wordCount: this.estimateWordCount(doc.body?.textContent || ''),
        images: doc.querySelectorAll('img').length,
        imagesWithAlt: doc.querySelectorAll('img[alt]').length,
        internalLinks: doc.querySelectorAll('a[href^="/"], a[href*="' + new URL(url).hostname + '"]').length,
        externalLinks: doc.querySelectorAll('a[href^="http"]').length - doc.querySelectorAll('a[href*="' + new URL(url).hostname + '"]').length,
        hasSchema: !!doc.querySelector('script[type="application/ld+json"]'),
        canonical: doc.querySelector('link[rel="canonical"]')?.href || '',
        viewport: doc.querySelector('meta[name="viewport"]')?.content || 'Not set',
        language: doc.documentElement.lang || 'Not set'
      };
    } catch (error) {
      // If CORS blocks us, return estimated data
      console.warn('Direct fetch failed, using estimated data:', error);
      return {
        metaTitle: 'Unable to fetch (CORS)',
        metaDescription: 'Unable to fetch (CORS)',
        h1Count: '?',
        wordCount: '?',
        images: '?',
        imagesWithAlt: '?',
        internalLinks: '?',
        externalLinks: '?',
        hasSchema: false,
        canonical: '?',
        viewport: '?',
        language: '?'
      };
    }
  }

  estimateWordCount(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  async simulateCompetitorAnalysis(url, keywords) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock competitor data
    this.competitorData = {
      url: url,
      keywords: keywords.split(',').map(k => k.trim()),
      score: Math.floor(Math.random() * 40) + 40, // 40-80
      metrics: {
        wordCount: Math.floor(Math.random() * 2000) + 500,
        backlinks: Math.floor(Math.random() * 100) + 10,
        loadTime: (Math.random() * 3 + 1).toFixed(1) + 's'
      }
    };
    
    this.displayCompetitorResults();
  }

  displayCompetitorResults() {
    const container = document.getElementById('comparison-chart');
    if (!container || !this.competitorData) return;

    const yourScore = this.calculateSEOScore();
    const competitorScore = this.competitorData.score;

    container.innerHTML = `
      <div class="comparison-bars">
        <div class="comparison-item">
          <span class="comparison-label">Your Site</span>
          <div class="comparison-bar">
            <div class="comparison-fill" style="width: ${yourScore}%; background: #4f46e5;"></div>
            <span class="comparison-score">${yourScore}%</span>
          </div>
        </div>
        <div class="comparison-item">
          <span class="comparison-label">Competitor</span>
          <div class="comparison-bar">
            <div class="comparison-fill" style="width: ${competitorScore}%; background: #ef4444;"></div>
            <span class="comparison-score">${competitorScore}%</span>
          </div>
        </div>
      </div>
      <div class="comparison-metrics">
        <h4>Key Differences</h4>
        <ul>
          <li>Word Count: You have ${this.analysisData?.wordCount || 0} words, competitor has ${this.competitorData.metrics.wordCount}</li>
          <li>Load Time: Your site loads in ${this.analysisData?.loadTime || 'unknown'}, competitor loads in ${this.competitorData.metrics.loadTime}</li>
          <li>Estimated Backlinks: Competitor has approximately ${this.competitorData.metrics.backlinks} backlinks</li>
        </ul>
      </div>
    `;
  }

  async refreshAnalysis() {
    this.analysisData = null;
    await this.startAnalysis();
  }

  async exportReport() {
    if (!this.analysisData) {
      alert('No analysis data to export');
      return;
    }

    const data = this.analysisData;
    const seoScore = this.calculateSEOScore();
    const timestamp = new Date().toISOString();
    
    // Create CSV content
    const csvContent = this.generateCSVReport(data, seoScore, timestamp);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  generateCSVReport(data, seoScore, timestamp) {
    const csvRows = [];
    const date = new Date(timestamp);
    
    // Professional Header with Logo-style formatting
    csvRows.push('=================================================================');
    csvRows.push('                    SEO ANALYSIS REPORT                         ');
    csvRows.push('                Generated by SEO Checker by Sekhlo              ');
    csvRows.push('=================================================================');
    csvRows.push('');
    
    // Executive Summary Section
    csvRows.push('📊 EXECUTIVE SUMMARY');
    csvRows.push('Metric,Value,Status');
    csvRows.push(`Report Date,"${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}",Generated`);
    csvRows.push(`Report Time,"${date.toLocaleTimeString('en-US', { hour12: true })}",Generated`);
    csvRows.push(`Website URL,"${data.url || 'N/A'}",Analyzed`);
    csvRows.push(`Overall SEO Score,${seoScore}/100,${seoScore >= 80 ? 'Excellent' : seoScore >= 60 ? 'Good' : seoScore >= 40 ? 'Fair' : 'Needs Improvement'}`);
    csvRows.push(`Page Title Length,${(data.title || '').length} chars,${(data.title || '').length >= 30 && (data.title || '').length <= 60 ? 'Optimal' : 'Review Needed'}`);
    csvRows.push(`Meta Description Length,${(data.metaDescription || '').length} chars,${(data.metaDescription || '').length >= 120 && (data.metaDescription || '').length <= 160 ? 'Optimal' : 'Review Needed'}`);
    csvRows.push('');
    
    // Page Information Section
    csvRows.push('📄 PAGE INFORMATION');
    csvRows.push('Property,Current Value,Character Count,Recommendation');
    const titleLen = (data.title || '').length;
    const descLen = (data.metaDescription || '').length;
    csvRows.push(`Page Title,"${this.cleanCSVText(data.title || 'Missing Title')}",${titleLen},${titleLen >= 30 && titleLen <= 60 ? 'Perfect length' : titleLen < 30 ? 'Too short - add more keywords' : 'Too long - consider shortening'}`);
    csvRows.push(`Meta Description,"${this.cleanCSVText(data.metaDescription || 'Missing Description')}",${descLen},${descLen >= 120 && descLen <= 160 ? 'Perfect length' : descLen < 120 ? 'Too short - add more details' : 'Too long - consider shortening'}`);
    csvRows.push(`Page Language,"${data.language || 'Not specified'}",N/A,${data.language ? 'Language specified' : 'Consider adding lang attribute'}`);
    csvRows.push('');
    
    // AI Meta Suggestions Section
    if (data.aiMetaSuggestions) {
      csvRows.push('🤖 AI META TAG OPTIMIZATION');
      csvRows.push('Element,Option #,Suggested Text,Character Count,Improvement Reason,Recommendation');
      
      // Title suggestions
      if (data.aiMetaSuggestions.title && data.aiMetaSuggestions.title.suggestions) {
        data.aiMetaSuggestions.title.suggestions.forEach((suggestion, index) => {
          const suggestedTitle = suggestion.text || '';
          const reason = suggestion.reason || '';
          const charCount = suggestedTitle.length;
          const recommendation = charCount >= 30 && charCount <= 60 ? '✅ Optimal' : charCount < 30 ? '⚠️ Consider longer' : '⚠️ Consider shorter';
          csvRows.push(`Title Suggestion,${index + 1},"${this.cleanCSVText(suggestedTitle)}",${charCount},"${this.cleanCSVText(reason)}","${recommendation}"`);
        });
      }
      
      // Description suggestions
      if (data.aiMetaSuggestions.description && data.aiMetaSuggestions.description.suggestions) {
        data.aiMetaSuggestions.description.suggestions.forEach((suggestion, index) => {
          const suggestedDesc = suggestion.text || '';
          const reason = suggestion.reason || '';
          const charCount = suggestedDesc.length;
          const recommendation = charCount >= 120 && charCount <= 160 ? '✅ Optimal' : charCount < 120 ? '⚠️ Consider longer' : '⚠️ Consider shorter';
          csvRows.push(`Description Suggestion,${index + 1},"${this.cleanCSVText(suggestedDesc)}",${charCount},"${this.cleanCSVText(reason)}","${recommendation}"`);
        });
      }
      csvRows.push('');
    }
    
    // Content Metrics Section
    csvRows.push('📈 CONTENT ANALYSIS');
    csvRows.push('Metric,Value,Benchmark,Status');
    csvRows.push(`Total Words,${(data.wordCount || 0).toLocaleString()},300+ words,${(data.wordCount || 0) >= 300 ? '✅ Good' : '⚠️ Consider more content'}`);
    csvRows.push(`Total Characters,${(data.characterCount || 0).toLocaleString()},1500+ chars,${(data.characterCount || 0) >= 1500 ? '✅ Good' : '⚠️ Consider more content'}`);
    csvRows.push(`Paragraphs,${data.paragraphCount || 0},5+ paragraphs,${(data.paragraphCount || 0) >= 5 ? '✅ Good' : '⚠️ Consider more structure'}`);
    csvRows.push(`Sentences,${data.sentenceCount || 0},20+ sentences,${(data.sentenceCount || 0) >= 20 ? '✅ Good' : '⚠️ Consider more content'}`);
    csvRows.push(`Reading Time,"${data.readingTime || 'N/A'}",2-10 minutes,${data.readingTime ? '✅ Calculated' : '⚠️ Unable to calculate'}`);
    csvRows.push(`Avg Word Length,"${data.avgWordLength || 'N/A'} chars",4-6 chars optimal,${data.avgWordLength ? '✅ Calculated' : '⚠️ Unable to calculate'}`);
    csvRows.push('');
    
    // Headings Structure Section
    csvRows.push('🏷️ HEADING STRUCTURE ANALYSIS');
    csvRows.push('Heading Level,Count,Heading Text,SEO Assessment');
    if (data.headings && data.headings.length > 0) {
      // Group headings by level for better analysis
      const headingsByLevel = {};
      data.headings.forEach(heading => {
        if (!headingsByLevel[heading.level]) {
          headingsByLevel[heading.level] = [];
        }
        headingsByLevel[heading.level].push(heading);
      });
      
      // Display headings with SEO assessment
      Object.keys(headingsByLevel).sort().forEach(level => {
        headingsByLevel[level].forEach((heading, index) => {
          const text = heading.text || '';
          const assessment = level === 'H1' ? 
            (headingsByLevel['H1'].length === 1 ? '✅ Single H1 (Good)' : '⚠️ Multiple H1s (Fix needed)') :
            text.length > 60 ? '⚠️ Too long' : text.length < 10 ? '⚠️ Too short' : '✅ Good length';
          csvRows.push(`${level},${index + 1},"${this.cleanCSVText(text)}","${assessment}"`);
        });
      });
      
      // Add heading summary
      csvRows.push('');
      csvRows.push('HEADING SUMMARY');
      csvRows.push('Level,Total Count,SEO Status');
      Object.keys(headingsByLevel).sort().forEach(level => {
        const count = headingsByLevel[level].length;
        const status = level === 'H1' ? 
          (count === 1 ? '✅ Perfect' : count === 0 ? '❌ Missing' : '⚠️ Too many') :
          count > 0 ? '✅ Present' : '⚠️ Missing';
        csvRows.push(`${level},${count},"${status}"`);
      });
    } else {
      csvRows.push('No headings found,0,❌ Critical Issue,Add heading structure immediately');
    }
    csvRows.push('');
    
    // AI Heading Suggestions Section
    if (data.aiHeadingSuggestions && data.aiHeadingSuggestions.length > 0) {
      csvRows.push('🤖 AI HEADING OPTIMIZATION');
      csvRows.push('Heading Level,Current Heading,AI Improved Heading,Character Count,Improvement Reason,Priority');
      data.aiHeadingSuggestions.forEach((suggestion, index) => {
        const level = suggestion.level || 'N/A';
        const original = suggestion.original || '';
        const improved = suggestion.improved || '';
        const reason = suggestion.reason || '';
        const priority = level === 'H1' ? 'High' : level === 'H2' ? 'Medium' : 'Low';
        csvRows.push(`${level},"${this.cleanCSVText(original)}","${this.cleanCSVText(improved)}",${improved.length},"${this.cleanCSVText(reason)}","${priority}"`);
      });
      csvRows.push('');
    }
    
    // Links Analysis Section
    csvRows.push('🔗 LINK ANALYSIS');
    csvRows.push('Link Type,Count,Percentage,SEO Assessment');
    const totalLinks = data.links ? data.links.length : 0;
    const internal = data.internalLinks || 0;
    const external = data.externalLinks || 0;
    const nofollow = data.nofollowLinks || 0;
    
    csvRows.push(`Total Links,${totalLinks},100%,${totalLinks >= 3 ? '✅ Good link presence' : '⚠️ Consider adding more links'}`);
    csvRows.push(`Internal Links,${internal},${totalLinks > 0 ? Math.round((internal/totalLinks)*100) : 0}%,${internal >= 2 ? '✅ Good internal linking' : '⚠️ Add more internal links'}`);
    csvRows.push(`External Links,${external},${totalLinks > 0 ? Math.round((external/totalLinks)*100) : 0}%,${external >= 1 ? '✅ Good external references' : '⚠️ Consider adding quality external links'}`);
    csvRows.push(`Nofollow Links,${nofollow},${totalLinks > 0 ? Math.round((nofollow/totalLinks)*100) : 0}%,${nofollow < totalLinks/2 ? '✅ Good follow/nofollow ratio' : '⚠️ Too many nofollow links'}`);
    csvRows.push('');
    
    // Images Analysis Section
    csvRows.push('🖼️ IMAGE OPTIMIZATION');
    csvRows.push('Image Metric,Count,Percentage,SEO Assessment');
    const totalImages = data.images ? data.images.length : 0;
    const withAlt = data.imagesWithAlt || 0;
    const withoutAlt = data.imagesWithoutAlt || 0;
    const largeImages = data.largeImages || 0;
    
    csvRows.push(`Total Images,${totalImages},100%,${totalImages > 0 ? '✅ Images present' : '⚠️ No images found'}`);
    csvRows.push(`Images with Alt Text,${withAlt},${totalImages > 0 ? Math.round((withAlt/totalImages)*100) : 0}%,${withAlt === totalImages ? '✅ Perfect alt text coverage' : '⚠️ Add alt text to remaining images'}`);
    csvRows.push(`Images without Alt Text,${withoutAlt},${totalImages > 0 ? Math.round((withoutAlt/totalImages)*100) : 0}%,${withoutAlt === 0 ? '✅ All images have alt text' : '❌ Missing alt text - fix immediately'}`);
    csvRows.push(`Large Images,${largeImages},${totalImages > 0 ? Math.round((largeImages/totalImages)*100) : 0}%,${largeImages === 0 ? '✅ No oversized images' : '⚠️ Optimize large images for faster loading'}`);
    csvRows.push('');
    
    // Keywords Analysis Section
    if (data.keywords && data.keywords.length > 0) {
      csvRows.push('🔍 KEYWORD ANALYSIS');
      csvRows.push('Rank,Keyword,Frequency,Density %,SEO Assessment');
      data.keywords.slice(0, 15).forEach((keyword, index) => {
        const density = parseFloat(keyword.density) || 0;
        const assessment = density > 3 ? '⚠️ Over-optimized' : density >= 1 ? '✅ Good density' : '⚠️ Under-optimized';
        csvRows.push(`${index + 1},"${this.cleanCSVText(keyword.word)}",${keyword.count},${density}%,"${assessment}"`);
      });
      csvRows.push('');
    }
    
    // AI Generated Keywords Section
    if (data.aiKeywords) {
      csvRows.push('🤖 AI KEYWORD RECOMMENDATIONS');
      csvRows.push('Category,Keywords,Count,Usage Priority');
      
      if (data.aiKeywords.primary && data.aiKeywords.primary.length > 0) {
        const keywords = data.aiKeywords.primary.join('; ');
        csvRows.push(`Primary Keywords,"${this.cleanCSVText(keywords)}",${data.aiKeywords.primary.length},High - Use in title and headings`);
      }
      
      if (data.aiKeywords.longtail && data.aiKeywords.longtail.length > 0) {
        const keywords = data.aiKeywords.longtail.join('; ');
        csvRows.push(`Long-tail Keywords,"${this.cleanCSVText(keywords)}",${data.aiKeywords.longtail.length},Medium - Use in content and meta description`);
      }
      
      if (data.aiKeywords.semantic && data.aiKeywords.semantic.length > 0) {
        const keywords = data.aiKeywords.semantic.join('; ');
        csvRows.push(`Semantic Keywords,"${this.cleanCSVText(keywords)}",${data.aiKeywords.semantic.length},Medium - Use for topic relevance`);
      }
      csvRows.push('');
    }
    
    // Technical SEO Section
    csvRows.push('⚙️ TECHNICAL SEO CHECKLIST');
    csvRows.push('SEO Factor,Status,Impact,Recommendation');
    csvRows.push(`Schema Markup,${data.hasSchema ? '✅ Present' : '❌ Missing'},High,${data.hasSchema ? 'Good - helps search engines understand content' : 'Add structured data for better SERP features'}`);
    csvRows.push(`Canonical URL,${data.canonical ? '✅ Present' : '❌ Missing'},Medium,${data.canonical ? 'Good - prevents duplicate content issues' : 'Add canonical URL to avoid duplicate content'}`);
    csvRows.push(`Meta Viewport,${data.hasViewport ? '✅ Present' : '❌ Missing'},High,${data.hasViewport ? 'Good - mobile-friendly setup' : 'Add viewport meta tag for mobile optimization'}`);
    csvRows.push(`Character Encoding,${data.hasCharset ? '✅ Present' : '❌ Missing'},Low,${data.hasCharset ? 'Good - proper character encoding' : 'Add charset meta tag for proper text rendering'}`);
    csvRows.push('');
    
    // Social Media Tags Section
    csvRows.push('📱 SOCIAL MEDIA OPTIMIZATION');
    csvRows.push('Platform,Property,Value,Status');
    if (data.socialTags && Object.keys(data.socialTags).length > 0) {
      Object.entries(data.socialTags).forEach(([key, value]) => {
        if (value) {
          const platform = key.startsWith('og:') ? 'Open Graph' : key.startsWith('twitter:') ? 'Twitter' : 'Other';
          const status = value.length > 0 ? '✅ Present' : '⚠️ Empty';
          csvRows.push(`${platform},"${key}","${this.cleanCSVText(String(value))}","${status}"`);
        }
      });
    } else {
      csvRows.push('No social tags,N/A,N/A,❌ Missing - Add Open Graph and Twitter Card tags');
    }
    csvRows.push('');
    
    // Action Items Summary
    csvRows.push('📋 PRIORITY ACTION ITEMS');
    csvRows.push('Priority,Action Item,Impact,Estimated Time');
    
    // Generate dynamic action items based on analysis
    const actionItems = [];
    
    if (!data.title || data.title.length === 0) {
      actionItems.push(['High', 'Add page title', 'Critical for SEO', '5 minutes']);
    } else if (data.title.length < 30 || data.title.length > 60) {
      actionItems.push(['High', 'Optimize page title length (30-60 chars)', 'Improves click-through rate', '10 minutes']);
    }
    
    if (!data.metaDescription || data.metaDescription.length === 0) {
      actionItems.push(['High', 'Add meta description', 'Critical for SERP appearance', '10 minutes']);
    } else if (data.metaDescription.length < 120 || data.metaDescription.length > 160) {
      actionItems.push(['Medium', 'Optimize meta description length (120-160 chars)', 'Better SERP display', '10 minutes']);
    }
    
    if (!data.hasSchema) {
      actionItems.push(['Medium', 'Add structured data/schema markup', 'Enhanced SERP features', '30 minutes']);
    }
    
    if (data.imagesWithoutAlt > 0) {
      actionItems.push(['Medium', `Add alt text to ${data.imagesWithoutAlt} images`, 'Accessibility and SEO', '15 minutes']);
    }
    
    if ((data.wordCount || 0) < 300) {
      actionItems.push(['Medium', 'Increase content length to 300+ words', 'Better keyword coverage', '60 minutes']);
    }
    
    if (!data.headings || data.headings.length === 0) {
      actionItems.push(['High', 'Add heading structure (H1, H2, H3)', 'Content organization', '20 minutes']);
    }
    
    // Add action items to CSV
    actionItems.forEach(item => {
      csvRows.push(`"${item[0]}","${item[1]}","${item[2]}","${item[3]}"`);
    });
    
    if (actionItems.length === 0) {
      csvRows.push('Low,Continue monitoring and optimization,Maintain current performance,Ongoing');
    }
    
    csvRows.push('');
    
    // Professional Footer
    csvRows.push('=================================================================');
    csvRows.push('                        REPORT FOOTER                           ');
    csvRows.push('=================================================================');
    csvRows.push(`Report Generated: ${date.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`);
    csvRows.push('Tool: SEO Checker by Sekhlo - AI-Powered SEO Analysis');
    csvRows.push('Website: https://www.mubashirhassan.com');
    csvRows.push('Features: AEO & GEO Optimization | AI Keywords | Meta Optimization');
    csvRows.push('=================================================================');
    
    return csvRows.join('\n');
  }

  // Helper function to clean text for CSV
  cleanCSVText(text) {
    if (!text) return '';
    return String(text)
      .replace(/"/g, '""')  // Escape quotes
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .replace(/\r/g, '')   // Remove carriage returns
      .replace(/,/g, ';')   // Replace commas with semicolons
      .trim();              // Remove leading/trailing whitespace
  }

  async viewHistory() {
    this.showHistory();
  }

  // History Management Functions
  async saveToHistory(analysisData, seoScore) {
    try {
      const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        url: analysisData.url,
        title: analysisData.title || 'Untitled Page',
        seoScore: seoScore,
        wordCount: analysisData.wordCount || 0,
        headingCount: analysisData.headings ? analysisData.headings.length : 0,
        imageCount: analysisData.images ? analysisData.images.length : 0,
        linkCount: analysisData.links ? analysisData.links.length : 0,
        loadTime: analysisData.loadTime || '--',
        hasAI: !!(analysisData.aiKeywords || analysisData.aiHeadingSuggestions || analysisData.aiMetaSuggestions),
        data: analysisData // Store full analysis data
      };

      // Get existing history
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['analysisHistory'], resolve);
      });

      let history = result.analysisHistory || [];
      
      // Add new item to beginning
      history.unshift(historyItem);
      
      // Keep only last 50 items
      if (history.length > 50) {
        history = history.slice(0, 50);
      }

      // Save updated history
      await new Promise(resolve => {
        chrome.storage.local.set({ analysisHistory: history }, resolve);
      });

      console.log('✅ Analysis saved to history');
    } catch (error) {
      console.error('❌ Error saving to history:', error);
    }
  }

  async showHistory() {
    try {
      // Get history from storage
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['analysisHistory'], resolve);
      });

      const history = result.analysisHistory || [];
      
      // Update history count
      document.getElementById('history-count').textContent = 
        `${history.length} ${history.length === 1 ? 'analysis' : 'analyses'}`;

      // Render history items
      this.renderHistoryItems(history);

      // Show modal
      document.getElementById('history-modal').style.display = 'flex';
      
    } catch (error) {
      console.error('❌ Error loading history:', error);
      this.showNotification('Error loading history', 'error');
    }
  }

  hideHistory() {
    document.getElementById('history-modal').style.display = 'none';
  }

  renderHistoryItems(history) {
    const historyList = document.getElementById('history-list');
    
    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="empty-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3>No History Yet</h3>
          <p>Your analysis history will appear here after you analyze some pages.</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = history.map((item, index) => this.createHistoryItemHTML(item, index + 1)).join('');
    
    // Add event listeners to history items
    history.forEach(item => {
      const element = document.getElementById(`history-item-${item.id}`);
      if (element) {
        // View details
        element.querySelector('.history-action-btn.primary').addEventListener('click', (e) => {
          e.stopPropagation();
          this.viewHistoryDetails(item);
        });
        
        // Export item
        element.querySelector('.history-action-btn:not(.primary):not(.danger)').addEventListener('click', (e) => {
          e.stopPropagation();
          this.exportHistoryItem(item);
        });
        
        // Delete item
        element.querySelector('.history-action-btn.danger').addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteHistoryItem(item.id);
        });
      }
    });
  }

  createHistoryItemHTML(item, index) {
    const date = new Date(item.timestamp);
    const scoreClass = item.seoScore >= 80 ? 'history-score' :
                      item.seoScore >= 60 ? 'history-score fair' :
                      'history-score poor';

    const domain = new URL(item.url).hostname;

    // Handle backwards compatibility for loadTime
    const loadTime = item.loadTime || (item.data && item.data.loadTime) || '--';
    
    return `
      <div class="history-item" id="history-item-${item.id}">
        <div class="history-item-header">
          <div>
            <h4 class="history-url">${index}</h4>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              ${this.escapeHtml(domain)}
              ${item.hasAI ? '<span style="background: #ddd6fe; color: #7c3aed; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">AI Enhanced</span>' : ''}
            </div>
          </div>
          <div class="history-date">
            ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        
        <div class="history-metrics">
          <div class="history-metric">
            <span class="history-metric-value ${scoreClass}">${item.seoScore}</span>
            <span class="history-metric-label">SEO Score</span>
          </div>
          <div class="history-metric">
            <span class="history-metric-value">${item.wordCount.toLocaleString()}</span>
            <span class="history-metric-label">Words</span>
          </div>
          <div class="history-metric">
            <span class="history-metric-value">${item.headingCount}</span>
            <span class="history-metric-label">Headings</span>
          </div>
          <div class="history-metric">
            <span class="history-metric-value">${item.linkCount}</span>
            <span class="history-metric-label">Links</span>
          </div>
          <div class="history-metric">
            <span class="history-metric-value">${loadTime}</span>
            <span class="history-metric-label">Load Time</span>
          </div>
        </div>
        
        <div class="history-actions">
          <button class="history-action-btn primary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            View Details
          </button>
          <button class="history-action-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2"/>
            </svg>
            Export
          </button>
          <button class="history-action-btn danger">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    `;
  }

  async viewHistoryDetails(item) {
    // Load the historical analysis data
    this.analysisData = item.data;
    this.hideHistory();
    
    // Display the analysis
    this.displayAnalysis();
    
    // Show notification
    this.showNotification(`Viewing analysis from ${new Date(item.timestamp).toLocaleDateString()}`, 'info');
  }

  async exportHistoryItem(item) {
    try {
      const seoScore = this.calculateSEOScore(item.data);
      const csvContent = this.generateCSVReport(item.data, seoScore, item.timestamp);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      a.download = `seo-report-${date}-${item.id}.csv`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showNotification('Report exported successfully!', 'success');
    } catch (error) {
      console.error('❌ Export error:', error);
      this.showNotification('Error exporting report', 'error');
    }
  }

  async deleteHistoryItem(itemId) {
    if (!confirm('Are you sure you want to delete this analysis from history?')) {
      return;
    }

    try {
      // Get current history
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['analysisHistory'], resolve);
      });

      let history = result.analysisHistory || [];
      
      // Remove the item
      history = history.filter(item => item.id !== itemId);
      
      // Save updated history
      await new Promise(resolve => {
        chrome.storage.local.set({ analysisHistory: history }, resolve);
      });

      // Refresh the display
      this.renderHistoryItems(history);
      document.getElementById('history-count').textContent = 
        `${history.length} ${history.length === 1 ? 'analysis' : 'analyses'}`;
      
      this.showNotification('Analysis deleted from history', 'success');
    } catch (error) {
      console.error('❌ Error deleting history item:', error);
      this.showNotification('Error deleting analysis', 'error');
    }
  }

  async clearHistory() {
    if (!confirm('Are you sure you want to clear all analysis history? This action cannot be undone.')) {
      return;
    }

    try {
      await new Promise(resolve => {
        chrome.storage.local.set({ analysisHistory: [] }, resolve);
      });

      // Update display
      this.renderHistoryItems([]);
      document.getElementById('history-count').textContent = '0 analyses';
      
      this.showNotification('History cleared successfully', 'success');
    } catch (error) {
      console.error('❌ Error clearing history:', error);
      this.showNotification('Error clearing history', 'error');
    }
  }

  async copyHeadings() {
    if (!this.analysisData || !this.analysisData.headings) {
      alert('No headings to copy');
      return;
    }

    const headings = this.analysisData.headings;
    let headingsText = '';

    headings.forEach(heading => {
      const indent = '  '.repeat(heading.level - 1);
      headingsText += `${indent}${heading.tag}: ${heading.text}\n`;
    });

    try {
      await navigator.clipboard.writeText(headingsText);
      this.showCopySuccess('copy-headings');
    } catch (error) {
      console.error('Failed to copy headings:', error);
      alert('Failed to copy headings to clipboard');
    }
  }

  async copyKeywords() {
    if (!this.analysisData || !this.analysisData.keywords) {
      alert('No keywords to copy');
      return;
    }

    const keywords = this.analysisData.keywords;
    let keywordsText = 'Top Keywords:\n\n';

    keywords.slice(0, 12).forEach((keyword, index) => {
      keywordsText += `${index + 1}. ${keyword.word} (${keyword.density}%)\n`;
    });

    try {
      await navigator.clipboard.writeText(keywordsText);
      this.showCopySuccess('copy-keywords');
    } catch (error) {
      console.error('Failed to copy keywords:', error);
      alert('Failed to copy keywords to clipboard');
    }
  }

  async improveMeta() {
    console.log('🔍 Starting AI Meta Tag Improvements...');
    
    const apiKey = this.getAPIKey();
    console.log('🔑 API Key check:', apiKey ? 'Found' : 'Missing');
    
    if (!apiKey) {
      alert('Please set your Perplexity AI API key in settings first.\n\nClick the ⚙️ icon in the footer to add your API key.\n\nGet your key from: https://www.perplexity.ai/settings/api');
      return;
    }
    
    const button = document.getElementById('improve-meta');
    const originalText = button.innerHTML;
    
    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = `
        <div class="spinner" style="width: 12px; height: 12px; margin-right: 6px;"></div>
        <span>Analyzing...</span>
      `;

      // Get current meta tags
      if (!this.analysisData) {
        throw new Error('No page data found. Please wait for the page analysis to complete.');
      }

      const currentTitle = this.analysisData.title || '';
      const currentDescription = this.analysisData.metaDescription || '';
      const pageUrl = this.analysisData.url;
      
      console.log('📋 Current meta:', { title: currentTitle, description: currentDescription });

      // Get current page data for context
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const pageData = await this.sendMessageToTab(tab.id, { action: 'getPageData' });
      
      const pageContent = pageData?.data?.textContent || '';
      const headings = this.analysisData.headings || [];

      // Get meta improvement suggestions from Perplexity AI
      const suggestions = await this.getMetaImprovements(currentTitle, currentDescription, pageUrl, pageContent, headings, apiKey);
      console.log('✅ Meta suggestions received:', suggestions);
      
      // Display the suggestions
      this.displayMetaSuggestions(suggestions);
      
      // Show success message
      this.showNotification('Meta tag improvements generated successfully!', 'success');

    } catch (error) {
      console.error('❌ Failed to get meta improvements:', error);
      this.showMetaSuggestionsError(error.message);
      alert(`Error: ${error.message}\n\nCheck the console for more details.`);
    } finally {
      // Reset button
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  async improveHeadings() {
    console.log('🔍 Starting AI Heading Improvements...');
    
    const apiKey = this.getAPIKey();
    console.log('🔑 API Key check:', apiKey ? 'Found' : 'Missing');
    
    if (!apiKey) {
      alert('Please set your Perplexity AI API key in settings first.\n\nClick the ⚙️ icon in the footer to add your API key.\n\nGet your key from: https://www.perplexity.ai/settings/api');
      return;
    }
    
    const button = document.getElementById('improve-headings');
    const originalText = button.innerHTML;
    
    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = `
        <div class="spinner" style="width: 12px; height: 12px; margin-right: 6px;"></div>
        <span>Analyzing...</span>
      `;

      // Get current page headings
      if (!this.analysisData || !this.analysisData.headings) {
        throw new Error('No headings found. Please wait for the page analysis to complete.');
      }

      const headings = this.analysisData.headings;
      const pageUrl = this.analysisData.url;
      const pageTitle = this.analysisData.title;
      
      console.log('📋 Current headings:', headings);

      // Get current page data for context
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const pageData = await this.sendMessageToTab(tab.id, { action: 'getPageData' });
      
      const pageContent = pageData?.data?.textContent || '';

      // Get heading improvement suggestions from Perplexity AI
      const suggestions = await this.getHeadingImprovements(headings, pageUrl, pageTitle, pageContent, apiKey);
      console.log('✅ Heading suggestions received:', suggestions);
      
      // Display the suggestions
      this.displayHeadingSuggestions(suggestions);
      
      // Show success message
      this.showNotification('Heading improvements generated successfully!', 'success');

    } catch (error) {
      console.error('❌ Failed to get heading improvements:', error);
      this.showHeadingSuggestionsError(error.message);
      alert(`Error: ${error.message}\n\nCheck the console for more details.`);
    } finally {
      // Reset button
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  async getAIKeywords() {
    console.log('🔍 Starting AI Keywords extraction...');
    
    const apiKey = this.getAPIKey();
    console.log('🔑 API Key check:', apiKey ? 'Found' : 'Missing');
    
    // TEMPORARY: Test mode for debugging - set to false once API key is working
    const TEST_MODE = false; // Set to true to test without API
    
    if (TEST_MODE) {
      console.log('⚠️ TEST MODE: Showing sample keywords without API call');
      const sampleKeywords = {
        primary: ["ChatGPT", "AI", "SEO", "optimization", "ranking", "content", "keywords"],
        longTail: ["ChatGPT ranking optimization", "AI search engine visibility", "optimize content for AI engines"],
        semantic: ["artificial intelligence", "machine learning", "natural language processing", "SERP"]
      };
      this.displayAIKeywords(sampleKeywords);
      this.showNotification('Test keywords displayed!', 'success');
      return;
    }
    
    if (!apiKey) {
      alert('Please set your Perplexity AI API key in settings first.\n\nClick the ⚙️ icon in the footer to add your API key.\n\nGet your key from: https://www.perplexity.ai/settings/api');
      return;
    }
    
    console.log('💡 TIP: The extension will try multiple models automatically to find one that works with your API plan.');

    const button = document.getElementById('get-ai-keywords');
    const originalText = button.innerHTML;
    
    try {
      // Show loading state
      button.disabled = true;
      button.innerHTML = `
        <div class="spinner" style="width: 12px; height: 12px; margin-right: 6px;"></div>
        <span>Getting Keywords...</span>
      `;

      console.log('📄 Getting current page data...');
      
      // Get current page data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('🌐 Current tab:', tab.url);
      
      // Ensure content script is injected
      await this.ensureContentScript(tab.id);
      
      const pageData = await this.sendMessageToTab(tab.id, { action: 'getPageData' });
      console.log('📊 Page data response:', pageData);
      
      if (!pageData || !pageData.success || !pageData.data) {
        throw new Error('Could not get page content. Please refresh the page and try again.');
      }

      // Get page content for analysis
      const content = pageData.data.textContent || pageData.data.content || '';
      console.log('📝 Content length:', content.length);
      
      if (!content || content.length < 100) {
        throw new Error('Page content is too short for keyword analysis (minimum 100 characters required)');
      }

      console.log('🤖 Sending request to Perplexity AI...');
      
      // Get keywords from Perplexity AI
      const aiKeywords = await this.getKeywordsFromPerplexity(tab.url, content, apiKey);
      console.log('✅ AI Keywords received:', aiKeywords);
      
      // Display the AI keywords
      this.displayAIKeywords(aiKeywords);
      
      // Show success message
      this.showNotification('AI keywords generated successfully!', 'success');

    } catch (error) {
      console.error('❌ Failed to get AI keywords:', error);
      this.showAIKeywordsError(error.message);
      
      // Also show alert for immediate feedback
      alert(`Error: ${error.message}\n\nCheck the console for more details.`);
    } finally {
      // Reset button
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }

  displayAIKeywords(keywordsData) {
    // Store AI keywords in analysis data for export
    if (this.analysisData) {
      this.analysisData.aiKeywords = keywordsData;
    }
    
    const section = document.getElementById('ai-keywords-section');
    const primaryContainer = document.getElementById('ai-primary-keywords');
    const longtailContainer = document.getElementById('ai-longtail-keywords');
    const semanticContainer = document.getElementById('ai-semantic-keywords');

    // Clear previous content
    primaryContainer.innerHTML = '';
    longtailContainer.innerHTML = '';
    semanticContainer.innerHTML = '';

    // Display primary keywords
    if (keywordsData.primary && keywordsData.primary.length > 0) {
      keywordsData.primary.forEach(keyword => {
        const item = document.createElement('span');
        item.className = 'ai-keyword-item primary';
        item.textContent = keyword;
        item.title = `Click to search for "${keyword}"`;
        item.addEventListener('click', () => {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, '_blank');
        });
        primaryContainer.appendChild(item);
      });
    } else {
      primaryContainer.innerHTML = '<span class="no-keywords">No primary keywords found</span>';
    }

    // Display long-tail keywords
    if (keywordsData.longTail && keywordsData.longTail.length > 0) {
      keywordsData.longTail.forEach(keyword => {
        const item = document.createElement('span');
        item.className = 'ai-keyword-item longtail';
        item.textContent = keyword;
        item.title = `Click to search for "${keyword}"`;
        item.addEventListener('click', () => {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, '_blank');
        });
        longtailContainer.appendChild(item);
      });
    } else {
      longtailContainer.innerHTML = '<span class="no-keywords">No long-tail keywords found</span>';
    }

    // Display semantic keywords
    if (keywordsData.semantic && keywordsData.semantic.length > 0) {
      keywordsData.semantic.forEach(keyword => {
        const item = document.createElement('span');
        item.className = 'ai-keyword-item semantic';
        item.textContent = keyword;
        item.title = `Click to search for "${keyword}"`;
        item.addEventListener('click', () => {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, '_blank');
        });
        semanticContainer.appendChild(item);
      });
    } else {
      semanticContainer.innerHTML = '<span class="no-keywords">No semantic keywords found</span>';
    }

    // Show the section
    section.classList.remove('hidden');
  }

  showAIKeywordsError(message) {
    const section = document.getElementById('ai-keywords-section');
    const container = section.querySelector('.ai-keywords-container');
    
    container.innerHTML = `
      <div class="ai-keywords-error">
        <strong>Error:</strong> ${message}
        <br><br>
        Please check your API key and try again.
      </div>
    `;
    
    section.classList.remove('hidden');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '6px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease'
    });

    // Set background color based on type
    if (type === 'success') {
      notification.style.background = '#10b981';
    } else if (type === 'error') {
      notification.style.background = '#ef4444';
    } else {
      notification.style.background = '#3b82f6';
    }

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showCopySuccess(buttonId) {
    const button = document.getElementById(buttonId);
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').textContent = 'Copied!';
    button.style.background = '#10b981';
    button.style.color = 'white';
    button.style.borderColor = '#10b981';
    
    setTimeout(() => {
      button.querySelector('span').textContent = originalText;
      button.style.background = '';
      button.style.color = '';
      button.style.borderColor = '';
    }, 2000);
  }

  async checkRobotsFile() {
    const button = document.getElementById('check-robots');
    const statusText = document.querySelector('#robots-status .status-text');
    const detailsContainer = document.getElementById('robots-details');
    
    // Update button and status
    button.disabled = true;
    statusText.textContent = 'Checking...';
    statusText.className = 'status-text checking';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = new URL(tab.url);
      const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
      const robotsUrl = `${baseUrl}/robots.txt`;
      
      const response = await fetch(robotsUrl);
      
      if (response.ok) {
        const content = await response.text();
        this.displayRobotsResults(robotsUrl, content);
      } else {
        this.displayRobotsNotFound(robotsUrl);
      }
    } catch (error) {
      this.displayRobotsError(error.message);
    } finally {
      button.disabled = false;
    }
  }

  async checkSitemapFile() {
    const button = document.getElementById('check-sitemap');
    const statusText = document.querySelector('#sitemap-status .status-text');
    const detailsContainer = document.getElementById('sitemap-details');
    
    // Update button and status
    button.disabled = true;
    statusText.textContent = 'Checking...';
    statusText.className = 'status-text checking';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = new URL(tab.url);
      const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
      
      // Check multiple common sitemap locations
      const sitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/sitemaps.xml`,
        `${baseUrl}/wp-sitemap.xml`, // WordPress default
        `${baseUrl}/sitemap-index.xml`
      ];
      
      let foundSitemap = null;
      let sitemapContent = '';
      let lastError = null;
      
      console.log('Checking sitemap URLs:', sitemapUrls);
      
      for (const sitemapUrl of sitemapUrls) {
        try {
          console.log(`Checking: ${sitemapUrl}`);
          const response = await fetch(sitemapUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/xml, text/xml, */*'
            }
          });
          
          console.log(`Response for ${sitemapUrl}:`, response.status, response.statusText);
          
          if (response.ok) {
            sitemapContent = await response.text();
            console.log(`Content length for ${sitemapUrl}:`, sitemapContent.length);
            console.log(`Content preview:`, sitemapContent.substring(0, 200));
            
            // Basic validation - check if it looks like XML
            if (sitemapContent.trim().startsWith('<?xml') || sitemapContent.includes('<urlset') || sitemapContent.includes('<sitemapindex')) {
              foundSitemap = sitemapUrl;
              break;
            } else {
              console.log(`Content doesn't look like XML sitemap for ${sitemapUrl}`);
            }
          }
        } catch (e) {
          console.log(`Error checking ${sitemapUrl}:`, e.message);
          lastError = e;
          // Continue to next URL
        }
      }
      
      if (foundSitemap) {
        console.log(`Found sitemap at: ${foundSitemap}`);
        this.displaySitemapResults(foundSitemap, sitemapContent);
      } else {
        console.log('No sitemap found at any location');
        this.displaySitemapNotFound(sitemapUrls[0], lastError);
      }
    } catch (error) {
      console.error('Error in checkSitemapFile:', error);
      this.displaySitemapError(error.message);
    } finally {
      button.disabled = false;
    }
  }

  async checkAllSEOFiles() {
    const button = document.getElementById('check-all-files');
    const originalText = button.querySelector('span').textContent;
    
    button.disabled = true;
    button.querySelector('span').textContent = 'Checking...';
    
    try {
      // Check all files in parallel
      await Promise.all([
        this.checkRobotsFile(),
        this.checkSitemapFile(),
        this.checkLLMSFile()
      ]);
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = originalText;
    }
  }

  displayRobotsResults(url, content) {
    const statusText = document.querySelector('#robots-status .status-text');
    const detailsContainer = document.getElementById('robots-details');
    
    statusText.textContent = 'Found ✓';
    statusText.className = 'status-text found';
    
    // Parse robots.txt content
    const lines = content.split('\n').filter(line => line.trim());
    const directives = this.parseRobotsContent(content);
    
    const detailsHTML = `
      <div class="file-info-grid">
        <div class="file-stat">
          <span class="file-stat-number">${lines.length}</span>
          <span class="file-stat-label">Lines</span>
        </div>
        <div class="file-stat">
          <span class="file-stat-number">${directives.userAgents.length}</span>
          <span class="file-stat-label">User Agents</span>
        </div>
        <div class="file-stat">
          <span class="file-stat-number">${directives.sitemaps.length}</span>
          <span class="file-stat-label">Sitemaps</span>
        </div>
      </div>
      
      <div class="file-content-preview">
        <div class="file-content-text">${content.substring(0, 300)}${content.length > 300 ? '...' : ''}</div>
      </div>
      
      <a href="${url}" target="_blank" class="file-url-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="2"/>
          <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2"/>
        </svg>
        View robots.txt
      </a>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    detailsContainer.classList.remove('hidden');
  }

  displaySitemapResults(url, content) {
    const statusText = document.querySelector('#sitemap-status .status-text');
    const detailsContainer = document.getElementById('sitemap-details');
    
    statusText.textContent = 'Found ✓';
    statusText.className = 'status-text found';
    
    // Parse sitemap XML
    const sitemapData = this.parseSitemapContent(content);
    
    // Handle parsing errors
    if (sitemapData.error) {
      const detailsHTML = `
        <div style="color: #d97706; font-size: 13px; margin-bottom: 12px;">
          ⚠️ Sitemap found but parsing failed: ${sitemapData.error}
        </div>
        <div class="file-content-preview">
          <div class="file-content-text">${content.substring(0, 300)}${content.length > 300 ? '...' : ''}</div>
        </div>
        <a href="${url}" target="_blank" class="file-url-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="2"/>
            <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2"/>
          </svg>
          View sitemap.xml
        </a>
      `;
      detailsContainer.innerHTML = detailsHTML;
      detailsContainer.classList.remove('hidden');
      return;
    }
    
    // Format last modified date
    let lastModDisplay = 'N/A';
    if (sitemapData.lastMod) {
      try {
        const date = new Date(sitemapData.lastMod);
        lastModDisplay = date.toLocaleDateString();
      } catch (e) {
        lastModDisplay = sitemapData.lastMod.substring(0, 10); // Just show date part
      }
    }
    
    const detailsHTML = `
      <div class="file-info-grid">
        <div class="file-stat">
          <span class="file-stat-number">${sitemapData.urlCount}</span>
          <span class="file-stat-label">${sitemapData.isSitemapIndex ? 'Index URLs' : 'URLs'}</span>
        </div>
        <div class="file-stat">
          <span class="file-stat-number">${sitemapData.sitemapCount}</span>
          <span class="file-stat-label">Sitemaps</span>
        </div>
        <div class="file-stat">
          <span class="file-stat-number">${lastModDisplay}</span>
          <span class="file-stat-label">Last Modified</span>
        </div>
      </div>
      
      ${sitemapData.isSitemapIndex ? `
        <div style="background: #e0f2fe; color: #0277bd; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 12px;">
          📋 This is a sitemap index file containing references to other sitemaps.
        </div>
      ` : ''}
      
      ${sitemapData.urls.length > 0 ? `
        <div class="sitemap-urls">
          ${sitemapData.urls.slice(0, 8).map(urlData => `
            <div class="sitemap-url-item">
              <span class="sitemap-url">${urlData.loc}</span>
              ${urlData.priority ? `<span class="sitemap-priority">${urlData.priority}</span>` : ''}
            </div>
          `).join('')}
          ${sitemapData.urls.length > 8 ? `<div style="text-align: center; color: #6b7280; font-size: 11px; margin-top: 8px;">... and ${sitemapData.urls.length - 8} more ${sitemapData.isSitemapIndex ? 'sitemaps' : 'URLs'}</div>` : ''}
        </div>
      ` : `
        <div style="color: #d97706; font-size: 12px; margin-bottom: 12px;">
          ⚠️ Sitemap file found but contains no URLs. This may indicate an empty or malformed sitemap.
        </div>
        <div class="file-content-preview">
          <div class="file-content-text">${content.substring(0, 300)}${content.length > 300 ? '...' : ''}</div>
        </div>
      `}
      
      <a href="${url}" target="_blank" class="file-url-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="2"/>
          <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2"/>
        </svg>
        View sitemap.xml
      </a>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    detailsContainer.classList.remove('hidden');
  }

  displayRobotsNotFound(url) {
    const statusText = document.querySelector('#robots-status .status-text');
    const detailsContainer = document.getElementById('robots-details');
    
    statusText.textContent = 'Not Found ✗';
    statusText.className = 'status-text not-found';
    
    const detailsHTML = `
      <div style="color: #dc2626; font-size: 13px; margin-bottom: 12px;">
        ⚠️ No robots.txt file found. This may impact search engine crawling.
      </div>
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; color: #6b7280;">
        <strong>Why robots.txt matters:</strong><br>
        • Controls search engine crawler access<br>
        • Specifies sitemap locations<br>
        • Prevents indexing of sensitive pages<br>
        • Improves crawl efficiency
      </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    detailsContainer.classList.remove('hidden');
  }

  displaySitemapNotFound(url, lastError = null) {
    const statusText = document.querySelector('#sitemap-status .status-text');
    const detailsContainer = document.getElementById('sitemap-details');
    
    statusText.textContent = 'Not Found ✗';
    statusText.className = 'status-text not-found';
    
    let errorInfo = '';
    if (lastError) {
      errorInfo = `
        <div style="color: #d97706; font-size: 11px; margin-bottom: 8px; font-family: monospace;">
          Last error: ${lastError.message}
        </div>
      `;
    }
    
    const detailsHTML = `
      <div style="color: #dc2626; font-size: 13px; margin-bottom: 12px;">
        ⚠️ No sitemap.xml file found. This may impact search engine indexing.
      </div>
      ${errorInfo}
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; color: #6b7280;">
        <strong>Checked locations:</strong><br>
        • /sitemap.xml<br>
        • /sitemap_index.xml<br>
        • /sitemaps.xml<br>
        • /wp-sitemap.xml (WordPress)<br>
        • /sitemap-index.xml<br><br>
        <strong>Why sitemaps matter:</strong><br>
        • Help search engines discover pages<br>
        • Provide metadata about content<br>
        • Improve indexing efficiency<br>
        • Essential for large websites
      </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    detailsContainer.classList.remove('hidden');
  }

  displayRobotsError(error) {
    const statusText = document.querySelector('#robots-status .status-text');
    const detailsContainer = document.getElementById('robots-details');
    
    statusText.textContent = 'Error ⚠️';
    statusText.className = 'status-text error';
    
    detailsContainer.innerHTML = `<div style="color: #d97706;">Error checking robots.txt: ${error}</div>`;
    detailsContainer.classList.remove('hidden');
  }

  displaySitemapError(error) {
    const statusText = document.querySelector('#sitemap-status .status-text');
    const detailsContainer = document.getElementById('sitemap-details');
    
    statusText.textContent = 'Error ⚠️';
    statusText.className = 'status-text error';
    
    detailsContainer.innerHTML = `<div style="color: #d97706;">Error checking sitemap.xml: ${error}</div>`;
    detailsContainer.classList.remove('hidden');
  }

  parseRobotsContent(content) {
    const lines = content.split('\n');
    const userAgents = [];
    const sitemaps = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        const agent = trimmed.substring(11).trim();
        if (agent && !userAgents.includes(agent)) {
          userAgents.push(agent);
        }
      } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
        const sitemap = trimmed.substring(8).trim();
        if (sitemap && !sitemaps.includes(sitemap)) {
          sitemaps.push(sitemap);
        }
      }
    });
    
    return { userAgents, sitemaps };
  }

  parseSitemapContent(content) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      // Check for XML parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        return { urlCount: 0, sitemapCount: 0, urls: [], lastMod: null, error: 'Invalid XML format' };
      }
      
      // Handle both namespaced and non-namespaced XML
      // Try with namespace first, then without
      let sitemapElements = xmlDoc.querySelectorAll('sitemap, sitemapindex sitemap');
      let urlElements = xmlDoc.querySelectorAll('url, urlset url');
      
      // If no elements found, try with getElementsByTagName (namespace-agnostic)
      if (sitemapElements.length === 0) {
        sitemapElements = xmlDoc.getElementsByTagName('sitemap');
      }
      if (urlElements.length === 0) {
        urlElements = xmlDoc.getElementsByTagName('url');
      }
      
      const urls = [];
      
      // Process URL elements
      Array.from(urlElements).forEach(urlElement => {
        let loc = null;
        let priority = null;
        let lastmod = null;
        
        // Try querySelector first, then getElementsByTagName
        const locElement = urlElement.querySelector('loc') || urlElement.getElementsByTagName('loc')[0];
        const priorityElement = urlElement.querySelector('priority') || urlElement.getElementsByTagName('priority')[0];
        const lastmodElement = urlElement.querySelector('lastmod') || urlElement.getElementsByTagName('lastmod')[0];
        
        if (locElement) loc = locElement.textContent?.trim();
        if (priorityElement) priority = priorityElement.textContent?.trim();
        if (lastmodElement) lastmod = lastmodElement.textContent?.trim();
        
        if (loc) {
          urls.push({ loc, priority, lastmod });
        }
      });
      
      // Process sitemap index elements (for sitemap index files)
      const sitemapUrls = [];
      Array.from(sitemapElements).forEach(sitemapElement => {
        const locElement = sitemapElement.querySelector('loc') || sitemapElement.getElementsByTagName('loc')[0];
        const lastmodElement = sitemapElement.querySelector('lastmod') || sitemapElement.getElementsByTagName('lastmod')[0];
        
        if (locElement) {
          const loc = locElement.textContent?.trim();
          const lastmod = lastmodElement ? lastmodElement.textContent?.trim() : null;
          if (loc) {
            sitemapUrls.push({ loc, lastmod });
          }
        }
      });
      
      // If this is a sitemap index, show the sitemap URLs instead of regular URLs
      const finalUrls = sitemapUrls.length > 0 ? sitemapUrls : urls;
      
      return {
        urlCount: urls.length,
        sitemapCount: sitemapElements.length,
        urls: finalUrls,
        lastMod: finalUrls.length > 0 ? finalUrls[0].lastmod : null,
        isSitemapIndex: sitemapUrls.length > 0
      };
    } catch (error) {
      console.error('Error parsing sitemap content:', error);
      return { urlCount: 0, sitemapCount: 0, urls: [], lastMod: null, error: error.message };
    }
  }

  async checkLLMSFile() {
    const button = document.getElementById('check-llms');
    const statusText = document.querySelector('#llms-status .status-text');
    const detailsContainer = document.getElementById('llms-details');
    
    // Update button and status
    button.disabled = true;
    statusText.textContent = 'Checking...';
    statusText.className = 'status-text checking';
    
    try {
      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = new URL(tab.url);
      const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
      const llmsUrl = `${baseUrl}/llms.txt`;
      
      // Use exact same logic as reference extension
      let llmsContent = '';
      let contentAvailable = false;
      let fileExists = false;
      
      try {
        console.log(`🔍 Checking llms.txt at: ${llmsUrl}`);
        
        // EXACT logic from reference extension: just HEAD request
        const headResponse = await fetch(llmsUrl, { method: 'HEAD' });
        fileExists = headResponse.status === 200;
        
        console.log(`📊 HEAD Status: ${headResponse.status} => ${fileExists ? 'FOUND' : 'NOT FOUND'}`);
        
        // If file exists, try to get content for display (but don't change fileExists based on this)
        if (fileExists) {
          try {
            const contentResponse = await fetch(llmsUrl);
            if (contentResponse.status === 200) {
              llmsContent = await contentResponse.text();
              contentAvailable = true;
              console.log(`📝 Content fetched successfully (${llmsContent.length} chars)`);
            }
          } catch (contentError) {
            console.log(`⚠️ Could not fetch content (CORS blocked), but file exists based on HEAD`);
            // File exists but content not accessible due to CORS - that's okay
          }
        }
        
      } catch (e) {
        console.log(`❌ Error: ${e.message}`);
        fileExists = false;
      }
      
      if (fileExists) {
        // File exists
        this.displayLLMSResults(llmsUrl, llmsContent, contentAvailable);
      } else {
        // File doesn't exist
        this.displayLLMSNotFound(llmsUrl);
      }
      
    } catch (error) {
      console.error('Error checking llms.txt:', error);
      await this.displayLLMSError(error.message);
    } finally {
      button.disabled = false;
    }
  }

  displayLLMSResults(url, content, contentAvailable) {
    const statusText = document.querySelector('#llms-status .status-text');
    const detailsContainer = document.getElementById('llms-details');
    
    if (!detailsContainer) {
      console.error('LLMS details container not found!');
      return;
    }
    
    statusText.textContent = 'Found ✓';
    statusText.className = 'status-text found';
    
    // Add link directly to status area as fallback
    const statusContainer = document.querySelector('#llms-status');
    if (statusContainer && !statusContainer.querySelector('.llms-quick-link')) {
      const quickLink = document.createElement('a');
      quickLink.href = url;
      quickLink.target = '_blank';
      quickLink.className = 'llms-quick-link';
      quickLink.style.cssText = `
        display: inline-block;
        margin-left: 8px;
        color: #4f46e5;
        text-decoration: none;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        background: #f0f4ff;
        border-radius: 4px;
      `;
      quickLink.textContent = 'Open';
      statusContainer.appendChild(quickLink);
    }
    
    let detailsHTML = `
      <div style="color: #059669; font-size: 13px; margin-bottom: 12px;">
        ✅ LLMS.txt file found! This site provides AI training guidelines.
      </div>`;
    
    if (contentAvailable && content) {
      const lines = content.split('\n').length;
      const words = content.split(/\s+/).filter(word => word.length > 0).length;
      const chars = content.length;
      
      detailsHTML += `
        <div class="file-info-grid">
          <div class="file-stat">
            <span class="file-stat-number">${lines}</span>
            <span class="file-stat-label">Lines</span>
          </div>
          <div class="file-stat">
            <span class="file-stat-number">${words}</span>
            <span class="file-stat-label">Words</span>
          </div>
          <div class="file-stat">
            <span class="file-stat-number">${chars}</span>
            <span class="file-stat-label">Characters</span>
          </div>
        </div>
        
        <div class="file-content-preview" style="max-height: 80px;">
          <div class="file-content-text">${content.substring(0, 150)}${content.length > 150 ? '...' : ''}</div>
        </div>
      `;
    } else {
      detailsHTML += `
        <div style="color: #d97706; font-size: 12px; margin-bottom: 12px;">
          File exists but content cannot be displayed due to CORS restrictions.
        </div>
      `;
    }
    
    detailsHTML += `
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #f1f5f9; text-align: center;">
        <a href="${url}" target="_blank" style="
          display: inline-flex !important;
          align-items: center;
          gap: 6px;
          color: white;
          background: #4f46e5;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="2"/>
            <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2"/>
          </svg>
          View LLMS.txt
        </a>
      </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    detailsContainer.classList.remove('hidden');
    
    // Force visibility
    detailsContainer.style.display = 'block';
    detailsContainer.style.visibility = 'visible';
  }

  displayLLMSNotFound(url) {
    const statusText = document.querySelector('#llms-status .status-text');
    const detailsContainer = document.getElementById('llms-details');
    
    statusText.textContent = 'Not Found ✗';
    statusText.className = 'status-text not-found';
    
    const detailsHTML = `
      <div style="color: #dc2626; font-size: 13px; margin-bottom: 12px;">
        ⚠️ No LLMS.txt file found. This may impact AI training guidelines.
      </div>
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; color: #6b7280;">
        <strong>What is LLMS.txt?</strong><br>
        • Provides guidelines for AI language models<br>
        • Specifies training preferences and policies<br>
        • Controls how AI systems interact with content<br>
        • Emerging standard for AI-website interaction
      </div>
      
      <a href="${url}" target="_blank" class="file-url-link" style="margin-top: 12px; display: inline-flex;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="2"/>
          <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2"/>
        </svg>
        Try LLMS.txt URL
      </a>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    detailsContainer.classList.remove('hidden');
  }

  async displayLLMSError(errorMessage) {
    const statusText = document.querySelector('#llms-status .status-text');
    const detailsContainer = document.getElementById('llms-details');
    
    statusText.textContent = 'Error ⚠️';
    statusText.className = 'status-text error';
    
    // Get current domain for LLMS.txt URL
    let llmsUrl = 'https://example.com/llms.txt';
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = new URL(tab.url);
      const baseUrl = `${currentUrl.protocol}//${currentUrl.hostname}`;
      llmsUrl = `${baseUrl}/llms.txt`;
    } catch (e) {
      // Use fallback URL if we can't get current tab
    }
    
    const detailsHTML = `
      <div style="color: #d97706; font-size: 13px; margin-bottom: 12px;">
        ⚠️ Error checking LLMS.txt: ${errorMessage}
      </div>
      
      <a href="${llmsUrl}" target="_blank" class="file-url-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" stroke-width="2"/>
          <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2"/>
        </svg>
        Try LLMS.txt URL
      </a>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
    detailsContainer.classList.remove('hidden');
  }

  async loadTabData(tabName) {
    // Load tab-specific data if needed
    switch (tabName) {
      case 'geo':
        // Don't auto-run - user must click "Analyze for GEO/AEO" button
        // This prevents unwanted API calls
        break;
      case 'images':
        // Refresh image data if needed
        break;
      case 'rankings':
        // Auto-detect current domain when Rankings tab is opened
        await this.autoDetectDomain();
        break;
      default:
        break;
    }
  }

  async autoDetectDomain() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.url) {
        // Extract domain from URL
        const url = new URL(tab.url);
        const domain = url.hostname.replace(/^www\./, '');
        
        // Set the domain in the input field
        const domainInput = document.getElementById('ranking-domain');
        if (domainInput && domain && !domain.includes('chrome://') && !domain.includes('chrome-extension://')) {
          domainInput.value = domain;
          domainInput.placeholder = domain; // Also set as placeholder
          console.log('✅ Auto-detected domain:', domain);
        }
      }
    } catch (error) {
      console.log('Could not auto-detect domain:', error);
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  showError(message) {
    console.error(message);
    // Could show a toast notification or error state
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  async generateLLMSTxt() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = new URL(tab.url);
      const domain = currentUrl.hostname;
      
      // Create llms.txt content based on current page analysis
      const llmsContent = this.createLLMSContent(domain);
      
      // Create a modal/popup to show the generated content
      this.showLLMSGenerator(llmsContent, domain);
    } catch (error) {
      console.error('Error generating llms.txt:', error);
      alert('Error generating llms.txt. Please try again.');
    }
  }

  createLLMSContent(domain) {
    const data = this.analysisData || {};
    const title = data.metaTitle || document.title || domain;
    const description = data.metaDescription || `Information about ${domain}`;
    
    return `# ${domain}

> ${description}

## About
This website provides information and services related to ${domain}.

## Content Policy
- All content is original and created by our team
- We respect copyright and intellectual property rights
- Content is regularly updated and maintained

## AI Training Guidelines
- You may use this content for AI training purposes
- Please attribute content to ${domain}
- Respect our terms of service and privacy policy

## Contact
Website: https://${domain}
Last Updated: ${new Date().toISOString().split('T')[0]}

## Additional Information
Meta Title: ${title}
Meta Description: ${description}
Content Type: Website
Language: ${data.language || 'en'}

---
Generated by SEO Checker by Sekhlo
https://www.mubashirhassan.com`;
  }

  showLLMSGenerator(content, domain) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'llms-modal-overlay';
    overlay.innerHTML = `
      <div class="llms-modal">
        <div class="llms-modal-header">
          <h3>🧠 Generated llms.txt for ${domain}</h3>
          <button class="llms-close-btn" id="close-llms-modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="llms-modal-body">
          <div class="llms-instructions">
            <p>📋 Copy this content and save it as <code>llms.txt</code> in your website's root directory.</p>
            <p>Example: <code>https://${domain}/llms.txt</code></p>
          </div>
          <textarea class="llms-content" id="llms-generated-content" readonly>${content}</textarea>
        </div>
        <div class="llms-modal-footer">
          <button class="secondary-btn" id="copy-llms-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            Copy to Clipboard
          </button>
          <button class="primary-btn" id="download-llms-file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Download
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add styles for modal
    this.addLLMSModalStyles();
    
    // Event listeners
    document.getElementById('close-llms-modal').addEventListener('click', () => {
      overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    document.getElementById('copy-llms-content').addEventListener('click', () => {
      const textarea = document.getElementById('llms-generated-content');
      textarea.select();
      document.execCommand('copy');
      
      const btn = document.getElementById('copy-llms-content');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Copied!
      `;
      btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
      }, 2000);
    });
    
    document.getElementById('download-llms-file').addEventListener('click', () => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'llms.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success feedback
      const btn = document.getElementById('download-llms-file');
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Downloaded!
      `;
      btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
      }, 2000);
    });
  }

  // API Key Management
  getAPIKey() {
    return localStorage.getItem('perplexity_api_key') || '';
  }

  setAPIKey(key) {
    localStorage.setItem('perplexity_api_key', key);
  }


  // Perplexity AI Integration - Meta Tag Improvements
  async getMetaImprovements(currentTitle, currentDescription, pageUrl, pageContent, headings, apiKey) {
    try {
      const headingsList = headings.map(h => `[${h.level}] ${h.text}`).join('\n');
      
      const prompt = `As an SEO expert, analyze and improve these meta tags for better search engine visibility and click-through rates.

Page URL: ${pageUrl}
Current Meta Title: "${currentTitle}"
Current Meta Description: "${currentDescription}"

Page Content Preview: ${pageContent.substring(0, 1000)}...

Main Headings:
${headingsList}

Provide improved meta tag suggestions following these SEO best practices:

**For Meta Title:**
- Optimal length: 50-60 characters (under 60)
- Include primary keyword naturally
- Make it compelling and click-worthy
- Brand name at the end (if space allows)
- Avoid keyword stuffing
- Generate 3 different variations

**For Meta Description:**
- Optimal length: 150-160 characters (under 160)
- Include primary and secondary keywords
- Write compelling call-to-action
- Summarize page value proposition
- Make it engaging and informative
- Generate 3 different variations

Format your response as a JSON object:
{
  "title": {
    "current": "current title",
    "currentLength": number,
    "suggestions": [
      {
        "text": "improved title 1",
        "length": number,
        "reason": "why this is better",
        "isBest": true
      },
      ...
    ]
  },
  "description": {
    "current": "current description",
    "currentLength": number,
    "suggestions": [
      {
        "text": "improved description 1",
        "length": number,
        "reason": "why this is better",
        "isBest": true
      },
      ...
    ]
  }
}

Mark the best suggestion in each category with "isBest": true.
Only return the JSON object, no additional text.`;

      console.log('🚀 Requesting meta improvements from Perplexity AI...');
      
      // Validate API key
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('Perplexity AI API key is required for meta improvements');
      }
      
      const models = [
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-huge-128k-online',
        'sonar-pro',
        'sonar'
      ];
      
      let response = null;
      let lastError = null;
      
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        console.log(`🔄 Trying model ${i + 1}/${models.length}: ${model}`);
        
        const requestBody = {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2500,
          temperature: 0.3
        };
        
        try {
          response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            console.log(`✅ Model ${model} works!`);
            break;
          } else {
            const errorText = await response.text();
            lastError = errorText;
            console.warn(`⚠️ Model ${model} failed: ${response.status}`);
            if (response.status === 400 && i < models.length - 1) {
              continue;
            } else {
              throw new Error(`Perplexity API error: ${response.status}`);
            }
          }
        } catch (fetchError) {
          console.error(`❌ Fetch error for model ${model}:`, fetchError);
          lastError = fetchError.message;
          if (i === models.length - 1) {
            throw fetchError;
          }
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`All models failed. Last error: ${lastError}`);
      }

      const data = await response.json();
      console.log('📦 Raw API response:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }
      
      let content = data.choices[0].message.content;
      console.log('💬 AI response content:', content);
      
      // Clean up the response
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 Cleaned content:', content);
      
      // Parse the JSON response
      try {
        const suggestions = JSON.parse(content);
        console.log('✅ Parsed suggestions:', suggestions);
        
        if (!suggestions.title || !suggestions.description) {
          throw new Error('Response missing title or description');
        }
        
        return suggestions;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse JSON:', parseError);
        throw new Error('Failed to parse AI response. Please try again.');
      }

    } catch (error) {
      console.error('❌ Perplexity AI Meta Improvements Error:', error);
      throw error;
    }
  }

  displayMetaSuggestions(suggestions) {
    // Store AI meta suggestions in analysis data for export
    if (this.analysisData) {
      this.analysisData.aiMetaSuggestions = suggestions;
    }
    
    const section = document.getElementById('ai-meta-suggestions');
    const listContainer = document.getElementById('meta-suggestions-list');

    listContainer.innerHTML = '';

    // Title Suggestions
    const titleItem = document.createElement('div');
    titleItem.className = 'meta-suggestion-item';
    
    let titleOptionsHTML = '';
    suggestions.title.suggestions.forEach((suggestion, index) => {
      const lengthClass = suggestion.length <= 60 ? 'optimal' : 'warning';
      const bestBadge = suggestion.isBest ? '<div class="meta-best-badge">Recommended</div>' : '';
      
      titleOptionsHTML += `
        <div class="meta-option" data-text="${this.escapeHtml(suggestion.text)}">
          <div class="meta-option-number">${index + 1}</div>
          <div class="meta-option-text">${this.escapeHtml(suggestion.text)}</div>
          <div class="meta-option-length ${lengthClass}">${suggestion.length} characters ${suggestion.length <= 60 ? '✓' : '⚠️'}</div>
          <div class="meta-option-reason">${this.escapeHtml(suggestion.reason)}</div>
          ${bestBadge}
          <div class="meta-copy-hint">Click to copy</div>
        </div>
      `;
    });
    
    titleItem.innerHTML = `
      <div class="meta-suggestion-type">Meta Title</div>
      <div class="meta-current">
        <div class="meta-current-label">Current:</div>
        <div class="meta-current-text">${this.escapeHtml(suggestions.title.current)}</div>
        <div class="meta-current-length">${suggestions.title.currentLength} characters</div>
      </div>
      <div class="meta-suggestions-grid">
        ${titleOptionsHTML}
      </div>
    `;
    
    listContainer.appendChild(titleItem);

    // Description Suggestions
    const descItem = document.createElement('div');
    descItem.className = 'meta-suggestion-item';
    
    let descOptionsHTML = '';
    suggestions.description.suggestions.forEach((suggestion, index) => {
      const lengthClass = suggestion.length <= 160 ? 'optimal' : 'warning';
      const bestBadge = suggestion.isBest ? '<div class="meta-best-badge">Recommended</div>' : '';
      
      descOptionsHTML += `
        <div class="meta-option" data-text="${this.escapeHtml(suggestion.text)}">
          <div class="meta-option-number">${index + 1}</div>
          <div class="meta-option-text">${this.escapeHtml(suggestion.text)}</div>
          <div class="meta-option-length ${lengthClass}">${suggestion.length} characters ${suggestion.length <= 160 ? '✓' : '⚠️'}</div>
          <div class="meta-option-reason">${this.escapeHtml(suggestion.reason)}</div>
          ${bestBadge}
          <div class="meta-copy-hint">Click to copy</div>
        </div>
      `;
    });
    
    descItem.innerHTML = `
      <div class="meta-suggestion-type">Meta Description</div>
      <div class="meta-current">
        <div class="meta-current-label">Current:</div>
        <div class="meta-current-text">${this.escapeHtml(suggestions.description.current)}</div>
        <div class="meta-current-length">${suggestions.description.currentLength} characters</div>
      </div>
      <div class="meta-suggestions-grid">
        ${descOptionsHTML}
      </div>
    `;
    
    listContainer.appendChild(descItem);

    // Add click-to-copy functionality
    section.querySelectorAll('.meta-option').forEach(option => {
      option.addEventListener('click', async () => {
        const text = option.getAttribute('data-text');
        try {
          await navigator.clipboard.writeText(text);
          this.showNotification(`Copied: ${text.substring(0, 50)}...`, 'success');
          
          // Visual feedback
          option.style.background = '#d1fae5';
          setTimeout(() => {
            option.style.background = '#f0f9ff';
          }, 500);
        } catch (error) {
          console.error('Failed to copy:', error);
          alert('Failed to copy to clipboard');
        }
      });
    });

    section.classList.remove('hidden');
  }

  showMetaSuggestionsError(message) {
    const section = document.getElementById('ai-meta-suggestions');
    const listContainer = document.getElementById('meta-suggestions-list');
    
    listContainer.innerHTML = `
      <div class="suggestions-error">
        <strong>Error:</strong> ${message}
        <br><br>
        Please check your API key and try again.
      </div>
    `;
    
    section.classList.remove('hidden');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Perplexity AI Integration - Heading Improvements
  async getHeadingImprovements(headings, pageUrl, pageTitle, pageContent, apiKey) {
    try {
      // Format headings for the prompt
      const headingsList = headings.map((h, i) => `${i + 1}. [${h.level}] ${h.text}`).join('\n');
      
      const prompt = `As an SEO expert, analyze these webpage headings and provide specific improvement suggestions.

Page URL: ${pageUrl}
Page Title: ${pageTitle}
Content Preview: ${pageContent.substring(0, 1000)}...

Current Headings:
${headingsList}

For each heading that needs improvement, provide:
1. The original heading text
2. A suggested improved version that is more SEO-friendly, engaging, and clear
3. A brief reason why the improvement is better (keyword optimization, clarity, user intent, etc.)

Focus on:
- Including relevant keywords naturally
- Making headings more specific and descriptive  
- Improving click-through potential
- Following proper hierarchy (H1 should be most important)
- Making headings answer user questions
- Adding power words where appropriate

Format your response as a JSON array of suggestions:
[
  {
    "level": "H1",
    "original": "original heading text",
    "improved": "improved heading text",
    "reason": "why this is better"
  },
  ...
]

Only suggest improvements for headings that actually need them. Return empty array [] if all headings are already good.
Only return the JSON array, no additional text.`;

      console.log('🚀 Requesting heading improvements from Perplexity AI...');
      
      // Validate API key
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('Perplexity AI API key is required for heading improvements');
      }
      
      // Try different models
      const models = [
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-huge-128k-online',
        'sonar-pro',
        'sonar'
      ];
      
      let response = null;
      let lastError = null;
      
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        console.log(`🔄 Trying model ${i + 1}/${models.length}: ${model}`);
        
        const requestBody = {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.3
        };
        
        try {
          response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            console.log(`✅ Model ${model} works!`);
            break;
          } else {
            const errorText = await response.text();
            lastError = errorText;
            console.warn(`⚠️ Model ${model} failed: ${response.status}`);
            if (response.status === 400 && i < models.length - 1) {
              continue;
            } else {
              throw new Error(`Perplexity API error: ${response.status}`);
            }
          }
        } catch (fetchError) {
          console.error(`❌ Fetch error for model ${model}:`, fetchError);
          lastError = fetchError.message;
          if (i === models.length - 1) {
            throw fetchError;
          }
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`All models failed. Last error: ${lastError}`);
      }

      const data = await response.json();
      console.log('📦 Raw API response:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }
      
      let content = data.choices[0].message.content;
      console.log('💬 AI response content:', content);
      
      // Clean up the response
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 Cleaned content:', content);
      
      // Parse the JSON response
      try {
        const suggestions = JSON.parse(content);
        console.log('✅ Parsed suggestions:', suggestions);
        
        if (!Array.isArray(suggestions)) {
          throw new Error('Response is not an array');
        }
        
        return suggestions;
      } catch (parseError) {
        console.warn('⚠️ Failed to parse JSON:', parseError);
        throw new Error('Failed to parse AI response. Please try again.');
      }

    } catch (error) {
      console.error('❌ Perplexity AI Heading Improvements Error:', error);
      throw error;
    }
  }

  displayHeadingSuggestions(suggestions) {
    // Store AI heading suggestions in analysis data for export
    if (this.analysisData) {
      this.analysisData.aiHeadingSuggestions = suggestions;
    }
    
    const section = document.getElementById('ai-heading-suggestions');
    const listContainer = document.getElementById('heading-suggestions-list');

    listContainer.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
      listContainer.innerHTML = `
        <div class="suggestions-loading">
          ✅ Great! Your headings are already well-optimized for SEO.
          <br>No improvements needed at this time.
        </div>
      `;
      section.classList.remove('hidden');
      return;
    }

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      
      item.innerHTML = `
        <div class="suggestion-header">
          <span class="suggestion-level">${suggestion.level}</span>
          <div class="suggestion-content">
            <div class="suggestion-original">
              <strong>Current:</strong> ${suggestion.original}
            </div>
            <div class="suggestion-improved">${suggestion.improved}</div>
            <div class="suggestion-reason">${suggestion.reason}</div>
            <div class="suggestion-copy-hint">Click to copy improved heading</div>
          </div>
        </div>
      `;
      
      // Add click to copy functionality
      item.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(suggestion.improved);
          this.showNotification(`Copied: ${suggestion.improved}`, 'success');
          
          // Visual feedback
          item.style.background = '#d1fae5';
          setTimeout(() => {
            item.style.background = 'white';
          }, 500);
        } catch (error) {
          console.error('Failed to copy:', error);
          alert('Failed to copy to clipboard');
        }
      });
      
      listContainer.appendChild(item);
    });

    section.classList.remove('hidden');
  }

  showHeadingSuggestionsError(message) {
    const section = document.getElementById('ai-heading-suggestions');
    const listContainer = document.getElementById('heading-suggestions-list');
    
    listContainer.innerHTML = `
      <div class="suggestions-error">
        <strong>Error:</strong> ${message}
        <br><br>
        Please check your API key and try again.
      </div>
    `;
    
    section.classList.remove('hidden');
  }

  // Perplexity AI Integration - Keywords
  async getKeywordsFromPerplexity(url, pageContent, apiKey) {
    try {
      const prompt = `As an SEO expert, analyze this webpage content and extract the most relevant SEO keywords and phrases.

URL: ${url}
Content: ${pageContent.substring(0, 4000)}...

Please provide comprehensive keyword analysis:
1. 20-30 primary keywords (single words or short phrases) that best represent this page's content - focus on high-value, searchable terms
2. 15-20 long-tail keywords (longer phrases 3-6 words) that could drive targeted traffic - include question-based and conversational phrases
3. 10-15 semantic keywords (related terms, synonyms, and LSI keywords) - include industry-specific terminology

Format your response as a JSON object with three arrays:
{
  "primary": ["keyword1", "keyword2", "keyword3", ...],
  "longTail": ["long tail phrase 1", "long tail phrase 2", "long tail phrase 3", ...],
  "semantic": ["related term 1", "related term 2", "related term 3", ...]
}

Only return the JSON object, no additional text.`;

      console.log('🚀 Requesting keywords from Perplexity AI...');
      console.log('📝 Content preview:', pageContent.substring(0, 200) + '...');
      
      // Validate API key
      if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('Perplexity AI API key is required for AI keywords');
      }
      
      // Try different models - update this list based on your API access
      // Check https://docs.perplexity.ai/guides/model-cards for current models
      const models = [
        'llama-3.1-sonar-small-128k-online',
        'llama-3.1-sonar-large-128k-online',
        'llama-3.1-sonar-huge-128k-online',
        'sonar-pro',
        'sonar'
      ];
      
      let response = null;
      let lastError = null;
      
      // Try each model until one works
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        console.log(`🔄 Trying model ${i + 1}/${models.length}: ${model}`);
        
        const requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.2
        };
        
        console.log('📤 Request body:', JSON.stringify(requestBody).substring(0, 200) + '...');
        
        try {
          response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          console.log('📡 API Response status:', response.status);

          if (response.ok) {
            console.log(`✅ Model ${model} works!`);
            break; // Success! Exit the loop
          } else {
            const errorText = await response.text();
            lastError = errorText;
            console.warn(`⚠️ Model ${model} failed: ${response.status}`);
            
            // If it's a model error, try next model
            if (response.status === 400 && i < models.length - 1) {
              continue;
            } else {
              throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
            }
          }
        } catch (fetchError) {
          console.error(`❌ Fetch error for model ${model}:`, fetchError);
          lastError = fetchError.message;
          if (i === models.length - 1) {
            throw fetchError;
          }
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`All models failed. Last error: ${lastError}`);
      }

      const data = await response.json();
      console.log('📦 Raw API response:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }
      
      let content = data.choices[0].message.content;
      console.log('💬 AI response content:', content);
      
      // Clean up the response - remove markdown code blocks if present
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('🧹 Cleaned content:', content);
      
      // Parse the JSON response
      try {
        const keywordsData = JSON.parse(content);
        console.log('✅ Parsed keywords:', keywordsData);
        
        // Validate the structure
        if (!keywordsData.primary || !keywordsData.longTail || !keywordsData.semantic) {
          console.warn('⚠️ Response missing required fields, using fallback');
          return this.extractKeywordsFromText(content);
        }
        
        return keywordsData;
      } catch (parseError) {
        // Fallback: extract keywords from text response
        console.warn('⚠️ Failed to parse JSON, extracting keywords from text:', parseError);
        console.log('🔄 Attempting text extraction from:', content);
        return this.extractKeywordsFromText(content);
      }

    } catch (error) {
      console.error('❌ Perplexity AI Keywords Error:', error);
      throw error;
    }
  }

  extractKeywordsFromText(text) {
    // Fallback method to extract keywords if JSON parsing fails
    const lines = text.split('\n');
    const keywords = {
      primary: [],
      longTail: [],
      semantic: []
    };

    lines.forEach(line => {
      if (line.includes('"') || line.includes("'")) {
        const matches = line.match(/["']([^"']+)["']/g);
        if (matches) {
          matches.forEach(match => {
            const keyword = match.replace(/["']/g, '');
            if (keyword.length > 2) {
              if (keyword.split(' ').length === 1) {
                keywords.primary.push(keyword);
              } else if (keyword.split(' ').length > 3) {
                keywords.longTail.push(keyword);
              } else {
                keywords.semantic.push(keyword);
              }
            }
          });
        }
      }
    });

    return keywords;
  }

  // Test function to verify the integration works
  async testAIKeywords() {
    console.log('🧪 Testing AI Keywords with sample data...');
    
    const sampleKeywords = {
      primary: ["SEO", "keywords", "optimization", "content", "website"],
      longTail: ["search engine optimization", "keyword research tools", "content marketing strategy"],
      semantic: ["SERP", "ranking", "visibility", "traffic"]
    };
    
    console.log('📊 Displaying sample keywords:', sampleKeywords);
    this.displayAIKeywords(sampleKeywords);
    this.showNotification('Test keywords displayed successfully!', 'success');
  }

  // Global test function that can be called from console
  static testKeywordsDisplay() {
    console.log('🧪 Global test function called');
    const sampleKeywords = {
      primary: ["ChatGPT", "AI", "optimization", "ranking", "content"],
      longTail: ["ChatGPT ranking optimization", "AI search engine visibility", "content optimization for AI"],
      semantic: ["artificial intelligence", "machine learning", "natural language processing"]
    };
    
    // Create a temporary instance to test
    const tempAnalyzer = new UltimateSEOAnalyzer();
    tempAnalyzer.displayAIKeywords(sampleKeywords);
    
    console.log('✅ Test keywords should now be visible!');
    return sampleKeywords;
  }

  async getAIInsights(currentUrl, competitorUrl, keywords, apiKey) {
    try {
      const keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      let prompt;
      if (competitorUrl) {
        prompt = `As an SEO expert, analyze and compare two websites for the keywords: ${keywordsArray.join(', ')}.

Current Site: ${currentUrl}
Competitor Site: ${competitorUrl}

Provide 5-7 concise, actionable insights covering:
1. Keyword optimization opportunities
2. Content strategy recommendations
3. Technical SEO improvements
4. Competitive advantages/gaps
5. Quick wins to implement

Format each insight as a separate bullet point starting with an emoji.`;
      } else {
        prompt = `As an SEO expert, analyze this website for the keywords: ${keywordsArray.join(', ')}.

Website: ${currentUrl}

Provide 5-7 concise, actionable SEO insights covering:
1. Keyword optimization opportunities
2. Content strategy recommendations
3. Technical SEO improvements
4. On-page optimization tips
5. Quick wins to implement

Format each insight as a separate bullet point starting with an emoji.`;
      }

      console.log('Sending request to Perplexity AI...');
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are an expert SEO analyst. Provide concise, actionable insights formatted as bullet points with emojis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.3,
          top_p: 0.9,
          stream: false
        })
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Perplexity AI Error:', error);
      alert(`AI Analysis failed: ${error.message}`);
      return null;
    }
  }

  displayAIInsights(aiInsights) {
    const aiContainer = document.getElementById('ai-insights-content');
    if (!aiInsights) {
      aiContainer.innerHTML = '<p style="color: #6b7280;">No AI insights available.</p>';
      return;
    }
    
    // Split by lines and filter out empty ones
    const lines = aiInsights.split('\n').filter(line => line.trim());
    
    // Create insight items
    const insightHTML = lines.map(line => {
      const trimmedLine = line.trim();
      // Skip header lines or very short lines
      if (trimmedLine.length < 10 || trimmedLine.match(/^#+\s/)) {
        return '';
      }
      
      return `
        <div class="ai-insight-item">
          <div class="ai-insight-text">${this.escapeHtml(trimmedLine)}</div>
        </div>
      `;
    }).filter(html => html).join('');
    
    aiContainer.innerHTML = insightHTML || '<p style="color: #6b7280;">Processing insights...</p>';
  }

  displayCompetitorComparison(yourUrl, competitorUrl, competitorData) {
    const yourData = this.analysisData || {};
    
    // Display Your Site URL
    try {
      document.getElementById('your-site-url').textContent = new URL(yourUrl).hostname;
      document.getElementById('competitor-site-url').textContent = new URL(competitorUrl).hostname;
    } catch (e) {
      console.error('Error parsing URLs:', e);
    }
    
    // Your Site Metrics
    const yourMetrics = document.getElementById('your-site-metrics');
    const yourMetricsData = [
      { label: 'Meta Title', value: this.truncateText(yourData.metaTitle, 35) || 'N/A', fullValue: yourData.metaTitle, yours: yourData.metaTitle?.length || 0, theirs: competitorData.metaTitle?.length || 0 },
      { label: 'Meta Description', value: this.truncateText(yourData.metaDescription, 40) || 'N/A', fullValue: yourData.metaDescription, yours: yourData.metaDescription?.length || 0, theirs: competitorData.metaDescription?.length || 0 },
      { label: 'Word Count', value: yourData.wordCount || 0, yours: yourData.wordCount || 0, theirs: competitorData.wordCount || 0 },
      { label: 'H1 Tags', value: yourData.h1Count || 0, yours: yourData.h1Count || 0, theirs: competitorData.h1Count || 0 },
      { label: 'Images', value: yourData.images?.total || 0, yours: yourData.images?.total || 0, theirs: competitorData.images || 0 },
      { label: 'Images with Alt', value: yourData.images?.withAlt || 0, yours: yourData.images?.withAlt || 0, theirs: competitorData.imagesWithAlt || 0 },
      { label: 'Internal Links', value: yourData.internalLinks || 0, yours: yourData.internalLinks || 0, theirs: competitorData.internalLinks || 0 },
      { label: 'External Links', value: yourData.externalLinks || 0, yours: yourData.externalLinks || 0, theirs: competitorData.externalLinks || 0 },
      { label: 'Schema Markup', value: yourData.hasSchema ? '✓ Yes' : '✗ No', yours: yourData.hasSchema ? 1 : 0, theirs: competitorData.hasSchema ? 1 : 0 }
    ];
    
    yourMetrics.innerHTML = this.createMetricRows(yourMetricsData, true);
    
    // Competitor Metrics
    const competitorMetrics = document.getElementById('competitor-metrics');
    const competitorMetricsData = [
      { label: 'Meta Title', value: this.truncateText(competitorData.metaTitle, 35) || 'N/A', fullValue: competitorData.metaTitle, yours: yourData.metaTitle?.length || 0, theirs: competitorData.metaTitle?.length || 0 },
      { label: 'Meta Description', value: this.truncateText(competitorData.metaDescription, 40) || 'N/A', fullValue: competitorData.metaDescription, yours: yourData.metaDescription?.length || 0, theirs: competitorData.metaDescription?.length || 0 },
      { label: 'Word Count', value: competitorData.wordCount !== '?' ? competitorData.wordCount : 'Unknown', yours: yourData.wordCount || 0, theirs: competitorData.wordCount || 0 },
      { label: 'H1 Tags', value: competitorData.h1Count !== '?' ? competitorData.h1Count : 'Unknown', yours: yourData.h1Count || 0, theirs: competitorData.h1Count || 0 },
      { label: 'Images', value: competitorData.images !== '?' ? competitorData.images : 'Unknown', yours: yourData.images?.total || 0, theirs: competitorData.images || 0 },
      { label: 'Images with Alt', value: competitorData.imagesWithAlt !== '?' ? competitorData.imagesWithAlt : 'Unknown', yours: yourData.images?.withAlt || 0, theirs: competitorData.imagesWithAlt || 0 },
      { label: 'Internal Links', value: competitorData.internalLinks !== '?' ? competitorData.internalLinks : 'Unknown', yours: yourData.internalLinks || 0, theirs: competitorData.internalLinks || 0 },
      { label: 'External Links', value: competitorData.externalLinks !== '?' ? competitorData.externalLinks : 'Unknown', yours: yourData.externalLinks || 0, theirs: competitorData.externalLinks || 0 },
      { label: 'Schema Markup', value: competitorData.hasSchema ? '✓ Yes' : '✗ No', yours: yourData.hasSchema ? 1 : 0, theirs: competitorData.hasSchema ? 1 : 0 }
    ];
    
    competitorMetrics.innerHTML = this.createMetricRows(competitorMetricsData, false);
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  createMetricRows(metrics, isYours = true) {
    return metrics.map(metric => {
      let statusClass = '';
      let statusIcon = '';
      
      // Determine if this metric is better, worse, or equal
      if (typeof metric.yours === 'number' && typeof metric.theirs === 'number') {
        if (metric.yours > metric.theirs) {
          statusClass = isYours ? 'better' : 'worse';
          statusIcon = isYours ? '↑' : '↓';
        } else if (metric.yours < metric.theirs) {
          statusClass = isYours ? 'worse' : 'better';
          statusIcon = isYours ? '↓' : '↑';
        } else {
          statusClass = 'equal';
          statusIcon = '=';
        }
      }
      
      return `
        <div class="metric-row">
          <span class="metric-label">${metric.label}</span>
          <span class="metric-value ${statusClass}" title="${metric.fullValue || metric.value}">
            ${metric.value} ${statusIcon ? '<span class="status-icon">' + statusIcon + '</span>' : ''}
          </span>
        </div>
      `;
    }).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addLLMSModalStyles() {
    if (document.getElementById('llms-modal-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'llms-modal-styles';
    style.textContent = `
      .llms-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .llms-modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .llms-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 16px 16px 0 0;
      }

      .llms-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }

      .llms-close-btn {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
      }

      .llms-close-btn:hover {
        background: #e5e7eb;
        color: #1f2937;
      }

      .llms-modal-body {
        padding: 24px;
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .llms-instructions {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 1px solid #93c5fd;
        border-radius: 8px;
        padding: 16px;
        font-size: 13px;
        line-height: 1.6;
        color: #1e40af;
      }

      .llms-instructions p {
        margin: 0 0 8px 0;
      }

      .llms-instructions p:last-child {
        margin-bottom: 0;
      }

      .llms-instructions code {
        background: white;
        border: 1px solid #bfdbfe;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        color: #1e40af;
      }

      .llms-content {
        width: 100%;
        min-height: 300px;
        max-height: 400px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 12px;
        line-height: 1.6;
        resize: vertical;
        background: #f8fafc;
        color: #1f2937;
      }

      .llms-modal-footer {
        display: flex;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
        border-radius: 0 0 16px 16px;
      }

      .llms-modal-footer button {
        flex: 1;
      }
    `;
    
    document.head.appendChild(style);
  }

  // GEO Analysis Functions
  async performGEOAnalysis(url, keywords) {
    try {
      // Get current page content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      let pageData = {};
      
      try {
        const response = await this.sendMessageToTab(tab.id, { action: 'getPageData' });
        if (response && response.success && response.data) {
          pageData = response.data;
          console.log('Page data received:', pageData);
        } else {
          console.warn('Invalid page data response:', response);
          throw new Error('Invalid page data response');
        }
      } catch (error) {
        console.warn('Could not get page data, using fallback analysis:', error);
        // Use basic page data as fallback
        pageData = {
          url: tab.url,
          title: tab.title || '',
          content: '',
          textContent: '',
          headings: [],
          images: [],
          wordCount: 0,
          metaDescription: '',
          structuredData: [],
          viewport: ''
        };
      }
      
      // Ensure pageData has required properties with actual data
      const finalPageData = {
        url: tab.url,
        title: pageData.title || tab.title || '',
        content: pageData.content || '',
        textContent: pageData.textContent || '',
        headings: pageData.headings || [],
        images: pageData.images || [],
        wordCount: pageData.wordCount || 0,
        metaDescription: pageData.metaDescription || '',
        structuredData: pageData.structuredData || [],
        viewport: pageData.viewport || '',
        links: pageData.links || [],
        technicalChecks: pageData.technicalChecks || []
      };
      
      console.log('Final page data for analysis:', {
        url: finalPageData.url,
        title: finalPageData.title,
        wordCount: finalPageData.wordCount,
        headingsCount: finalPageData.headings.length,
        imagesCount: finalPageData.images.length,
        hasMetaDescription: !!finalPageData.metaDescription,
        hasStructuredData: finalPageData.structuredData.length > 0
      });
      
      // Analyze content for GEO factors
      const geoFactors = this.analyzeGEOFactors(finalPageData, keywords);
      console.log('GEO factors analyzed:', geoFactors);
      
      // Calculate GEO score
      const score = this.calculateGEOScore(geoFactors);
      console.log('GEO score calculated:', score);
      
      // Generate recommendations
      const recommendations = this.generateGEORecommendations(geoFactors, finalPageData);
      console.log('Recommendations generated:', recommendations.length);
      
      return {
        url,
        keywords,
        score,
        factors: geoFactors,
        recommendations,
        pageData: finalPageData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error performing GEO analysis:', error);
      throw error;
    }
  }

  analyzeGEOFactors(pageData, keywords) {
    const factors = {
      contentStructure: this.analyzeContentStructure(pageData),
      answerPotential: this.analyzeAnswerPotential(pageData, keywords),
      aiReadiness: this.analyzeAIReadiness(pageData),
      semanticStructure: this.analyzeSemanticStructure(pageData),
      factualAccuracy: this.analyzeFactualAccuracy(pageData),
      citationQuality: this.analyzeCitationQuality(pageData),
      contentDepth: this.analyzeContentDepth(pageData, keywords),
      aiEngineCompatibility: this.analyzeAIEngineCompatibility(pageData)
    };

    return factors;
  }

  analyzeContentStructure(pageData) {
    const score = {
      total: 0,
      max: 100,
      factors: []
    };

    // Check for clear headings hierarchy
    const headings = pageData.headings || [];
    const hasH1 = headings.some(h => h.level === 1);
    const hasLogicalStructure = this.checkHeadingStructure(headings);
    
    if (hasH1) {
      score.total += 15;
      score.factors.push({ name: 'Has H1 tag', status: 'pass', points: 15 });
    } else {
      score.factors.push({ name: 'Missing H1 tag', status: 'fail', points: 0 });
    }

    if (hasLogicalStructure) {
      score.total += 15;
      score.factors.push({ name: 'Logical heading structure', status: 'pass', points: 15 });
    } else {
      score.factors.push({ name: 'Poor heading structure', status: 'fail', points: 0 });
    }

    // Check for lists and structured content
    const hasLists = pageData.content && (pageData.content.includes('<ul>') || pageData.content.includes('<ol>'));
    if (hasLists) {
      score.total += 10;
      score.factors.push({ name: 'Contains structured lists', status: 'pass', points: 10 });
    } else {
      score.factors.push({ name: 'No structured lists found', status: 'warning', points: 0 });
    }

    // Check for tables
    const hasTables = pageData.content && pageData.content.includes('<table>');
    if (hasTables) {
      score.total += 10;
      score.factors.push({ name: 'Contains data tables', status: 'pass', points: 10 });
    }

    // Check for FAQ structure
    const hasFAQ = this.detectFAQStructure(pageData);
    if (hasFAQ) {
      score.total += 20;
      score.factors.push({ name: 'FAQ structure detected', status: 'pass', points: 20 });
    } else {
      score.factors.push({ name: 'No FAQ structure', status: 'warning', points: 0 });
    }

    // Check for step-by-step content
    const hasSteps = this.detectStepByStepContent(pageData);
    if (hasSteps) {
      score.total += 15;
      score.factors.push({ name: 'Step-by-step content', status: 'pass', points: 15 });
    }

    // Check for definitions
    const hasDefinitions = this.detectDefinitions(pageData);
    if (hasDefinitions) {
      score.total += 15;
      score.factors.push({ name: 'Contains definitions', status: 'pass', points: 15 });
    }

    return score;
  }

  analyzeAnswerPotential(pageData, keywords) {
    const keywordArray = keywords ? keywords.toLowerCase().split(',').map(k => k.trim()) : [];
    const content = (pageData.textContent || pageData.content || pageData.htmlContent || '').toLowerCase();
    const title = (pageData.title || '').toLowerCase();
    const headings = pageData.headings || [];
    
    console.log('Analyzing answer potential with content length:', content.length);
    
    const potential = {
      directAnswers: 0,
      questionAnswering: 0,
      factualContent: 0,
      examples: 0,
      total: 0
    };

    // Base score if content exists
    if (content.length > 100) {
      potential.questionAnswering = 20;
      potential.factualContent = 15;
      potential.examples = 10;
    }

    // Check for direct answers to common question patterns
    const questionPatterns = [
      'what is', 'how to', 'why does', 'when should', 'where can',
      'which is', 'who is', 'how does', 'what are', 'how can',
      'what does', 'how much', 'how many', 'when is', 'where is'
    ];

    let questionScore = 0;
    questionPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = (content.match(regex) || []).length + (title.match(regex) || []).length;
      questionScore += matches * 8;
    });
    potential.questionAnswering = Math.min(100, potential.questionAnswering + questionScore);

    // Check for factual indicators with more patterns
    const factualIndicators = [
      'according to', 'research shows', 'studies indicate', 'data reveals', 'statistics show',
      'survey found', 'report states', 'analysis shows', 'findings suggest', 'evidence indicates',
      'percent', '%', 'million', 'billion', 'thousand', 'years', 'months', 'days',
      'published', 'study', 'research', 'data', 'statistics', 'facts', 'evidence'
    ];
    
    let factualScore = 0;
    factualIndicators.forEach(indicator => {
      const regex = new RegExp(indicator, 'gi');
      const matches = (content.match(regex) || []).length;
      factualScore += matches * 4;
    });
    potential.factualContent = Math.min(100, potential.factualContent + factualScore);

    // Check for examples with more comprehensive patterns
    const exampleIndicators = [
      'for example', 'such as', 'including', 'like', 'instance', 'e.g.',
      'for instance', 'namely', 'specifically', 'in particular', 'case study',
      'example:', 'examples:', 'sample', 'demonstration', 'illustration'
    ];
    
    let exampleScore = 0;
    exampleIndicators.forEach(indicator => {
      const regex = new RegExp(indicator, 'gi');
      const matches = (content.match(regex) || []).length;
      exampleScore += matches * 5;
    });
    potential.examples = Math.min(100, potential.examples + exampleScore);

    // Check for structured content (lists, headings)
    if (headings.length > 2) {
      potential.questionAnswering += 15;
    }
    
    // Check for lists in content
    const listMatches = (content.match(/<li>|<ol>|<ul>|\n\s*[-*•]\s/gi) || []).length;
    if (listMatches > 0) {
      potential.examples += Math.min(20, listMatches * 3);
    }

    // Check for keyword relevance
    let keywordRelevance = 0;
    keywordArray.forEach(keyword => {
      if (keyword && keyword.length > 2) {
        const regex = new RegExp(keyword, 'gi');
        const matches = (content.match(regex) || []).length + (title.match(regex) || []).length;
        keywordRelevance += matches * 10;
      }
    });

    // Add keyword bonus to all categories
    if (keywordRelevance > 0) {
      potential.questionAnswering = Math.min(100, potential.questionAnswering + Math.floor(keywordRelevance * 0.3));
      potential.factualContent = Math.min(100, potential.factualContent + Math.floor(keywordRelevance * 0.2));
      potential.examples = Math.min(100, potential.examples + Math.floor(keywordRelevance * 0.2));
    }

    // Calculate total score
    potential.total = Math.round((potential.questionAnswering + potential.factualContent + potential.examples) / 3);

    console.log('Answer potential analysis result:', potential);
    return potential;
  }

  analyzeAIReadiness(pageData) {
    const readiness = {
      total: 0,
      max: 100,
      factors: []
    };

    // Check for structured data
    const hasStructuredData = pageData.structuredData && pageData.structuredData.length > 0;
    if (hasStructuredData) {
      readiness.total += 25;
      readiness.factors.push({ name: 'Structured data present', status: 'pass', points: 25 });
    } else {
      readiness.factors.push({ name: 'No structured data', status: 'fail', points: 0 });
    }

    // Check for semantic HTML
    const hasSemanticHTML = this.checkSemanticHTML(pageData);
    if (hasSemanticHTML) {
      readiness.total += 20;
      readiness.factors.push({ name: 'Semantic HTML structure', status: 'pass', points: 20 });
    } else {
      readiness.factors.push({ name: 'Poor semantic structure', status: 'warning', points: 0 });
    }

    // Check for meta descriptions
    const hasMetaDescription = pageData.metaDescription && pageData.metaDescription.length > 0;
    if (hasMetaDescription) {
      readiness.total += 15;
      readiness.factors.push({ name: 'Meta description present', status: 'pass', points: 15 });
    } else {
      readiness.factors.push({ name: 'Missing meta description', status: 'fail', points: 0 });
    }

    // Check for alt text on images
    const hasAltText = pageData.images && pageData.images.some(img => img.alt && img.alt.length > 0);
    if (hasAltText) {
      readiness.total += 10;
      readiness.factors.push({ name: 'Images have alt text', status: 'pass', points: 10 });
    } else {
      readiness.factors.push({ name: 'Missing image alt text', status: 'warning', points: 0 });
    }

    // Check for clean URLs
    const hasCleanURL = !pageData.url || !pageData.url.includes('?');
    if (hasCleanURL) {
      readiness.total += 10;
      readiness.factors.push({ name: 'Clean URL structure', status: 'pass', points: 10 });
    }

    // Check for HTTPS
    const isHTTPS = pageData.url && pageData.url.startsWith('https://');
    if (isHTTPS) {
      readiness.total += 10;
      readiness.factors.push({ name: 'HTTPS enabled', status: 'pass', points: 10 });
    } else {
      readiness.factors.push({ name: 'Not using HTTPS', status: 'fail', points: 0 });
    }

    // Check for mobile optimization
    const hasMobileOptimization = pageData.viewport && pageData.viewport.includes('width=device-width');
    if (hasMobileOptimization) {
      readiness.total += 10;
      readiness.factors.push({ name: 'Mobile optimized', status: 'pass', points: 10 });
    } else {
      readiness.factors.push({ name: 'Not mobile optimized', status: 'warning', points: 0 });
    }

    return readiness;
  }

  analyzeSemanticStructure(pageData) {
    const htmlContent = (pageData.content || '').toLowerCase();
    const textContent = (pageData.textContent || '').toLowerCase();
    const title = (pageData.title || '').toLowerCase();
    
    let score = 0;
    
    // Check for semantic HTML elements
    const semanticElements = ['<article>', '<section>', '<header>', '<footer>', '<nav>', '<aside>', '<main>'];
    const semanticCount = semanticElements.filter(el => htmlContent.includes(el)).length;
    score += (semanticCount / semanticElements.length) * 30;
    
    // Check for entity-like patterns (proper nouns, dates, numbers) in text content
    const entityPatterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
      /\b\d{4}\b/g, // Years
      /\b\d+%\b/g, // Percentages
      /\$\d+/g // Prices
    ];
    
    let entityCount = 0;
    entityPatterns.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) entityCount += matches.length;
    });
    
    score += Math.min(30, entityCount * 2);
    
    // Check for topic clustering (related terms appearing together)
    const topicIndicators = ['according to', 'research shows', 'studies indicate', 'experts say', 'data reveals'];
    const topicScore = topicIndicators.filter(indicator => textContent.includes(indicator)).length * 8;
    score += Math.min(25, topicScore);
    
    // Check contextual relevance (title-content alignment)
    if (title && textContent) {
      const titleWords = title.split(/\s+/).filter(word => word.length > 3);
      const contentRelevance = titleWords.filter(word => textContent.includes(word)).length;
      score += (contentRelevance / Math.max(titleWords.length, 1)) * 15;
    }
    
    return {
      score: Math.min(100, Math.round(score)),
      entityRecognition: entityCount > 5,
      topicClustering: topicScore > 0,
      contextualRelevance: Math.min(100, Math.round(score * 0.8))
    };
  }

  analyzeFactualAccuracy(pageData) {
    const content = (pageData.content || '').toLowerCase();
    let score = 0;
    
    // Check for references and citations
    const hasExternalLinks = content.includes('http');
    const hasReferences = content.includes('source') || content.includes('reference') || content.includes('citation');
    if (hasExternalLinks) score += 25;
    if (hasReferences) score += 15;
    
    // Check for factual indicators
    const factualIndicators = [
      'according to', 'research shows', 'studies indicate', 'data reveals', 
      'statistics show', 'survey found', 'analysis shows', 'report states'
    ];
    const factualCount = factualIndicators.filter(indicator => content.includes(indicator)).length;
    score += Math.min(25, factualCount * 5);
    
    // Check for date relevance (recent dates)
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear, currentYear - 1, currentYear - 2];
    const hasRecentDates = recentYears.some(year => content.includes(year.toString()));
    if (hasRecentDates) score += 15;
    
    // Check for authority signals
    const authoritySignals = ['expert', 'professor', 'dr.', 'phd', 'certified', 'official', 'government'];
    const authorityCount = authoritySignals.filter(signal => content.includes(signal)).length;
    score += Math.min(20, authorityCount * 4);
    
    return {
      score: Math.min(100, score),
      hasReferences: hasExternalLinks || hasReferences,
      dateRelevance: hasRecentDates,
      authoritySignals: Math.min(100, authorityCount * 15)
    };
  }

  analyzeCitationQuality(pageData) {
    const content = pageData.content || '';
    const hasLinks = content.includes('<a href=');
    const hasExternalLinks = content.includes('http');
    
    return {
      score: hasLinks && hasExternalLinks ? 85 : hasLinks ? 60 : 30,
      externalReferences: hasExternalLinks,
      internalLinks: hasLinks,
      authorityDomains: hasExternalLinks ? Math.floor(Math.random() * 5) + 1 : 0
    };
  }

  analyzeContentDepth(pageData, keywords) {
    const wordCount = pageData.wordCount || 0;
    const keywordArray = keywords.toLowerCase().split(',').map(k => k.trim());
    const content = (pageData.content || '').toLowerCase();
    
    let topicCoverage = 0;
    keywordArray.forEach(keyword => {
      if (content.includes(keyword)) {
        topicCoverage += 20;
      }
    });

    return {
      score: Math.min(100, (wordCount / 10) + topicCoverage),
      wordCount,
      topicCoverage: Math.min(100, topicCoverage),
      comprehensiveness: wordCount > 1000 ? 'High' : wordCount > 500 ? 'Medium' : 'Low'
    };
  }

  analyzeAIEngineCompatibility(pageData) {
    const content = (pageData.content || '').toLowerCase();
    const hasStructuredData = pageData.structuredData && pageData.structuredData.length > 0;
    const wordCount = pageData.wordCount || 0;
    const hasHeadings = pageData.headings && pageData.headings.length > 0;
    const hasLists = content.includes('<ul>') || content.includes('<ol>');
    const hasFAQ = this.detectFAQStructure(pageData);
    const hasDefinitions = this.detectDefinitions(pageData);
    
    // Base score calculation
    let baseScore = 40;
    if (hasStructuredData) baseScore += 15;
    if (wordCount > 300) baseScore += 10;
    if (hasHeadings) baseScore += 10;
    if (hasLists) baseScore += 8;
    if (hasFAQ) baseScore += 12;
    if (hasDefinitions) baseScore += 5;
    
    // Engine-specific optimizations
    const chatgptScore = baseScore + (hasFAQ ? 15 : 0) + (hasDefinitions ? 10 : 0);
    const perplexityScore = baseScore + (hasStructuredData ? 20 : 0) + (content.includes('source') ? 10 : 0);
    const claudeScore = baseScore + (wordCount > 500 ? 15 : 0) + (hasLists ? 10 : 0);
    const googleScore = baseScore + (hasStructuredData ? 25 : 0) + (pageData.metaDescription ? 10 : 0);
    const bingScore = baseScore + (hasHeadings ? 15 : 0) + (content.includes('http') ? 10 : 0);
    
    const getStatus = (score) => score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'poor';
    
    return {
      chatgpt: {
        score: Math.min(100, chatgptScore),
        status: getStatus(chatgptScore)
      },
      perplexity: {
        score: Math.min(100, perplexityScore),
        status: getStatus(perplexityScore)
      },
      claude: {
        score: Math.min(100, claudeScore),
        status: getStatus(claudeScore)
      },
      google: {
        score: Math.min(100, googleScore),
        status: getStatus(googleScore)
      },
      bing: {
        score: Math.min(100, bingScore),
        status: getStatus(bingScore)
      }
    };
  }

  calculateGEOScore(factors) {
    const weights = {
      contentStructure: 0.25,
      answerPotential: 0.20,
      aiReadiness: 0.20,
      semanticStructure: 0.10,
      factualAccuracy: 0.10,
      citationQuality: 0.10,
      contentDepth: 0.05
    };

    let totalScore = 0;
    totalScore += (factors.contentStructure.total / factors.contentStructure.max) * 100 * weights.contentStructure;
    totalScore += (factors.answerPotential.total / 100) * 100 * weights.answerPotential;
    totalScore += (factors.aiReadiness.total / factors.aiReadiness.max) * 100 * weights.aiReadiness;
    totalScore += (factors.semanticStructure.score / 100) * 100 * weights.semanticStructure;
    totalScore += (factors.factualAccuracy.score / 100) * 100 * weights.factualAccuracy;
    totalScore += (factors.citationQuality.score / 100) * 100 * weights.citationQuality;
    totalScore += (factors.contentDepth.score / 100) * 100 * weights.contentDepth;

    return Math.round(totalScore);
  }

  generateGEORecommendations(factors, pageData) {
    const recommendations = [];

    try {
      // Content Structure recommendations
      if (factors.contentStructure && factors.contentStructure.total < 60) {
        recommendations.push({
          title: 'Improve Content Structure',
          description: 'Add clear headings, lists, and FAQ sections to make your content more AI-friendly.',
          priority: 'high',
          icon: '📋',
          actions: ['Add H1-H6 headings', 'Create FAQ section', 'Use bullet points and numbered lists']
        });
      }

      // Answer Potential recommendations
      if (factors.answerPotential && factors.answerPotential.total < 50) {
        recommendations.push({
          title: 'Enhance Answer Potential',
          description: 'Structure content to directly answer common questions about your topic.',
          priority: 'high',
          icon: '❓',
          actions: ['Add question-answer format', 'Include direct definitions', 'Provide clear examples']
        });
      }

      // AI Readiness recommendations
      if (factors.aiReadiness && factors.aiReadiness.total < 70) {
        recommendations.push({
          title: 'Improve AI Readiness',
          description: 'Add structured data and semantic markup to help AI engines understand your content.',
          priority: 'medium',
          icon: '🤖',
          actions: ['Add structured data markup', 'Improve semantic HTML', 'Add meta descriptions']
        });
      }

      // Citation Quality recommendations
      if (factors.citationQuality && factors.citationQuality.score < 60) {
        recommendations.push({
          title: 'Add Authoritative Citations',
          description: 'Include links to authoritative sources to improve credibility for AI engines.',
          priority: 'medium',
          icon: '🔗',
          actions: ['Link to authoritative sources', 'Add internal links', 'Cite recent studies']
        });
      }

      // Content Depth recommendations
      if (factors.contentDepth && factors.contentDepth.score < 50) {
        recommendations.push({
          title: 'Increase Content Depth',
          description: 'Expand your content to provide comprehensive coverage of the topic.',
          priority: 'low',
          icon: '📚',
          actions: ['Add more detailed explanations', 'Include related subtopics', 'Provide comprehensive examples']
        });
      }

      // Always provide at least some basic recommendations
      if (recommendations.length === 0) {
        recommendations.push(
          {
            title: 'Optimize for Question Answering',
            description: 'Structure your content to directly answer common questions about your topic.',
            priority: 'high',
            icon: '❓',
            actions: ['Use question-answer format', 'Add clear definitions', 'Include practical examples']
          },
          {
            title: 'Improve Content Structure',
            description: 'Use proper headings and organize content for better AI comprehension.',
            priority: 'medium',
            icon: '📋',
            actions: ['Add H1-H6 headings', 'Use bullet points', 'Create logical sections']
          },
          {
            title: 'Add Authoritative Sources',
            description: 'Include citations and links to build credibility with AI engines.',
            priority: 'medium',
            icon: '🔗',
            actions: ['Link to authoritative sources', 'Add references', 'Include data and statistics']
          }
        );
      }
    } catch (error) {
      console.warn('Error generating recommendations, using fallback:', error);
      // Fallback recommendations
      recommendations.push(
        {
          title: 'Basic GEO Optimization',
          description: 'Start with fundamental optimizations for AI-driven search.',
          priority: 'high',
          icon: '🎯',
          actions: ['Use clear headings', 'Answer common questions', 'Add structured content']
        }
      );
    }

    return recommendations;
  }

  // Helper functions
  checkHeadingStructure(headings) {
    if (!headings || headings.length === 0) return false;
    
    let currentLevel = 0;
    for (const heading of headings) {
      if (heading.level > currentLevel + 1) {
        return false; // Skipped a level
      }
      currentLevel = Math.max(currentLevel, heading.level);
    }
    return true;
  }

  detectFAQStructure(pageData) {
    const content = (pageData.content || '').toLowerCase();
    const faqIndicators = ['frequently asked questions', 'faq', 'q:', 'question:', 'a:', 'answer:'];
    return faqIndicators.some(indicator => content.includes(indicator));
  }

  detectStepByStepContent(pageData) {
    const content = (pageData.content || '').toLowerCase();
    const stepIndicators = ['step 1', 'step 2', 'first,', 'second,', 'then,', 'next,', 'finally,'];
    return stepIndicators.some(indicator => content.includes(indicator));
  }

  detectDefinitions(pageData) {
    const content = (pageData.content || '').toLowerCase();
    const definitionIndicators = ['is defined as', 'refers to', 'means', 'is a', 'definition'];
    return definitionIndicators.some(indicator => content.includes(indicator));
  }

  checkSemanticHTML(pageData) {
    const content = pageData.content || '';
    const semanticTags = ['<article>', '<section>', '<header>', '<footer>', '<nav>', '<aside>', '<main>'];
    return semanticTags.some(tag => content.includes(tag));
  }

  // Display functions
  displayCurrentPageInfo(url, title, keywords) {
    document.getElementById('current-page-url').textContent = url || '--';
    document.getElementById('current-page-title').textContent = title || '--';
    document.getElementById('detected-keywords').textContent = keywords || '--';
  }

  displayGEOScore(score, factors) {
    const scoreElement = document.getElementById('geo-score');
    const statusElement = document.getElementById('geo-score-status');
    const progressElement = document.getElementById('geo-score-progress');

    scoreElement.textContent = score;
    
    let status, color;
    if (score >= 80) {
      status = 'Excellent';
      color = '#10b981';
    } else if (score >= 60) {
      status = 'Good';
      color = '#f59e0b';
    } else {
      status = 'Needs Work';
      color = '#ef4444';
    }

    statusElement.textContent = status;
    statusElement.style.color = color;

    // Animate progress circle
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (score / 100) * circumference;
    progressElement.style.strokeDashoffset = offset;

    // Update quick metrics with real data
    if (factors) {
      const aiReadiness = factors.aiReadiness ? Math.round((factors.aiReadiness.total / factors.aiReadiness.max) * 100) : 0;
      const contentQuality = factors.semanticStructure ? Math.round(factors.semanticStructure.score) : 0;
      const answerPotential = factors.answerPotential ? Math.round(factors.answerPotential.total) : 0;
      
      document.getElementById('ai-readiness').textContent = aiReadiness + '%';
      document.getElementById('content-quality').textContent = contentQuality + '%';
      document.getElementById('answer-potential').textContent = answerPotential + '%';
    }
  }

  displayGEOResults(geoAnalysis) {
    this.displayAIEngineCompatibility(geoAnalysis.factors.aiEngineCompatibility);
    this.displayStructureAnalysis(geoAnalysis.factors.contentStructure);
    this.displayAnswerPotential(geoAnalysis.factors.answerPotential);
  }

  displayAIEngineCompatibility(compatibility) {
    const container = document.getElementById('ai-engine-scores');
    container.innerHTML = '';

    // Show only 3 engines in 1 row
    const engines = [
      { name: 'ChatGPT', logo: '🤖', data: compatibility.chatgpt },
      { name: 'Perplexity', logo: '🔍', data: compatibility.perplexity },
      { name: 'Claude', logo: '🧠', data: compatibility.claude }
    ];

    engines.forEach(engine => {
      const card = document.createElement('div');
      card.className = `ai-engine-card ${engine.data.status}`;
      card.innerHTML = `
        <div class="ai-engine-logo">${engine.logo}</div>
        <div class="ai-engine-name">${engine.name}</div>
        <div class="ai-engine-score ${engine.data.status}">${engine.data.score}%</div>
        <div class="ai-engine-status">${engine.data.status}</div>
      `;
      container.appendChild(card);
    });
  }

  displayStructureAnalysis(structureData) {
    const container = document.getElementById('structure-analysis');
    container.innerHTML = '';

    structureData.factors.forEach(factor => {
      const item = document.createElement('div');
      item.className = 'structure-check-item';
      
      const statusIcon = factor.status === 'pass' ? '✅' : factor.status === 'fail' ? '❌' : '⚠️';
      
      item.innerHTML = `
        <div class="structure-check-info">
          <div class="structure-check-icon">${statusIcon}</div>
          <div class="structure-check-text">${factor.name}</div>
        </div>
        <div class="structure-check-status ${factor.status}">
          ${factor.points} pts
        </div>
      `;
      container.appendChild(item);
    });
  }

  displayAnswerPotential(answerData) {
    const container = document.getElementById('answer-analysis');
    container.innerHTML = '';

    const potentialItems = [
      {
        title: 'Question Answering',
        score: answerData.questionAnswering,
        description: 'Content structured to answer common questions'
      },
      {
        title: 'Factual Content',
        score: answerData.factualContent,
        description: 'Includes data, statistics, and factual information'
      },
      {
        title: 'Examples & Use Cases',
        score: answerData.examples,
        description: 'Provides concrete examples and practical applications'
      }
    ];

    potentialItems.forEach(item => {
      const scoreClass = item.score >= 30 ? 'high' : item.score >= 15 ? 'medium' : 'low';
      
      const element = document.createElement('div');
      element.className = 'answer-potential-item';
      element.innerHTML = `
        <div class="answer-potential-header">
          <div class="answer-potential-title">${item.title}</div>
          <div class="answer-potential-score ${scoreClass}">${item.score}%</div>
        </div>
        <div class="answer-potential-description">${item.description}</div>
      `;
      container.appendChild(element);
    });
  }

  displayGEORecommendations(recommendations) {
    const container = document.getElementById('geo-recommendations-list');
    container.innerHTML = '';

    recommendations.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'recommendation-item';
      item.innerHTML = `
        <div class="recommendation-header">
          <div class="recommendation-icon">${rec.icon}</div>
          <div class="recommendation-title">${rec.title}</div>
          <div class="recommendation-priority ${rec.priority}">${rec.priority}</div>
        </div>
        <div class="recommendation-description">${rec.description}</div>
        <div class="recommendation-actions">
          ${rec.actions.map(action => `<span class="recommendation-action">${action}</span>`).join('')}
        </div>
      `;
      container.appendChild(item);
    });
  }

  async getGEOAIInsights(url, keywords, geoAnalysis, apiKey) {
    const pageTitle = geoAnalysis.pageData?.title || 'Unknown';
    const wordCount = geoAnalysis.pageData?.wordCount || 0;
    const hasStructuredData = geoAnalysis.pageData?.structuredData?.length > 0;
    
    const answerPotential = geoAnalysis.factors?.answerPotential || { questionAnswering: 0, factualContent: 0, examples: 0 };
    
    const prompt = `As a GEO (Generative Engine Optimization) expert, analyze this webpage and provide specific optimization recommendations:

**Page Details:**
- URL: ${url}
- Title: ${pageTitle}
- Target Keywords: ${keywords}
- Word Count: ${wordCount}
- Current GEO Score: ${geoAnalysis.score}/100
- Has Structured Data: ${hasStructuredData ? 'Yes' : 'No'}

**Current Answer Box Potential Analysis:**
- Question Answering Score: ${answerPotential.questionAnswering}% ${answerPotential.questionAnswering < 30 ? '(NEEDS IMPROVEMENT)' : ''}
- Factual Content Score: ${answerPotential.factualContent}% ${answerPotential.factualContent < 30 ? '(NEEDS IMPROVEMENT)' : ''}
- Examples & Use Cases Score: ${answerPotential.examples}% ${answerPotential.examples < 30 ? '(NEEDS IMPROVEMENT)' : ''}

**Analysis Request:**
Provide 5-7 specific, actionable recommendations to optimize this page for AI search engines (ChatGPT, Perplexity, Claude, Google AI Overview, Bing Chat). Focus especially on improving the low-scoring areas above:

1. **Answer Box Optimization**: Structure content to directly answer user questions
2. **Question-Answer Format**: Add FAQ sections and clear question-answer pairs
3. **Factual Enhancement**: Include more data, statistics, research citations, and authoritative sources
4. **Example Integration**: Add concrete examples, case studies, step-by-step guides, and practical applications
5. **Content Structure**: Improve headings, lists, and semantic organization for AI comprehension
6. **Technical Optimizations**: Schema markup, structured data, and semantic HTML

Format your response as numbered recommendations with brief explanations and specific action steps.`;

    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Perplexity AI API key is required for GEO analysis');
    }

    // Try different models in order of preference
    const models = [
      'llama-3.1-sonar-small-128k-online',
      'llama-3.1-sonar-large-128k-online',
      'llama-3.1-sonar-huge-128k-online',
      'sonar-pro',
      'sonar'
    ];

    for (const model of models) {
      try {
        console.log(`Trying Perplexity API with model: ${model}`);
        console.log(`API Key length: ${apiKey ? apiKey.length : 'undefined'}`);
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a GEO (Generative Engine Optimization) expert. Provide concise, actionable recommendations for optimizing content for AI search engines.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 800,
            temperature: 0.3,
            stream: false
          })
        });

        console.log(`API Response status for ${model}:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`API Response received successfully with model: ${model}`);
          
          if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
          } else {
            throw new Error('Invalid API response format');
          }
        } else {
          const errorText = await response.text();
          console.warn(`Model ${model} failed:`, errorText);
          console.warn(`Response headers:`, Object.fromEntries(response.headers.entries()));
          
          // If this is the last model, throw the error
          if (model === models[models.length - 1]) {
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
          }
          // Otherwise, continue to next model
        }
      } catch (error) {
        console.warn(`Error with model ${model}:`, error.message);
        
        // If this is the last model, throw the error
        if (model === models[models.length - 1]) {
          throw error;
        }
        // Otherwise, continue to next model
      }
    }
  }

  displayGEOAIInsights(insights) {
    const container = document.getElementById('geo-ai-insights-content');
    
    // Parse the insights into structured format
    const parsedInsights = this.parseAIInsights(insights);
    
    let insightsHTML = `
      <h4>🎯 GEO Optimization Insights</h4>
      <div class="geo-insights-body">
    `;
    
    if (parsedInsights.length > 0) {
      // Display as structured insights
      parsedInsights.forEach((insight, index) => {
        insightsHTML += `
          <div class="geo-insight-item">
            <div class="geo-insight-number">${index + 1}</div>
            <div class="geo-insight-content">
              <div class="geo-insight-title">${insight.title}</div>
              <div class="geo-insight-description">${insight.description}</div>
              ${insight.actions && insight.actions.length > 0 ? `
                <div class="geo-insight-actions">
                  ${insight.actions.map(action => `<span class="geo-insight-action">${action}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
    } else {
      // Fallback to formatted text if parsing fails
      const formattedInsights = insights
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^\d+\./gm, '<strong>$&</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      insightsHTML += `<p>${formattedInsights}</p>`;
    }
    
    insightsHTML += '</div>';
    container.innerHTML = insightsHTML;
  }

  parseAIInsights(insights) {
    const parsedInsights = [];
    
    try {
      // Split by numbered items (1., 2., etc.)
      const items = insights.split(/(?=\d+\.)/);
      
      items.forEach(item => {
        const trimmedItem = item.trim();
        if (!trimmedItem) return;
        
        // Extract number and content
        const match = trimmedItem.match(/^(\d+)\.\s*(.+)/s);
        if (match) {
          const content = match[2];
          
          // Try to extract title and description
          const lines = content.split('\n').filter(line => line.trim());
          
          let title = '';
          let description = '';
          let actions = [];
          
          if (lines.length > 0) {
            // First line or sentence as title
            const firstLine = lines[0].trim();
            const colonIndex = firstLine.indexOf(':');
            
            if (colonIndex > 0 && colonIndex < 50) {
              title = firstLine.substring(0, colonIndex).replace(/^\*\*|\*\*$/g, '');
              description = firstLine.substring(colonIndex + 1).trim();
              
              // Add remaining lines to description
              if (lines.length > 1) {
                description += ' ' + lines.slice(1).join(' ');
              }
            } else {
              // Use first sentence as title
              const sentences = firstLine.split(/[.!?]/);
              if (sentences.length > 1) {
                title = sentences[0].trim().replace(/^\*\*|\*\*$/g, '');
                description = sentences.slice(1).join('.').trim() + '.';
                
                // Add remaining lines
                if (lines.length > 1) {
                  description += ' ' + lines.slice(1).join(' ');
                }
              } else {
                title = firstLine.replace(/^\*\*|\*\*$/g, '');
                description = lines.slice(1).join(' ');
              }
            }
          }
          
          // Extract action items (look for bullet points or dashes)
          const actionMatches = description.match(/[-•]\s*([^-•\n]+)/g);
          if (actionMatches) {
            actions = actionMatches.map(action => 
              action.replace(/^[-•]\s*/, '').trim()
            ).slice(0, 3); // Limit to 3 actions
            
            // Remove actions from description
            description = description.replace(/[-•]\s*[^-•\n]+/g, '').trim();
          }
          
          // Clean up formatting
          title = title.replace(/\*\*(.*?)\*\*/g, '$1').trim();
          description = description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').trim();
          
          if (title && description) {
            parsedInsights.push({
              title,
              description,
              actions
            });
          }
        }
      });
    } catch (error) {
      console.warn('Error parsing AI insights:', error);
    }
    
    return parsedInsights;
  }

  showGEOApiKeyMessage() {
    const container = document.getElementById('geo-ai-insights-content');
    container.innerHTML = `
      <h4>🔑 AI-Powered Insights Available</h4>
      <p>Get personalized GEO optimization recommendations powered by Perplexity AI!</p>
      <p>Click the ⚙️ icon in the footer to add your Perplexity AI API key and unlock:</p>
      <ul>
        <li>✨ Personalized optimization strategies</li>
        <li>🎯 AI engine-specific recommendations</li>
        <li>📊 Advanced content analysis</li>
        <li>🚀 Competitive advantage insights</li>
      </ul>
      <p><small>💡 The GEO analysis above works without an API key, but AI insights provide deeper recommendations.</small></p>
    `;
    document.getElementById('geo-ai-insights').classList.remove('hidden');
  }

  showGEOApiError(errorMessage) {
    const container = document.getElementById('geo-ai-insights-content');
    
    let troubleshooting = `
      <ul>
        <li>🔑 Invalid or expired API key</li>
        <li>💳 Insufficient API credits</li>
        <li>🚫 Rate limit exceeded</li>
        <li>🌐 Network connectivity issues</li>
      </ul>
    `;
    
    // Add specific troubleshooting for model errors
    if (errorMessage.includes('Invalid model')) {
      troubleshooting = `
        <ul>
          <li>🤖 <strong>Model Issue:</strong> The API model may have changed. This extension tries multiple models automatically.</li>
          <li>🔑 Verify your API key is valid and active</li>
          <li>💳 Check if you have sufficient API credits</li>
          <li>📚 Visit <a href="https://docs.perplexity.ai" target="_blank">Perplexity API docs</a> for current model names</li>
        </ul>
      `;
    }
    
    container.innerHTML = `
      <h4>⚠️ AI Insights Error</h4>
      <p><strong>Error:</strong> ${errorMessage}</p>
      <p>The extension tried multiple API models but all failed. Common issues:</p>
      ${troubleshooting}
      <p><small>💡 The GEO analysis above still works without AI insights.</small></p>
    `;
    document.getElementById('geo-ai-insights').classList.remove('hidden');
  }
}

// Domain Inspector Class
class DomainInspector {
  constructor() {
    this.currentDomain = null;
    this.domainData = null;
    this.apiKey = 'at_6U4HAvU9aP7eoqpxZEccZq63b97QU'; // WhoisXMLAPI key
    this.cacheKey = 'domainInspectorCache';
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  async analyzeDomain(url) {
    console.log('🌐 analyzeDomain called with URL:', url);
    try {
      const domain = new URL(url).hostname;
      this.currentDomain = domain;
      console.log('📍 Analyzing domain:', domain);
      
      // Show loading state
      this.showLoading();
      
      // Check cache first
      const cachedData = await this.getCachedData(domain);
      if (cachedData) {
        console.log('📦 Using cached domain data for:', domain);
        this.displayDomainInfo(cachedData.whoisData, cachedData.dnsData, cachedData.ageData);
        this.hideLoading();
        return;
      }
      
      // Fetch WHOIS data (via API)
      const whoisData = await this.fetchWhoisData(domain);
      
      // Fetch DNS data
      const dnsData = await this.fetchDNSData(domain);
      
      // Calculate domain age
      const ageData = this.calculateDomainAge(whoisData.createdDate);
      
      // Cache the data
      await this.cacheData(domain, { whoisData, dnsData, ageData });
      
      // Display domain information
      this.displayDomainInfo(whoisData, dnsData, ageData);
      
      this.hideLoading();
      
    } catch (error) {
      console.error('Domain analysis error:', error);
      this.showError(error.message, error.isAPICreditsError || false);
    }
  }

  async getCachedData(domain) {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get([this.cacheKey], resolve);
      });
      
      const cache = result[this.cacheKey] || {};
      const domainCache = cache[domain];
      
      if (domainCache) {
        const now = Date.now();
        if (now - domainCache.timestamp < this.cacheExpiry) {
          return domainCache.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  async cacheData(domain, data) {
    try {
      const result = await new Promise(resolve => {
        chrome.storage.local.get([this.cacheKey], resolve);
      });
      
      const cache = result[this.cacheKey] || {};
      cache[domain] = {
        data: data,
        timestamp: Date.now()
      };
      
      await new Promise(resolve => {
        chrome.storage.local.set({ [this.cacheKey]: cache }, resolve);
      });
      
      console.log('💾 Cached domain data for:', domain);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async fetchWhoisData(domain) {
    try {
      const apiUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${this.apiKey}&domainName=${domain}&outputFormat=JSON`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.ErrorMessage) {
        const errorMsg = data.ErrorMessage.msg || 'WHOIS API error';
        
        // Check for API credit/quota errors
        if (errorMsg.includes('insufficient credits') || 
            errorMsg.includes('quota exceeded') || 
            errorMsg.includes('API key') ||
            errorMsg.includes('Invalid API') ||
            errorMsg.includes('expired') ||
            errorMsg.includes('limit exceeded')) {
          const error = new Error(errorMsg);
          error.isAPICreditsError = true;
          throw error;
        }
        
        throw new Error(errorMsg);
      }
      
      const whoisRecord = data.WhoisRecord || {};
      const registryData = whoisRecord.registryData || {};
      const contactEmail = whoisRecord.contactEmail || registryData.contactEmail || '';
      
      // Extract nameservers
      let nameServers = [];
      if (whoisRecord.nameServers && whoisRecord.nameServers.hostNames) {
        nameServers = whoisRecord.nameServers.hostNames;
      } else if (registryData.nameServers && registryData.nameServers.hostNames) {
        nameServers = registryData.nameServers.hostNames;
      }
      
      // Extract dates
      const createdDate = whoisRecord.createdDate || registryData.createdDate || null;
      const expiresDate = whoisRecord.expiresDate || registryData.expiresDate || null;
      const updatedDate = whoisRecord.updatedDate || registryData.updatedDate || null;
      
      // Extract status
      let status = 'Unknown';
      if (whoisRecord.status) {
        status = Array.isArray(whoisRecord.status) ? whoisRecord.status[0] : whoisRecord.status;
      } else if (registryData.status) {
        status = Array.isArray(registryData.status) ? registryData.status[0] : registryData.status;
      }
      
      return {
        domain: domain,
        registrar: whoisRecord.registrarName || registryData.registrarName || 'Unknown',
        createdDate: createdDate ? createdDate.split('T')[0] : null,
        expiresDate: expiresDate ? expiresDate.split('T')[0] : null,
        updatedDate: updatedDate ? updatedDate.split('T')[0] : null,
        status: this.cleanStatus(status),
        nameServers: nameServers,
        contactEmail: contactEmail
      };
    } catch (error) {
      console.error('WHOIS fetch error:', error);
      throw error;
    }
  }

  cleanStatus(status) {
    if (!status || status === 'Unknown') return 'Unknown';
    
    // Clean up status string
    status = status.toLowerCase()
      .replace(/^client\s*/i, '')
      .replace(/^server\s*/i, '')
      .replace(/prohibited$/i, '')
      .trim();
    
    return status || 'Unknown';
  }

  async fetchDNSData(domain) {
    try {
      // Use Google's DNS-over-HTTPS API for DNS lookup
      const dnsData = {};
      
      // Fetch A records (IPv4)
      try {
        const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
        const aData = await aResponse.json();
        if (aData.Answer) {
          dnsData.A = aData.Answer.map(a => a.data);
        }
      } catch (e) {
        console.error('A record fetch error:', e);
      }
      
      // Fetch AAAA records (IPv6)
      try {
        const aaaaResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=AAAA`);
        const aaaaData = await aaaaResponse.json();
        if (aaaaData.Answer) {
          dnsData.AAAA = aaaaData.Answer.map(a => a.data);
        }
      } catch (e) {
        console.error('AAAA record fetch error:', e);
      }
      
      // Fetch CNAME records
      try {
        const cnameResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
        const cnameData = await cnameResponse.json();
        if (cnameData.Answer) {
          dnsData.CNAME = cnameData.Answer.map(c => c.data);
        }
      } catch (e) {
        console.error('CNAME record fetch error:', e);
      }
      
      // Fetch MX records
      try {
        const mxResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
        const mxData = await mxResponse.json();
        if (mxData.Answer) {
          dnsData.MX = mxData.Answer.map(mx => mx.data);
        }
      } catch (e) {
        console.error('MX record fetch error:', e);
      }
      
      // Fetch TXT records
      try {
        const txtResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
        const txtData = await txtResponse.json();
        if (txtData.Answer) {
          dnsData.TXT = txtData.Answer.map(txt => {
            // Clean up TXT records - remove quotes and split long records
            const cleaned = txt.data.replace(/"/g, '');
            return cleaned;
          });
        }
      } catch (e) {
        console.error('TXT record fetch error:', e);
      }
      
      // Fetch NS records
      try {
        const nsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=NS`);
        const nsData = await nsResponse.json();
        if (nsData.Answer) {
          dnsData.NS = nsData.Answer.map(ns => ns.data);
        }
      } catch (e) {
        console.error('NS record fetch error:', e);
      }
      
      return dnsData;
    } catch (error) {
      console.error('DNS fetch error:', error);
      return {};
    }
  }


  calculateDomainAge(createdDate) {
    if (!createdDate) return { years: 0, months: 0, days: 0 };
    
    const created = new Date(createdDate);
    const now = new Date();
    
    let years = now.getFullYear() - created.getFullYear();
    let months = now.getMonth() - created.getMonth();
    let days = now.getDate() - created.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months, days };
  }

  displayDomainInfo(whoisData, dnsData, ageData) {
    // Display domain age
    document.querySelector('.age-years').textContent = ageData.years;
    document.querySelector('.age-months').textContent = ageData.months;
    document.querySelector('.age-days').textContent = ageData.days;
    
    // Display domain details
    document.getElementById('domain-name').textContent = whoisData.domain;
    document.getElementById('domain-registrar').textContent = whoisData.registrar;
    
    
    document.getElementById('domain-created').textContent = whoisData.createdDate || '--';
    document.getElementById('domain-expires').textContent = whoisData.expiresDate || '--';
    document.getElementById('domain-updated').textContent = whoisData.updatedDate || '--';
    
    const statusBadge = document.getElementById('domain-status');
    statusBadge.textContent = whoisData.status;
    statusBadge.className = `detail-value status-badge ${whoisData.status.toLowerCase().replace(/\s+/g, '')}`;
    
    // Display nameservers
    const nameserversList = document.getElementById('domain-nameservers-list');
    if (whoisData.nameServers && whoisData.nameServers.length > 0) {
      nameserversList.innerHTML = whoisData.nameServers
        .map(ns => `<div class="nameserver-item">${ns}</div>`)
        .join('');
    } else {
      nameserversList.innerHTML = '<div class="nameserver-item">No nameservers found</div>';
    }
    
    // Display DNS records
    const dnsDetails = document.getElementById('domain-dns-details');
    if (dnsData && Object.keys(dnsData).length > 0) {
      // Define order for DNS record types with descriptive labels
      const recordTypes = {
        'A': { label: 'IPv4 Address', icon: '🌐' },
        'AAAA': { label: 'IPv6 Address', icon: '🌍' },
        'CNAME': { label: 'Canonical Name', icon: '🔗' },
        'MX': { label: 'Mail Server', icon: '📧' },
        'NS': { label: 'Name Server', icon: '🖥️' },
        'TXT': { label: 'Text Record', icon: '📝' }
      };
      
      const recordOrder = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT'];
      
      let html = '';
      recordOrder.forEach(type => {
        if (dnsData[type] && dnsData[type].length > 0) {
          const values = Array.isArray(dnsData[type]) ? dnsData[type] : [dnsData[type]];
          const typeInfo = recordTypes[type] || { label: type, icon: '' };
          const recordClass = `dns-record-${type.toLowerCase()}`;
          
          // For TXT records, display each on a separate line with word wrap
          if (type === 'TXT') {
            values.forEach(value => {
              // Truncate very long TXT records for display
              const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
              html += `
                <div class="dns-record dns-record-txt ${recordClass}" title="${typeInfo.label}">
                  <span class="dns-record-type">${type}</span>
                  <span class="dns-record-value" title="${this.escapeHtml(value)}">${this.escapeHtml(displayValue)}</span>
                </div>
              `;
            });
          } else {
            // For other record types, show each value on a separate line
            values.forEach(value => {
              html += `
                <div class="dns-record ${recordClass}" title="${typeInfo.label}">
                  <span class="dns-record-type">${type}</span>
                  <span class="dns-record-value">${this.escapeHtml(value)}</span>
                </div>
              `;
            });
          }
        }
      });
      
      if (html) {
        dnsDetails.innerHTML = html;
      } else {
        dnsDetails.innerHTML = '<div class="dns-record">No DNS records available</div>';
      }
    } else {
      dnsDetails.innerHTML = '<div class="dns-record">No DNS records available</div>';
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }


  showLoading() {
    document.getElementById('domain-loading').classList.remove('hidden');
    document.getElementById('domain-error').classList.add('hidden');
    document.getElementById('domain-info-container').style.opacity = '0.5';
  }

  hideLoading() {
    document.getElementById('domain-loading').classList.add('hidden');
    document.getElementById('domain-info-container').style.opacity = '1';
  }

  showError(message, isAPIError = false) {
    document.getElementById('domain-loading').classList.add('hidden');
    document.getElementById('domain-error').classList.remove('hidden');
    
    const errorElement = document.getElementById('domain-error');
    
    if (isAPIError) {
      errorElement.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔑</div>
          <h3 style="color: #ef4444; margin-bottom: 12px;">WhoisXML API Credits Expired</h3>
          <p style="margin-bottom: 16px; color: #64748b;">${message}</p>
          <p style="margin-bottom: 20px; color: #475569; font-size: 14px;">
            Your API key has run out of credits. Please add a new API key to continue using Domain Inspector.
          </p>
          <button id="open-api-settings-btn" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ⚙️ Open API Settings
          </button>
          <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-size: 13px; color: #475569; text-align: left;">
              <strong>💡 Get Free API Key:</strong><br>
              1. Visit <a href="https://temp-mail.org" target="_blank" style="color: #667eea;">temp-mail.org</a> for temporary email<br>
              2. Register at <a href="https://whoisxmlapi.com/registration" target="_blank" style="color: #667eea;">WhoisXML API</a><br>
              3. Get 500 free credits per account<br>
              4. Create unlimited accounts with new temp emails
            </p>
          </div>
        </div>
      `;
      
      // Add click handler for the button
      setTimeout(() => {
        const btn = document.getElementById('open-api-settings-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            // Click the API settings button in footer
            document.getElementById('api-settings-btn').click();
          });
          
          // Add hover effect
          btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          });
          btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
          });
        }
      }, 100);
    } else {
      errorElement.innerHTML = `<p>${message || 'Failed to fetch domain information. Please try again.'}</p>`;
    }
  }
}

// Initialize the analyzer when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const analyzer = new UltimateSEOAnalyzer();
  const domainInspector = new DomainInspector();
  
  // Make analyzer available globally for debugging
  window.seoAnalyzer = analyzer;
  window.domainInspector = domainInspector;
  window.testAIKeywords = () => UltimateSEOAnalyzer.testKeywordsDisplay();
  
  // Add test function for DA/PA
  window.testDomainAnalysis = async () => {
    console.log('🧪 Testing domain analysis...');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        console.log('📍 Current URL:', tab.url);
        await domainInspector.analyzeDomain(tab.url);
        console.log('✅ Domain analysis complete!');
      } else {
        console.error('❌ No active tab');
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };
  
  console.log('🚀 SEO Analyzer loaded!');
  console.log('📊 DA/PA Checker ready!');
  console.log('💡 Commands: testDomainAnalysis() or testAIKeywords()');
  console.log('');
  
  // AUTO-RUN: Check if Domain tab is already active
  setTimeout(async () => {
    const domainTab = document.querySelector('[data-tab="domain"]');
    const domainContent = document.getElementById('domain');
    
    if (domainTab && domainTab.classList.contains('active')) {
      console.log('🌐 Domain tab already active! Running analysis...');
      await window.testDomainAnalysis();
    } else if (domainContent && domainContent.classList.contains('active')) {
      console.log('🌐 Domain content active! Running analysis...');
      await window.testDomainAnalysis();
    }
    
    // Also trigger if user manually clicks Domain tab
    if (domainTab) {
      domainTab.addEventListener('click', async () => {
        console.log('👆 Domain tab clicked by user!');
        setTimeout(async () => {
          await window.testDomainAnalysis();
        }, 500);
      });
    }
  }, 1000);
  
  // API Settings Modal functionality
  const apiSettingsBtn = document.getElementById('api-settings-btn');
  const apiSettingsModal = document.getElementById('api-settings-modal');
  const closeApiSettingsModal = document.getElementById('close-api-settings-modal');
  const saveApiKeysBtn = document.getElementById('save-api-keys-btn');
  const clearApiKeysBtn = document.getElementById('clear-api-keys-btn');
  
  const perplexityApiKeyInput = document.getElementById('perplexity-api-key');
  const whoisxmlApiKeyInput = document.getElementById('whoisxml-api-key');
  const showPerplexityKeyCheckbox = document.getElementById('show-perplexity-key');
  const showWhoisxmlKeyCheckbox = document.getElementById('show-whoisxml-key');
  
  // Load saved API keys
  function loadApiKeys() {
    chrome.storage.local.get(['perplexityApiKey', 'whoisxmlApiKey'], (result) => {
      if (result.perplexityApiKey) {
        perplexityApiKeyInput.value = result.perplexityApiKey;
      }
      if (result.whoisxmlApiKey) {
        whoisxmlApiKeyInput.value = result.whoisxmlApiKey;
      }
    });
  }
  
  // Open modal
  apiSettingsBtn.addEventListener('click', () => {
    apiSettingsModal.style.display = 'flex';
    loadApiKeys();
  });
  
  // Close modal
  closeApiSettingsModal.addEventListener('click', () => {
    apiSettingsModal.style.display = 'none';
  });
  
  // Close modal on overlay click
  apiSettingsModal.addEventListener('click', (e) => {
    if (e.target === apiSettingsModal) {
      apiSettingsModal.style.display = 'none';
    }
  });
  
  // Toggle API key visibility
  showPerplexityKeyCheckbox.addEventListener('change', (e) => {
    perplexityApiKeyInput.type = e.target.checked ? 'text' : 'password';
  });
  
  showWhoisxmlKeyCheckbox.addEventListener('change', (e) => {
    whoisxmlApiKeyInput.type = e.target.checked ? 'text' : 'password';
  });
  
  // Save API keys
  saveApiKeysBtn.addEventListener('click', () => {
    const perplexityKey = perplexityApiKeyInput.value.trim();
    const whoisxmlKey = whoisxmlApiKeyInput.value.trim();
    
    chrome.storage.local.set({
      perplexityApiKey: perplexityKey,
      whoisxmlApiKey: whoisxmlKey
    }, () => {
      // Update the WhoisXML API key in DomainInspector if it's initialized
      if (window.domainInspector && whoisxmlKey) {
        window.domainInspector.apiKey = whoisxmlKey;
      }
      
      // Show success message
      saveApiKeysBtn.textContent = '✓ Saved!';
      saveApiKeysBtn.style.background = '#10b981';
      
      setTimeout(() => {
        saveApiKeysBtn.textContent = 'Save Settings';
        saveApiKeysBtn.style.background = '';
        apiSettingsModal.style.display = 'none';
      }, 1500);
    });
  });
  
  // Clear all API keys
  clearApiKeysBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all API keys?')) {
      chrome.storage.local.remove(['perplexityApiKey', 'whoisxmlApiKey'], () => {
        perplexityApiKeyInput.value = '';
        whoisxmlApiKeyInput.value = '';
        
        clearApiKeysBtn.textContent = '✓ Cleared!';
        setTimeout(() => {
          clearApiKeysBtn.textContent = 'Clear All Keys';
        }, 1500);
      });
    }
  });
  
  // Load WhoisXML API key on startup
  chrome.storage.local.get(['whoisxmlApiKey'], (result) => {
    if (result.whoisxmlApiKey && window.domainInspector) {
      window.domainInspector.apiKey = result.whoisxmlApiKey;
      console.log('✅ WhoisXML API key loaded from storage');
    }
  });
});
