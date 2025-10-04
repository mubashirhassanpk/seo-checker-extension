// SEO Checker by Sekhlo - Google Ranking Checker Module

class GoogleRankingChecker {
  constructor() {
    this.isChecking = false;
    this.currentPage = 0;
    this.totalPages = 10;
    this.resultsPerPage = 10;
    this.allResults = [];
    this.extractedKeywords = new Map();
    this.paaQuestions = [];
    this.startTime = null;
    this.timerInterval = null;
    this.statusPollInterval = null;
    this.currentScanId = null;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupCollapseButtons();
    
    // Check if there's an ongoing scan
    await this.checkOngoingScan();
  }

  async checkOngoingScan() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getRankingStatus'
      });

      if (response && response.success && response.data) {
        const status = response.data;
        
        // If there's an ongoing scan, show it
        if (status.status === 'running') {
          console.log('📊 Found ongoing scan, resuming...');
          this.isChecking = true;
          this.showSection('ranking-progress');
          this.startTimer();
          this.startStatusPolling();
          
          // Disable button
          const checkBtn = document.getElementById('check-ranking-btn');
          checkBtn.disabled = true;
          checkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg><span>Checking...</span>';
        } else if (['completed', 'captcha', 'error'].includes(status.status)) {
          // Show completed scan results
          console.log('📊 Found completed scan, displaying results...');
          await this.displayResults(status);
        }
      }
    } catch (error) {
      console.log('No ongoing scan found');
    }
  }

  setupEventListeners() {
    // Check ranking button
    const checkBtn = document.getElementById('check-ranking-btn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.startRankingCheck());
    }

    // Copy extracted keywords button
    const copyKeywordsBtn = document.getElementById('copy-extracted-keywords');
    if (copyKeywordsBtn) {
      copyKeywordsBtn.addEventListener('click', () => this.copyExtractedKeywords());
    }

    // Open Google search button
    const openGoogleBtn = document.getElementById('open-google-search');
    if (openGoogleBtn) {
      openGoogleBtn.addEventListener('click', () => this.openGoogleSearch());
    }

    // Enter key in keyword input
    const keywordInput = document.getElementById('ranking-keyword');
    if (keywordInput) {
      keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.startRankingCheck();
        }
      });
    }
  }

  async startRankingCheck() {
    if (this.isChecking) return;

    const keyword = document.getElementById('ranking-keyword').value.trim();
    const country = document.getElementById('ranking-country').value;
    const domain = document.getElementById('ranking-domain').value.trim();

    if (!keyword) {
      this.showNotification('Please enter a keyword to check', 'error');
      return;
    }

    this.isChecking = true;
    this.currentKeyword = keyword;
    this.currentCountry = country;
    this.currentDomain = domain;
    this.startTime = Date.now();

    // Show progress section, hide results
    this.showSection('ranking-progress');
    this.hideSection('ranking-results');
    this.hideSection('extracted-keywords-section');

    // Disable button
    const checkBtn = document.getElementById('check-ranking-btn');
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg><span>Checking...</span>';

    // Start timer
    this.startTimer();

    // Start background scanning
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'startBackgroundRankingCheck',
        keyword,
        country,
        domain
      });

      if (response && response.success) {
        console.log('✅ Background scan started');
        this.showNotification('Scan started in background. You can close this popup!', 'success');
        
        // Poll for status updates
        this.startStatusPolling();
      } else {
        throw new Error('Failed to start background scan');
      }
    } catch (error) {
      console.error('❌ Error starting background scan:', error);
      this.showNotification('Error starting scan. Please try again.', 'error');
      this.resetUI();
    }
  }

  startStatusPolling() {
    // Poll every 2 seconds for status updates
    this.statusPollInterval = setInterval(async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'getRankingStatus'
        });

        if (response && response.success && response.data) {
          const status = response.data;
          
          // Update UI with status
          this.updateProgressFromStatus(status);
          
          // If scan is complete, stopped, or errored
          if (['completed', 'captcha', 'error', 'cancelled'].includes(status.status)) {
            this.stopStatusPolling();
            await this.displayResults(status);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 2000);
  }

  stopStatusPolling() {
    if (this.statusPollInterval) {
      clearInterval(this.statusPollInterval);
      this.statusPollInterval = null;
    }
  }

  updateProgressFromStatus(status) {
    const progressBar = document.getElementById('ranking-progress-bar');
    const progressStatus = document.getElementById('ranking-status');
    const resultsFound = document.getElementById('ranking-results-found');

    const percentage = status.progress || 0;
    progressBar.style.width = `${percentage}%`;
    
    const startPos = (status.currentPage - 1) * 10 + 1;
    const endPos = status.currentPage * 10;
    progressStatus.textContent = `Scanning page ${status.currentPage} of ${status.totalPages} (results ${startPos}-${endPos})...`;
    
    resultsFound.textContent = `${status.resultsFound} results scanned`;
  }

  async displayResults(scanData) {
    this.stopTimer();
    this.isChecking = false;
    
    // Hide progress
    this.hideSection('ranking-progress');
    
    // Re-enable button
    const checkBtn = document.getElementById('check-ranking-btn');
    checkBtn.disabled = false;
    checkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>CHECK RANKING</span>';
    
    // Store current scan ID for export
    this.currentScanId = scanData.id;
    
    // Display results
    this.displayScanResults(scanData);
    this.showSection('ranking-results');
  }

  displayScanResults(scanData) {
    const resultCard = document.getElementById('ranking-result-card');
    const topResultsContainer = document.getElementById('top-results-container');
    const openGoogleBtn = document.getElementById('open-google-search');
    
    console.log('📊 Displaying scan results:', scanData);
    
    // Store search params
    this.currentSearch = { keyword: scanData.keyword, country: scanData.country };
    openGoogleBtn.classList.remove('hidden');
    
    // Handle different statuses
    if (scanData.status === 'captcha') {
      this.showCaptchaError(scanData.captchaPage || 1, scanData.keyword, scanData.country);
    } else if (scanData.totalResults === 0) {
      this.showNoResultsError(scanData.keyword, scanData.country);
    } else {
      // Show ranking results
      this.displayRankingCard(scanData, resultCard);
      this.displayTopResults(scanData, topResultsContainer);
      
      // Show extracted keywords if available
      if ((scanData.keywords && scanData.keywords.length > 0) || (scanData.paaQuestions && scanData.paaQuestions.length > 0)) {
        this.displayExtractedKeywordsFromScan(scanData);
        this.showSection('extracted-keywords-section');
      }
      
      // Show export button
      this.showExportButton(scanData.id);
    }
  }

  displayRankingCard(scanData, resultCard) {
    if (scanData.rankingPosition) {
      resultCard.className = 'ranking-result-card';
      resultCard.innerHTML = `
        <div class="ranking-result-header">
          <div class="ranking-position">#${scanData.rankingPosition}</div>
          <div class="ranking-label">Your Ranking Position</div>
        </div>
        <div class="ranking-details">
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Keyword</div>
            <div class="ranking-detail-value">${this.escapeHtml(scanData.keyword)}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Domain</div>
            <div class="ranking-detail-value">${this.escapeHtml(scanData.domain)}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Country</div>
            <div class="ranking-detail-value">${scanData.country.toUpperCase()}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Total Results Scanned</div>
            <div class="ranking-detail-value">${scanData.totalResults}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">URL Found</div>
            <div class="ranking-detail-value" style="font-size: 11px; word-break: break-all;">${this.escapeHtml(scanData.rankingUrl)}</div>
          </div>
        </div>
      `;
    } else {
      resultCard.className = 'ranking-result-card not-found';
      resultCard.innerHTML = `
        <div class="ranking-result-header">
          <div class="ranking-position not-found">Not in Top ${scanData.totalResults}</div>
          <div class="ranking-label not-found">${scanData.domain ? 'Domain Not Found' : 'Check Complete'}</div>
        </div>
        <div class="ranking-details">
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Keyword</div>
            <div class="ranking-detail-value">${this.escapeHtml(scanData.keyword)}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Country</div>
            <div class="ranking-detail-value">${scanData.country.toUpperCase()}</div>
          </div>
          <div class="ranking-detail-item" style="grid-column: 1 / -1;">
            <div class="ranking-detail-label">Total Results Scanned</div>
            <div class="ranking-detail-value">${scanData.totalResults}</div>
          </div>
        </div>
      `;
    }
  }

  displayTopResults(scanData, container) {
    container.innerHTML = '';
    const top10 = scanData.results.slice(0, 10);
    
    top10.forEach((result, index) => {
      const position = result.position;
      const isUserDomain = scanData.domain && result.domain.toLowerCase().includes(scanData.domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, ''));
      
      const resultDiv = document.createElement('div');
      resultDiv.className = `result-item${isUserDomain ? ' your-domain' : ''}`;
      resultDiv.innerHTML = `
        <div class="result-position">${position}</div>
        <div class="result-title">${this.escapeHtml(result.title)}</div>
        <div class="result-url">${this.escapeHtml(result.domain)}</div>
        <div class="result-description">${this.escapeHtml(result.snippet.substring(0, 150))}${result.snippet.length > 150 ? '...' : ''}</div>
        ${isUserDomain ? '<div class="your-domain-badge">✓ Your Domain</div>' : ''}
      `;
      container.appendChild(resultDiv);
    });
  }

  displayExtractedKeywordsFromScan(scanData) {
    const contentKeywordsContainer = document.getElementById('content-keywords');
    const paaContainer = document.getElementById('paa-questions');

    // Store keywords data for load more functionality
    this.allKeywords = [];
    this.allPaaQuestions = [];
    this.keywordsShown = 0;
    this.paaShown = 0;
    this.keywordsPerLoad = 10;
    this.paaPerLoad = 10;

    // Display keywords with load more functionality
    contentKeywordsContainer.innerHTML = '';
    if (scanData.keywords && scanData.keywords.length > 0) {
      // Filter to only multi-word phrases (no single words) + CLEAN KEYWORDS
      this.allKeywords = scanData.keywords.filter(kw => {
        const word = kw.word;
        
        // Must be multi-word
        if (word.split(' ').length < 2) return false;
        
        // Remove code/technical junk
        if (word.includes('function') || word.includes('var ') || word.includes('className')) return false;
        if (word.includes('\\x') || word.includes('setAttribute')) return false;
        if (word.includes('://') || word.includes('.com/')) return false;
        
        // Must look like natural language
        if (word.match(/[{}\[\]<>]/)) return false;  // No brackets
        if ((word.match(/[^a-zA-Z0-9\s\'\-]/g) || []).length > 3) return false;  // Too many special chars
        
        return true;
      });
      
      // Add header with total count
      const header = document.createElement('div');
      header.style.cssText = 'margin-bottom: 10px; font-weight: 600; color: #4f46e5;';
      header.textContent = `📊 Found ${this.allKeywords.length} unique multi-word keyword phrases (2-10 words)`;
      contentKeywordsContainer.appendChild(header);
      
      // Display first 10 keywords
      this.displayKeywords(0, this.keywordsPerLoad);
      
      // Show load more button if there are more keywords
      if (this.allKeywords.length > this.keywordsPerLoad) {
        this.showLoadMoreKeywords();
      }
    } else {
      contentKeywordsContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No keywords extracted</p>';
    }

    // Display FILTERED PAA questions with load more functionality
    paaContainer.innerHTML = '';
    if (scanData.paaQuestions && scanData.paaQuestions.length > 0) {
      // FINAL FILTER - Safety net to remove any junk
      this.allPaaQuestions = scanData.paaQuestions.filter(q => {
        // Must be reasonable length
        if (q.length < 10 || q.length > 300) return false;
        
        // Remove code/JavaScript patterns
        if (q.includes('function(') || q.includes('){') || q.includes('var ')) return false;
        if (q.includes('\\x') || q.includes('setAttribute') || q.includes('className')) return false;
        
        // Remove URLs
        if (q.includes('://') || q.includes('www.') || q.includes('.com/')) return false;
        
        // Remove if too many special characters
        const specialCharCount = (q.match(/[^a-zA-Z0-9\s\?\'\-]/g) || []).length;
        if (specialCharCount > 5) return false;
        
        // Remove if contains code patterns
        if (q.match(/[{}\[\]<>]/)) return false;
        if ((q.match(/\(/g) || []).length > 2) return false;
        
        // Must look like a real question
        const words = q.split(' ');
        if (words.length < 2) return false;
        
        return true;
      });
      
      // Add header with total count
      const paaHeader = document.createElement('div');
      paaHeader.style.cssText = 'margin-bottom: 10px; font-weight: 600; color: #4f46e5;';
      paaHeader.textContent = `❓ Found ${this.allPaaQuestions.length} "People Also Ask" questions`;
      paaContainer.appendChild(paaHeader);
      
      // Display first 10 PAA questions
      this.displayPaaQuestions(0, this.paaPerLoad);
      
      // Show load more button if there are more questions
      if (this.allPaaQuestions.length > this.paaPerLoad) {
        this.showLoadMorePaa();
      }
      
      // If all were filtered out, show message
      if (this.allPaaQuestions.length === 0) {
        paaContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No "People Also Ask" questions found</p>';
      }
    } else {
      paaContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No "People Also Ask" questions found</p>';
    }
  }

  showExportButton(scanId) {
    // Check if export button already exists
    let exportBtn = document.getElementById('export-ranking-btn');
    
    if (!exportBtn) {
      // Create export button section
      const rankingResults = document.getElementById('ranking-results');
      const exportSection = document.createElement('div');
      exportSection.style.cssText = 'margin-top: 20px; text-align: center;';
      exportSection.innerHTML = `
        <button id="export-ranking-btn" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 10px;
        ">
          📥 Export as CSV
        </button>
        <button id="export-ranking-json-btn" style="
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">
          📄 Export as JSON
        </button>
      `;
      
      rankingResults.appendChild(exportSection);
      
      exportBtn = document.getElementById('export-ranking-btn');
      const exportJsonBtn = document.getElementById('export-ranking-json-btn');
      
      exportBtn.addEventListener('click', () => this.exportData(scanId, 'csv'));
      exportJsonBtn.addEventListener('click', () => this.exportData(scanId, 'json'));
    }
    
    // Store scan ID on button
    exportBtn.dataset.scanId = scanId;
    document.getElementById('export-ranking-json-btn').dataset.scanId = scanId;
  }

  async exportData(scanId, format) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportRankingData',
        scanId,
        format
      });

      if (response && response.success && response.data) {
        const { filename, data, mimeType } = response.data;
        
        // Create download
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Exported as ${format.toUpperCase()}!`, 'success');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('Error exporting data', 'error');
    }
  }

  resetUI() {
    this.isChecking = false;
    this.stopTimer();
    this.stopStatusPolling();
    
    const checkBtn = document.getElementById('check-ranking-btn');
    checkBtn.disabled = false;
    checkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>CHECK RANKING</span>';
  }

  async oldStartRankingCheck() {
    // Keep old implementation as fallback
    if (this.isChecking) return;

    const keyword = document.getElementById('ranking-keyword').value.trim();
    const country = document.getElementById('ranking-country').value;
    const domain = document.getElementById('ranking-domain').value.trim();

    if (!keyword) {
      this.showNotification('Please enter a keyword to check', 'error');
      return;
    }

    this.isChecking = true;
    this.currentPage = 0;
    this.allResults = [];
    this.extractedKeywords.clear();
    this.paaQuestions = [];
    this.startTime = Date.now();

    // Show progress section, hide results
    this.showSection('ranking-progress');
    this.hideSection('ranking-results');
    this.hideSection('extracted-keywords-section');

    // Disable button
    const checkBtn = document.getElementById('check-ranking-btn');
    checkBtn.disabled = true;
    checkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg><span>Checking...</span>';

    // Start timer
    this.startTimer();

    try {
      let captchaEncountered = false;
      let captchaPage = 0;
      
      // Scan all 10 pages
      for (let page = 0; page < this.totalPages; page++) {
        this.currentPage = page + 1;
        const startPosition = page * this.resultsPerPage;
        
        this.updateProgress(this.currentPage, startPosition);

        try {
        // Fetch Google results for this page
        const results = await this.fetchGoogleResults(keyword, country, startPosition);
        
        if (results && results.length > 0) {
          this.allResults = this.allResults.concat(results);
          
          // Extract keywords from first 3 pages, PAA from FIRST PAGE ONLY
          if (page < 3) {
            this.extractKeywordsFromResults(results);
            }
          
          // Extract PAA questions ONLY from FIRST PAGE (page 0)
          if (page === 0) {
            console.log(`📋 Extracting PAA questions from FIRST PAGE ONLY (page ${page + 1})`);
            // PAA extraction is handled in extractResultsFromPage function
          } else if (page > 0) {
            console.log(`⏭️ Skipping PAA extraction from page ${page + 1} (only extracting from page 1)`);
            }
          } else {
            console.warn(`⚠️ No results extracted from page ${page + 1}`);
          }
        } catch (pageError) {
          if (pageError.message === 'CAPTCHA_DETECTED') {
            console.error(`🚫 CAPTCHA detected on page ${page + 1}`);
            captchaEncountered = true;
            captchaPage = page + 1;
            break; // Stop scanning if CAPTCHA is encountered
          } else {
            console.error(`Error on page ${page + 1}:`, pageError);
            // Continue with next page on other errors
          }
        }

        // Wait between pages to avoid rate limiting (except last page)
        if (page < this.totalPages - 1) {
          await this.sleep(2000);
        }
      }

      // Stop timer
      this.stopTimer();

      // Check if we got any results
      if (this.allResults.length === 0) {
        if (captchaEncountered) {
          this.showCaptchaError(captchaPage, keyword, country);
        } else {
          this.showNoResultsError(keyword, country);
        }
        this.showSection('ranking-results');
        return;
      }

      // Process results
      this.processResults(keyword, domain, country);

      // Show results
      this.showSection('ranking-results');
      
      // Show extracted keywords if we found any
      if (this.extractedKeywords.size > 0 || this.paaQuestions.length > 0) {
        this.displayExtractedKeywords();
        this.showSection('extracted-keywords-section');
      }
      
      // Show warning if we encountered CAPTCHA but got some results
      if (captchaEncountered && this.allResults.length > 0) {
        this.showNotification(
          `⚠️ Scan stopped at page ${captchaPage} due to CAPTCHA. Got ${this.allResults.length} results.`,
          'warning'
        );
      }

    } catch (error) {
      console.error('❌ Error checking ranking:', error);
      this.stopTimer();
      this.showNotification('Error checking ranking. Please try again later.', 'error');
    } finally {
      this.isChecking = false;
      this.hideSection('ranking-progress');
      
      // Re-enable button
      checkBtn.disabled = false;
      checkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>CHECK RANKING</span>';
    }
  }

  async fetchGoogleResults(keyword, country, startPosition) {
    try {
      // Add random delay to avoid detection (3-6 seconds)
      const randomDelay = 3000 + Math.random() * 3000;
      await this.sleep(randomDelay);
      
      const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${country}&hl=en&num=${this.resultsPerPage}&start=${startPosition}`;
      
      console.log(`🔍 Fetching Google results (page ${this.currentPage}):`, url);
      
      // Create a new tab to fetch results
      const tab = await chrome.tabs.create({ url, active: false });
      
      // Wait for the tab to complete loading first
      await this.waitForTabComplete(tab.id);
      
      // Wait additional time for JavaScript to render and anti-bot checks
      console.log('⏳ Waiting for page to fully render...');
      await this.sleep(7000); // Increased wait time
      
      try {
        // First, check if we hit a CAPTCHA
        const captchaCheck = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const hasCaptcha = document.body.innerHTML.includes('recaptcha') || 
                              document.body.innerHTML.includes('captcha') ||
                              document.querySelector('iframe[src*="recaptcha"]') !== null ||
                              document.querySelector('#captcha') !== null ||
                              document.body.textContent.includes('unusual traffic');
            
            return {
              hasCaptcha,
              bodyLength: document.body.innerHTML.length,
              title: document.title,
              url: window.location.href
            };
          }
        });
        
        console.log('📊 Page check:', captchaCheck[0]?.result);
        
        if (captchaCheck[0]?.result?.hasCaptcha) {
          console.error('🚫 CAPTCHA detected on page');
          await chrome.tabs.remove(tab.id);
          throw new Error('CAPTCHA_DETECTED');
        }
        
        // Inject script to extract results
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: this.extractResultsFromPage
        });

        console.log('✅ Script execution completed');

        // Close the tab
        await chrome.tabs.remove(tab.id);

        if (results && results[0] && results[0].result) {
          const { results: searchResults, paaQuestions, debug } = results[0].result;
          
          console.log('📈 Extraction results:', {
            resultsFound: searchResults ? searchResults.length : 0,
            paaFound: paaQuestions ? paaQuestions.length : 0,
            debug
          });
          
          // Add PAA questions from this page
          if (paaQuestions && paaQuestions.length > 0) {
            this.paaQuestions = [...new Set([...this.paaQuestions, ...paaQuestions])];
          }
          
          return searchResults || [];
        }
      } catch (scriptError) {
        console.error('❌ Script execution error:', scriptError);
        // Close the tab even if script fails
        try {
          await chrome.tabs.remove(tab.id);
        } catch (e) {}
        
        if (scriptError.message === 'CAPTCHA_DETECTED') {
          throw scriptError;
        }
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching Google results:', error);
      if (error.message === 'CAPTCHA_DETECTED') {
        throw error;
      }
      return [];
    }
  }

  async waitForTabComplete(tabId) {
    return new Promise((resolve) => {
      const listener = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Increased timeout to 15 seconds for slower connections
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 15000);
    });
  }

  extractResultsFromPage() {
    // This function runs in the context of the Google search page
    console.log('🔎 Extracting results from page...');
    console.log('Current URL:', window.location.href);
    console.log('Page title:', document.title);
    
    const results = [];
    const debug = {
      url: window.location.href,
      title: document.title,
      selectorsChecked: [],
      containersFound: 0,
      bodyLength: document.body.innerHTML.length
    };
    
    // Check if this is the first page (start=0) for PAA extraction
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = parseInt(urlParams.get('start') || '0');
    const isFirstPage = startParam === 0;
    
    console.log(`📄 Page detection: start=${startParam}, isFirstPage=${isFirstPage}`);
    
    // ENHANCED SELECTOR MATCHING with 2024 Google structure
    let allContainers = [];
    
    // Method 1: Known selectors (updated for current Google)
    const knownSelectors = [
      'div.MjjYud',        // Main container (current)
      'div.g',             // Classic selector (broader)
      'div.tF2Cxc',        // Result wrapper
      'div.N54PNb',        // Alternative wrapper
      'div.Gx5Zad',        // Card container
      'div[data-sokoban-container]', // Data attribute
      'div.ezO2md',        // Variant
      'div.hlcw0c',        // New variant
      'div.yuRUbf',        // Title wrapper
      '[jscontroller]'     // Generic JS controller divs
    ];
    
    for (const selector of knownSelectors) {
      try {
      const found = document.querySelectorAll(selector);
        debug.selectorsChecked.push({ selector, count: found.length });
        
      if (found.length > 0) {
          // Filter out non-result elements (more lenient)
          const filtered = Array.from(found).filter(el => {
            const hasH3 = el.querySelector('h3');
            const hasLink = el.querySelector('a[href]');
            const notKnowledgePanel = !el.closest('.kno-kp');
            const notAd = !el.querySelector('[data-text-ad]') && !el.closest('[data-text-ad]');
            return hasH3 && hasLink && notKnowledgePanel && notAd;
          });
          
          if (filtered.length > 0) {
            allContainers = filtered;
            console.log(`✅ Found ${filtered.length} containers with selector: ${selector}`);
            debug.workingSelector = selector;
        break;
          }
        }
      } catch (e) {
        console.log(`Failed selector: ${selector}`, e);
      }
    }
    
    // Method 2: Ultra-aggressive fallback - Find ALL h3 elements and work up
    if (allContainers.length === 0) {
      console.log('⚠️ Using ultra-aggressive fallback: finding all h3 elements');
      const allH3s = document.querySelectorAll('h3');
      const containerSet = new Set();
      
      allH3s.forEach(h3 => {
        // Find the nearest parent with a link
        let parent = h3.parentElement;
        let depth = 0;
        
        while (parent && depth < 10) {
          const link = parent.querySelector('a[href]');
          if (link && link.href && link.href.startsWith('http')) {
            // Check if this is not an ad or knowledge panel
            const isAd = parent.querySelector('[data-text-ad]') || parent.closest('[data-text-ad]');
            const isKP = parent.closest('.kno-kp, .kp-blk');
            
            if (!isAd && !isKP && parent.textContent.trim().length > 50) {
              containerSet.add(parent);
              break;
            }
          }
          parent = parent.parentElement;
          depth++;
        }
      });
      
      allContainers = Array.from(containerSet);
      console.log(`📦 Found ${allContainers.length} containers with h3 fallback method`);
      debug.usedUltraFallback = true;
    }
    
    // Method 3: Ultimate fallback - Parse based on pattern recognition
    if (allContainers.length === 0) {
      console.log('🆘 Using ultimate fallback: pattern-based extraction');
      const searchMain = document.querySelector('#search, #rso, #center_col, [data-async-context*="query"]');
      
      if (searchMain) {
        const potentialContainers = searchMain.querySelectorAll('div');
        allContainers = Array.from(potentialContainers).filter(div => {
          const h3 = div.querySelector('h3');
          const link = div.querySelector('a[href]');
          const hasMinText = div.textContent.trim().length > 100;
          
          if (h3 && link && hasMinText) {
            // Must have external link (not Google internal)
            const href = link.href;
            const isExternal = href && 
                              href.startsWith('http') && 
                              !href.includes('google.com/search') &&
                              !href.includes('accounts.google') &&
                              !href.includes('support.google');
            
            // Not an ad
            const isAd = div.querySelector('[data-text-ad]') || div.closest('[data-text-ad]');
            
            // Not nested in another result
            const parent = div.parentElement;
            const hasResultParent = parent && (
              parent.querySelector('h3') !== h3 ||
              parent.querySelector('a[href]') !== link
            );
            
            return isExternal && !isAd && !hasResultParent;
          }
          return false;
        });
        console.log(`🎯 Found ${allContainers.length} containers with pattern-based method`);
        debug.usedPatternFallback = true;
      }
    }
    
    debug.containersFound = allContainers.length;
    console.log('📊 Total containers found:', allContainers.length);
    
    // Extract data from containers
    allContainers.forEach((container, index) => {
      try {
        // Find title element - multiple strategies
        let titleElement = container.querySelector('h3');
        if (!titleElement) {
          titleElement = container.querySelector('[role="heading"]');
        }
        if (!titleElement) {
          titleElement = container.querySelector('.DKV0Md, .LC20lb, .RrzC0d');
        }
        
        // Find main link element
        let linkElement = null;
        
        // Strategy 1: Find the h3's parent anchor
        if (titleElement) {
          linkElement = titleElement.closest('a[href]');
        }
        
        // Strategy 2: Find first anchor in container
        if (!linkElement) {
          const anchors = container.querySelectorAll('a[href]');
          for (const anchor of anchors) {
            const href = anchor.href;
            if (href && 
                href.startsWith('http') && 
                !href.includes('google.com/search') &&
                !href.includes('webcache.google') &&
                !href.includes('translate.google')) {
              linkElement = anchor;
              break;
            }
          }
        }
        
        // Find snippet/description
        let snippetElement = container.querySelector('.VwiC3b, .yXK7lf, .lyLwlc');
        if (!snippetElement) {
          snippetElement = container.querySelector('.IsZvec, .aCOpRe, .yDYNvb, .s, [data-sncf], [data-content-feature]');
        }
        if (!snippetElement) {
          // Advanced fallback: find text-heavy divs
          const textDivs = container.querySelectorAll('div, span');
          for (const div of textDivs) {
            const text = div.textContent.trim();
            const childDivs = div.querySelectorAll('div').length;
            // Look for leaf nodes with substantial text
            if (text.length > 50 && text.length < 500 && childDivs < 2 && !div.querySelector('h3')) {
              snippetElement = div;
              break;
            }
          }
        }
        
        // Extract and validate data
        if (titleElement && linkElement) {
          const title = titleElement.textContent.trim();
          let url = linkElement.href;
          
          // Handle Google redirect URLs
          if (url.includes('google.com/url?')) {
            try {
              const urlParams = new URLSearchParams(new URL(url).search);
              const realUrl = urlParams.get('q') || urlParams.get('url');
              if (realUrl) url = realUrl;
            } catch (e) {
              console.log('Failed to parse redirect URL:', e);
            }
          }
          
          const snippet = snippetElement ? snippetElement.textContent.trim() : '';
          
          // Validation - must be a real search result
          const isValid = title && 
              url && 
              url.startsWith('http') &&
              !url.includes('google.com/search') && 
              !url.includes('accounts.google.com') &&
              !url.includes('support.google.com') &&
              !url.includes('policies.google.com') &&
                         !url.includes('webcache.google') &&
                         !url.includes('translate.google') &&
                         title.length > 5 &&
                         title.length < 300;
            
          if (isValid) {
            // Extract domain from URL
            let domain = '';
            try {
              const urlObj = new URL(url);
              domain = urlObj.hostname.replace(/^www\./, '');
            } catch (e) {
              // Manual extraction fallback
              const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
              domain = match ? match[1] : url;
            }
            
            results.push({
              position: results.length + 1,
              title: title.substring(0, 200),
              url,
              domain,
              snippet: snippet.substring(0, 300)
            });
            
            console.log(`✅ Result #${results.length}:`, { 
              title: title.substring(0, 50), 
              domain 
            });
          } else {
            console.log('❌ Skipped invalid result:', { title: title?.substring(0, 30), url: url?.substring(0, 50) });
          }
        } else {
          console.log(`⚠️ Container ${index} missing required elements:`, {
            hasTitle: !!titleElement,
            hasLink: !!linkElement
          });
        }
      } catch (error) {
        console.error('❌ Error extracting result at index', index, ':', error);
      }
    });

    console.log('✅ Total results extracted:', results.length);

    // Extract People Also Ask questions ONLY from FIRST PAGE
    const paaQuestions = new Set();
    
    if (isFirstPage) {
      console.log('📋 Extracting PAA questions from FIRST PAGE ONLY');
    
    // PAA selectors (updated)
    const paaSelectors = [
      '[jsname="Cpkphb"]',
      '.related-question-pair',
      '.cbphWd',
      '[data-q]',
      '.JolIg',
      '.iDjcJe',
      'div[role="heading"][aria-level="3"]'
    ];
    
    paaSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text.includes('?') && text.length > 10 && text.length < 300) {
        paaQuestions.add(text);
          }
        });
      } catch (e) {
        console.log('PAA selector failed:', selector);
      }
    });
    
    // Also scan all headings for questions
    const allHeadings = document.querySelectorAll('h3, [role="heading"]');
    allHeadings.forEach(h3 => {
      const text = h3.textContent.trim();
      if (text.includes('?') && text.length > 10 && text.length < 300 && !text.includes('google')) {
        paaQuestions.add(text);
      }
    });

      console.log('❓ PAA questions found on first page:', paaQuestions.size);
    } else {
      console.log('⏭️ Skipping PAA extraction - not first page (start=' + startParam + ')');
    }

    return {
      results,
      paaQuestions: Array.from(paaQuestions).slice(0, 30),
      debug
    };
  }

  extractKeywordsFromResults(results) {
    if (!results || results.length === 0) return;

    console.log('🔑 Extracting ALL long-tail keywords from titles and descriptions...');

    // Extract from BOTH titles and snippets separately for better coverage
    results.forEach(result => {
      // Extract from TITLE
      if (result.title) {
        const titlePhrases = this.extractPhrases(result.title.toLowerCase(), 2, 10);
        titlePhrases.forEach(phrase => {
          const count = this.extractedKeywords.get(phrase) || 0;
          this.extractedKeywords.set(phrase, count + 1);
        });
      }
      
      // Extract from DESCRIPTION/SNIPPET
      if (result.snippet) {
        const snippetPhrases = this.extractPhrases(result.snippet.toLowerCase(), 2, 10);
        snippetPhrases.forEach(phrase => {
        const count = this.extractedKeywords.get(phrase) || 0;
        this.extractedKeywords.set(phrase, count + 1);
      });
      }
    });

    console.log(`✅ Extracted ${this.extractedKeywords.size} unique multi-word keyword phrases`);
    console.log('📊 Range: 2-10 word phrases (NO single words)');
  }

  extractPhrases(text, minWords, maxWords) {
    if (!text || text.length < 5) return [];
    
    // Clean and normalize text - MORE AGGRESSIVE
    const cleanText = text
      .replace(/[^\w\s'-]/g, ' ')  // Keep letters, numbers, spaces, hyphens, apostrophes
      .replace(/\s+/g, ' ')         // Normalize spaces
      .trim();
    
    const words = cleanText.split(' ').filter(w => w.length > 0);
    const phrases = [];

    // REDUCED stop words list - only filter the most common
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'was', 'are', 'be', 'it', 'this', 'that'
    ]);

    // REDUCED filler phrases list - only the most obvious
    const fillerPhrases = [
      'click here', 'privacy policy', 'terms of service', 'all rights reserved'
    ];

    // Extract phrases of specified length (VERY AGGRESSIVE - extract EVERYTHING)
    for (let i = 0; i < words.length; i++) {
      for (let length = minWords; length <= maxWords && i + length <= words.length; length++) {
        const phrase = words.slice(i, i + length);
        const phraseStr = phrase.join(' ');
        
        // MUCH MORE LENIENT FILTERING
        
        // Skip only if BOTH first AND last are stop words (not just one)
        const firstIsStop = stopWords.has(phrase[0].toLowerCase());
        const lastIsStop = stopWords.has(phrase[phrase.length - 1].toLowerCase());
        if (firstIsStop && lastIsStop) {
          continue;
        }
        
        // More lenient on average word length
        const avgWordLength = phrase.reduce((sum, w) => sum + w.length, 0) / phrase.length;
        if (avgWordLength < 2.5) {  // Reduced from 3
          continue;
        }
        
        // More lenient on numbers - allow up to 70% numbers
        const numberWords = phrase.filter(w => /^\d+$/.test(w)).length;
        if (numberWords > phrase.length * 0.7) {  // Increased from 0.5
          continue;
        }
        
        // Skip only exact matches of filler phrases
        if (fillerPhrases.some(filler => phraseStr.toLowerCase() === filler)) {
          continue;
        }
        
        // MORE LENIENT length requirements
        if (phraseStr.length >= 6 && phraseStr.length <= 150 && phrase.length >= 2) {  // Reduced minimum from 8, increased max from 120
          phrases.push(phraseStr);
        }
      }
    }

    return phrases;
  }

  processResults(keyword, domain, country) {
    const resultCard = document.getElementById('ranking-result-card');
    const topResultsContainer = document.getElementById('top-results-container');
    const openGoogleBtn = document.getElementById('open-google-search');

    console.log('📊 Processing results. Total found:', this.allResults.length);

    // Store search params for "Open in Google" button
    this.currentSearch = { keyword, country };
    openGoogleBtn.classList.remove('hidden');

    // If no results, error handling is done in startRankingCheck
    if (this.allResults.length === 0) {
      return;
    }

    // Find user's domain position with improved matching
    let userPosition = null;
    let userResult = null;

    if (domain) {
      // Normalize user input - remove protocol, www, trailing slash
      const normalizedInput = domain.toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .replace(/\/$/, '')
        .trim();
      
      console.log('🔍 Looking for domain:', normalizedInput);
      console.log('📊 In results:', this.allResults.map(r => r.domain));
      
      // Try multiple matching strategies
      userResult = this.allResults.find(result => {
        const resultDomain = result.domain.toLowerCase().replace('www.', '');
        const resultUrl = result.url.toLowerCase();
        
        // Strategy 1: Exact domain match
        if (resultDomain === normalizedInput) {
          console.log('✅ Exact match found:', resultDomain);
          return true;
        }
        
        // Strategy 2: Domain contains input (e.g., "example.com" matches "blog.example.com")
        if (resultDomain.includes(normalizedInput)) {
          console.log('✅ Contains match found:', resultDomain);
          return true;
        }
        
        // Strategy 3: Input contains domain (e.g., "blog.example.com" matches "example.com")
        if (normalizedInput.includes(resultDomain)) {
          console.log('✅ Reverse contains match found:', resultDomain);
          return true;
        }
        
        // Strategy 4: URL contains the normalized input
        if (resultUrl.includes(normalizedInput)) {
          console.log('✅ URL match found:', resultUrl);
          return true;
        }
        
        // Strategy 5: Check if they share the same root domain
        const getRootDomain = (d) => {
          const parts = d.split('.');
          if (parts.length >= 2) {
            return parts.slice(-2).join('.');
          }
          return d;
        };
        
        const inputRoot = getRootDomain(normalizedInput);
        const resultRoot = getRootDomain(resultDomain);
        
        if (inputRoot === resultRoot && inputRoot.length > 3) {
          console.log('✅ Root domain match found:', inputRoot, '=', resultRoot);
          return true;
        }
        
        return false;
      });

      if (userResult) {
        userPosition = this.allResults.indexOf(userResult) + 1;
        console.log('🎯 Found ranking position:', userPosition, 'for', userResult.domain);
      } else {
        console.log('❌ Domain not found in results:', normalizedInput);
      }
    }

    // Display ranking result card
    if (userPosition) {
      resultCard.className = 'ranking-result-card';
      resultCard.innerHTML = `
        <div class="ranking-result-header">
          <div class="ranking-position">#${userPosition}</div>
          <div class="ranking-label">Your Ranking Position</div>
        </div>
        <div class="ranking-details">
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Keyword</div>
            <div class="ranking-detail-value">${this.escapeHtml(keyword)}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Domain</div>
            <div class="ranking-detail-value">${this.escapeHtml(userResult.domain)}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Country</div>
            <div class="ranking-detail-value">${country.toUpperCase()}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Total Results Scanned</div>
            <div class="ranking-detail-value">${this.allResults.length}</div>
          </div>
        </div>
      `;
    } else {
      resultCard.className = 'ranking-result-card not-found';
      resultCard.innerHTML = `
        <div class="ranking-result-header">
          <div class="ranking-position not-found">Not in Top ${this.allResults.length}</div>
          <div class="ranking-label not-found">${domain ? 'Domain Not Found' : 'Check Complete'}</div>
        </div>
        <div class="ranking-details">
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Keyword</div>
            <div class="ranking-detail-value">${this.escapeHtml(keyword)}</div>
          </div>
          <div class="ranking-detail-item">
            <div class="ranking-detail-label">Country</div>
            <div class="ranking-detail-value">${country.toUpperCase()}</div>
          </div>
          <div class="ranking-detail-item" style="grid-column: 1 / -1;">
            <div class="ranking-detail-label">Total Results Scanned</div>
            <div class="ranking-detail-value">${this.allResults.length}</div>
          </div>
        </div>
      `;
    }

    // Display top 10 results
    topResultsContainer.innerHTML = '';
    const top10 = this.allResults.slice(0, 10);
    
    top10.forEach((result, index) => {
      const position = index + 1;
      const isUserDomain = domain && result.domain.toLowerCase().replace('www.', '').includes(domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, ''));
      
      const resultDiv = document.createElement('div');
      resultDiv.className = `result-item${isUserDomain ? ' your-domain' : ''}`;
      resultDiv.innerHTML = `
        <div class="result-position">${position}</div>
        <div class="result-title">${this.escapeHtml(result.title)}</div>
        <div class="result-url">${this.escapeHtml(result.domain)}</div>
        <div class="result-description">${this.escapeHtml(result.snippet.substring(0, 150))}${result.snippet.length > 150 ? '...' : ''}</div>
        ${isUserDomain ? '<div class="your-domain-badge">✓ Your Domain</div>' : ''}
      `;
      topResultsContainer.appendChild(resultDiv);
    });
  }

  displayExtractedKeywords() {
    const contentKeywordsContainer = document.getElementById('content-keywords');
    const paaContainer = document.getElementById('paa-questions');

    // Sort ALL keywords by frequency (no limit - show all) + FILTER JUNK
    const sortedKeywords = Array.from(this.extractedKeywords.entries())
      .filter(([keyword, count]) => {
        // Must be multi-word
        if (keyword.split(' ').length < 2) return false;
        
        // Remove code/technical junk
        if (keyword.includes('function') || keyword.includes('var ') || keyword.includes('className')) return false;
        if (keyword.includes('\\x') || keyword.includes('setAttribute')) return false;
        if (keyword.includes('://') || keyword.includes('.com/')) return false;
        
        // Must look like natural language
        if (keyword.match(/[{}\[\]<>]/)) return false;  // No brackets
        if ((keyword.match(/[^a-zA-Z0-9\s\'\-]/g) || []).length > 3) return false;  // Too many special chars
        
        return true;
      })
      .sort((a, b) => b[1] - a[1]);  // Sort by frequency

    // Display ALL content keywords
    contentKeywordsContainer.innerHTML = '';
    if (sortedKeywords.length > 0) {
      // Add header with total count
      const header = document.createElement('div');
      header.style.cssText = 'margin-bottom: 10px; font-weight: 600; color: #4f46e5;';
      header.textContent = `📊 Found ${sortedKeywords.length} unique multi-word keyword phrases (2-10 words)`;
      contentKeywordsContainer.appendChild(header);
      
      // Display all keywords
      sortedKeywords.forEach(([keyword, count]) => {
        const tag = document.createElement('div');
        tag.className = 'keyword-tag';
        tag.innerHTML = `
          ${this.escapeHtml(keyword)}
          <span class="keyword-count">${count}</span>
        `;
        tag.addEventListener('click', () => {
          this.copyToClipboard(keyword);
          this.showNotification(`Copied "${keyword}" to clipboard`, 'success');
        });
        contentKeywordsContainer.appendChild(tag);
      });
    } else {
      contentKeywordsContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No keywords extracted</p>';
    }

    // Display FILTERED PAA questions
    paaContainer.innerHTML = '';
    if (this.paaQuestions.length > 0) {
      // Filter out junk
      const cleanQuestions = this.paaQuestions.filter(q => {
        // Must be reasonable length
        if (q.length < 10 || q.length > 300) return false;
        
        // Remove code/JavaScript patterns
        if (q.includes('function(') || q.includes('){') || q.includes('var ')) return false;
        if (q.includes('\\x') || q.includes('setAttribute') || q.includes('className')) return false;
        
        // Remove URLs
        if (q.includes('://') || q.includes('www.') || q.includes('.com/')) return false;
        
        // Remove if too many special characters
        const specialCharCount = (q.match(/[^a-zA-Z0-9\s\?\'\-]/g) || []).length;
        if (specialCharCount > 5) return false;
        
        // Remove if contains code patterns
        if (q.match(/[{}\[\]<>]/)) return false;
        if ((q.match(/\(/g) || []).length > 2) return false;
        
        // Must look like a real question
        const words = q.split(' ');
        if (words.length < 2) return false;
        
        return true;
      });
      
      // Add header with total count
      const paaHeader = document.createElement('div');
      paaHeader.style.cssText = 'margin-bottom: 10px; font-weight: 600; color: #4f46e5;';
      paaHeader.textContent = `❓ Found ${this.allPaaQuestions.length} "People Also Ask" questions`;
      paaContainer.appendChild(paaHeader);
      
      // Display first 10 PAA questions
      this.displayPaaQuestions(0, this.paaPerLoad);
      
      // Show load more button if there are more questions
      if (this.allPaaQuestions.length > this.paaPerLoad) {
        this.showLoadMorePaa();
      }
      
      // If all were filtered out, show message
      if (this.allPaaQuestions.length === 0) {
        paaContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No "People Also Ask" questions found</p>';
      }
    } else {
      paaContainer.innerHTML = '<p style="color: #9ca3af; font-style: italic;">No "People Also Ask" questions found</p>';
    }
  }

  copyExtractedKeywords() {
    const keywords = Array.from(this.extractedKeywords.keys()).join('\n');
    const questions = this.paaQuestions.join('\n');
    const allText = `=== CONTENT KEYWORDS ===\n${keywords}\n\n=== PEOPLE ALSO ASK QUESTIONS ===\n${questions}`;
    
    this.copyToClipboard(allText);
    this.showNotification('All keywords and questions copied to clipboard', 'success');
  }

  openGoogleSearch() {
    if (this.currentSearch) {
      const { keyword, country } = this.currentSearch;
      const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${country}&hl=en`;
      chrome.tabs.create({ url });
    }
  }

  updateProgress(page, startPosition) {
    const progressBar = document.getElementById('ranking-progress-bar');
    const progressStatus = document.getElementById('ranking-status');
    const resultsFound = document.getElementById('ranking-results-found');

    const percentage = (page / this.totalPages) * 100;
    progressBar.style.width = `${percentage}%`;
    
    const endPosition = startPosition + this.resultsPerPage;
    progressStatus.textContent = `Scanning page ${page} of ${this.totalPages} (results ${startPosition + 1}-${endPosition})...`;
    
    resultsFound.textContent = `${this.allResults.length} results scanned`;
  }

  startTimer() {
    const timeElapsedEl = document.getElementById('ranking-time-elapsed');
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      timeElapsedEl.textContent = `${elapsed}s elapsed`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.remove('hidden');
    }
  }

  hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add('hidden');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  showCaptchaError(page, keyword, country) {
    const resultCard = document.getElementById('ranking-result-card');
    const topResultsContainer = document.getElementById('top-results-container');
    
    resultCard.className = 'ranking-result-card not-found';
    resultCard.innerHTML = `
      <div class="ranking-result-header">
        <div class="ranking-position not-found">🤖 CAPTCHA Detected</div>
        <div class="ranking-label not-found">Google Anti-Bot Protection</div>
      </div>
      <div class="ranking-details">
        <div class="ranking-detail-item" style="grid-column: 1 / -1;">
          <div class="ranking-detail-value" style="font-size: 13px; color: #dc2626; text-align: left;">
            <p><strong>Google detected automated access at page ${page}</strong></p>
            <br>
            <p><strong>Why this happens:</strong></p>
            <ul style="margin: 8px 0 8px 20px; line-height: 1.6;">
              <li>Multiple rapid searches trigger Google's anti-bot systems</li>
              <li>Google uses CAPTCHA to verify you're human</li>
              <li>This is a normal security measure</li>
            </ul>
            <br>
            <p><strong>Solutions:</strong></p>
            <ul style="margin: 8px 0 8px 20px; line-height: 1.6;">
              <li><strong>Wait 10-15 minutes</strong> before trying again</li>
              <li>Use fewer searches per session (max 2-3 per hour)</li>
              <li>Click "Open in Google" below to manually check rankings</li>
              <li>Consider using Google Search Console for ranking data</li>
            </ul>
            <br>
            <p style="background: #fef3c7; padding: 10px; border-radius: 6px; color: #92400e;">
              <strong>💡 Tip:</strong> For frequent ranking checks, use official tools like Google Search Console (free) or paid SEO tools (SEMrush, Ahrefs) that have API access.
            </p>
          </div>
        </div>
      </div>
    `;
    
    topResultsContainer.innerHTML = `
      <p style="text-align: center; color: #9ca3af; padding: 20px;">
        Try again in 10-15 minutes or use manual Google search
      </p>
    `;
    
    // Make sure "Open in Google" button is visible
    this.currentSearch = { keyword, country };
    const openGoogleBtn = document.getElementById('open-google-search');
    openGoogleBtn.classList.remove('hidden');
  }

  showNoResultsError(keyword, country) {
    const resultCard = document.getElementById('ranking-result-card');
    const topResultsContainer = document.getElementById('top-results-container');
    
    resultCard.className = 'ranking-result-card not-found';
    resultCard.innerHTML = `
      <div class="ranking-result-header">
        <div class="ranking-position not-found">⚠️ No Data</div>
        <div class="ranking-label not-found">Could Not Extract Results</div>
      </div>
      <div class="ranking-details">
        <div class="ranking-detail-item" style="grid-column: 1 / -1;">
          <div class="ranking-detail-value" style="font-size: 13px; color: #dc2626; text-align: left;">
            <p><strong>Unable to extract search results from Google</strong></p>
            <br>
            <p><strong>Possible reasons:</strong></p>
            <ul style="margin: 8px 0 8px 20px; line-height: 1.6;">
              <li>Google's HTML structure changed (happens frequently)</li>
              <li>Network connection issues or timeouts</li>
              <li>Google showed a verification page</li>
              <li>Browser blocked the extraction script</li>
            </ul>
            <br>
            <p><strong>What to try:</strong></p>
            <ul style="margin: 8px 0 8px 20px; line-height: 1.6;">
              <li>Click "Open in Google" to verify results exist manually</li>
              <li>Try a different keyword or country</li>
              <li>Wait a few minutes and try again</li>
              <li>Check the browser console (F12) for detailed errors</li>
              <li>Update the extension if an update is available</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    topResultsContainer.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 20px;">No results to display</p>';
    
    // Make sure "Open in Google" button is visible
    this.currentSearch = { keyword, country };
    const openGoogleBtn = document.getElementById('open-google-search');
    openGoogleBtn.classList.remove('hidden');
  }

  showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#fee2e2' : 
                    type === 'success' ? '#dcfce7' : 
                    type === 'warning' ? '#fef3c7' : '#dbeafe';
    const textColor = type === 'error' ? '#dc2626' : 
                      type === 'success' ? '#059669' : 
                      type === 'warning' ? '#92400e' : '#1e40af';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: ${textColor};
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 13px;
      font-weight: 500;
      max-width: 350px;
      word-wrap: break-word;
      line-height: 1.4;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, type === 'warning' ? 5000 : 3000);
  }

  // Helper methods for load more functionality
  displayKeywords(startIndex, count) {
    const contentKeywordsContainer = document.getElementById('content-keywords');
    const keywordsToShow = this.allKeywords.slice(startIndex, startIndex + count);
    
    keywordsToShow.forEach(kw => {
      const tag = document.createElement('div');
      tag.className = 'keyword-tag';
      tag.innerHTML = `
        ${this.escapeHtml(kw.word)}
        <span class="keyword-count">${kw.count}</span>
      `;
      tag.addEventListener('click', () => {
        this.copyToClipboard(kw.word);
        this.showNotification(`Copied "${kw.word}" to clipboard`, 'success');
      });
      contentKeywordsContainer.appendChild(tag);
    });
    
    this.keywordsShown = startIndex + count;
  }

  displayPaaQuestions(startIndex, count) {
    const paaContainer = document.getElementById('paa-questions');
    const questionsToShow = this.allPaaQuestions.slice(startIndex, startIndex + count);
    
    questionsToShow.forEach(question => {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'paa-question';
      questionDiv.textContent = question;
      questionDiv.addEventListener('click', () => {
        this.copyToClipboard(question);
        this.showNotification('Question copied to clipboard', 'success');
      });
      paaContainer.appendChild(questionDiv);
    });
    
    this.paaShown = startIndex + count;
  }

  showLoadMoreKeywords() {
    const loadMoreContainer = document.getElementById('load-more-keywords');
    const keywordsShowing = document.getElementById('keywords-showing');
    
    if (loadMoreContainer && keywordsShowing) {
      loadMoreContainer.classList.remove('hidden');
      keywordsShowing.textContent = `Showing ${this.keywordsShown} of ${this.allKeywords.length}`;
      
      const loadMoreBtn = document.getElementById('load-more-keywords-btn');
      if (loadMoreBtn) {
        loadMoreBtn.onclick = () => {
          this.loadMoreKeywords();
        };
      }
    }
  }

  showLoadMorePaa() {
    const loadMoreContainer = document.getElementById('load-more-paa');
    const paaShowing = document.getElementById('paa-showing');
    
    if (loadMoreContainer && paaShowing) {
      loadMoreContainer.classList.remove('hidden');
      paaShowing.textContent = `Showing ${this.paaShown} of ${this.allPaaQuestions.length}`;
      
      const loadMoreBtn = document.getElementById('load-more-paa-btn');
      if (loadMoreBtn) {
        loadMoreBtn.onclick = () => {
          this.loadMorePaa();
        };
      }
    }
  }

  loadMoreKeywords() {
    const remaining = this.allKeywords.length - this.keywordsShown;
    const toLoad = Math.min(this.keywordsPerLoad, remaining);
    
    this.displayKeywords(this.keywordsShown, toLoad);
    
    const loadMoreContainer = document.getElementById('load-more-keywords');
    const keywordsShowing = document.getElementById('keywords-showing');
    
    if (keywordsShowing) {
      keywordsShowing.textContent = `Showing ${this.keywordsShown} of ${this.allKeywords.length}`;
    }
    
    if (this.keywordsShown >= this.allKeywords.length && loadMoreContainer) {
      loadMoreContainer.style.display = 'none';
    }
  }

  loadMorePaa() {
    const remaining = this.allPaaQuestions.length - this.paaShown;
    const toLoad = Math.min(this.paaPerLoad, remaining);
    
    this.displayPaaQuestions(this.paaShown, toLoad);
    
    const loadMoreContainer = document.getElementById('load-more-paa');
    const paaShowing = document.getElementById('paa-showing');
    
    if (paaShowing) {
      paaShowing.textContent = `Showing ${this.paaShown} of ${this.allPaaQuestions.length}`;
    }
    
    if (this.paaShown >= this.allPaaQuestions.length && loadMoreContainer) {
      loadMoreContainer.style.display = 'none';
    }
  }

  // Collapse/Expand functionality
  setupCollapseButtons() {
    const toggleKeywords = document.getElementById('toggle-keywords');
    const togglePaa = document.getElementById('toggle-paa');
    
    if (toggleKeywords) {
      toggleKeywords.addEventListener('click', () => {
        this.toggleSection('keywords');
      });
    }
    
    if (togglePaa) {
      togglePaa.addEventListener('click', () => {
        this.toggleSection('paa');
      });
    }
  }

  toggleSection(sectionType) {
    const section = sectionType === 'keywords' ? 
      document.querySelector('.keyword-section:first-of-type') : 
      document.querySelector('.keyword-section:last-of-type');
    
    const button = sectionType === 'keywords' ? 
      document.getElementById('toggle-keywords') : 
      document.getElementById('toggle-paa');
    
    if (section && button) {
      section.classList.toggle('collapsed');
      button.classList.toggle('collapsed');
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GoogleRankingChecker();
  });
} else {
  new GoogleRankingChecker();
}
