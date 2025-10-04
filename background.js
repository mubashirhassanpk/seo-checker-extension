// SEO Checker by Sekhlo - Background Script

// Global variables for service worker
let contextMenusCreated = false;

// Initialize the background service
initializeBackgroundService();

function initializeBackgroundService() {
  setupEventListeners();
  initializeStorage();
}

function setupEventListeners() {
  // Handle extension installation
  chrome.runtime.onInstalled.addListener((details) => {
    handleInstallation(details);
  });

  // Handle tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    handleTabUpdate(tabId, changeInfo, tab);
  });

  // Handle messages from popup and content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true; // Keep message channel open for async responses
  });
}

async function initializeStorage() {
    // Initialize default settings
    const defaultSettings = {
      autoAnalyze: true,
      saveHistory: true,
      showNotifications: true,
      theme: 'light',
      language: 'en'
    };

    try {
      const result = await chrome.storage.sync.get('settings');
      if (!result.settings) {
        await chrome.storage.sync.set({ settings: defaultSettings });
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

function handleInstallation(details) {
    if (details.reason === 'install') {
      // First time installation
      showWelcomeNotification();
      createContextMenus();
    } else if (details.reason === 'update') {
      // Extension updated
      handleUpdate(details.previousVersion);
    }
  }

function showWelcomeNotification() {
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'SEO Checker by Sekhlo',
          message: 'Extension installed successfully! Click the extension icon to start analyzing pages.'
        });
      }
    } catch (error) {
      console.log('Notifications not available:', error);
    }
  }

function createContextMenus() {
  if (contextMenusCreated) return;
  
  try {
    // Check if contextMenus API is available
    if (!chrome.contextMenus) {
      console.log('Context menus API not available');
      return;
    }

    // Remove any existing menus first
    chrome.contextMenus.removeAll(() => {
      // Create new menus
      chrome.contextMenus.create({
        id: 'analyze-page',
        title: 'Analyze this page with SEO Analyzer',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'analyze-link',
        title: 'Analyze link with SEO Analyzer',
        contexts: ['link']
      });
      
      // Set up context menu click handler after creating menus
      if (!contextMenusCreated) {
        chrome.contextMenus.onClicked.addListener((info, tab) => {
          handleContextMenuClick(info, tab);
        });
      }
      
      contextMenusCreated = true;
      console.log('Context menus created successfully');
    });
  } catch (error) {
    console.error('Error creating context menus:', error);
  }
}

function handleUpdate(previousVersion) {
    // Handle extension updates
    console.log(`Updated from version ${previousVersion}`);
    
    // Could show update notification or migrate data
    try {
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'SEO Checker by Sekhlo Updated',
          message: 'Extension has been updated with new features!'
        });
      }
    } catch (error) {
      console.log('Notifications not available:', error);
    }
  }

function handleTabUpdate(tabId, changeInfo, tab) {
    // Only process when page is completely loaded
    if (changeInfo.status === 'complete' && tab.url) {
      processPageLoad(tabId, tab);
    }
  }

async function processPageLoad(tabId, tab) {
    try {
      // Check if auto-analyze is enabled
      const result = await chrome.storage.sync.get('settings');
      const settings = result.settings || {};

      if (settings.autoAnalyze && isAnalyzableUrl(tab.url)) {
        // Could trigger automatic analysis here
        // For now, we'll just update the badge
        updateBadge(tabId, 'Ready');
      }
    } catch (error) {
      console.error('Error processing page load:', error);
    }
  }

function isAnalyzableUrl(url) {
    // Check if URL is analyzable (not chrome://, file://, etc.)
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  }

function updateBadge(tabId, text) {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: text
    });

    chrome.action.setBadgeBackgroundColor({
      color: '#4F46E5'
    });
  }

async function handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getSettings':
          const settings = await getSettings();
          sendResponse({ success: true, data: settings });
          break;

        case 'saveSettings':
          await saveSettings(request.settings);
          sendResponse({ success: true });
          break;

        case 'saveAnalysis':
          await saveAnalysis(request.analysis);
          sendResponse({ success: true });
          break;

        case 'getHistory':
          const history = await getHistory();
          sendResponse({ success: true, data: history });
          break;

        case 'clearHistory':
          await clearHistory();
          sendResponse({ success: true });
          break;

        case 'exportData':
          const exportData = await exportData();
          sendResponse({ success: true, data: exportData });
          break;

        case 'analyzeCompetitor':
          const competitorAnalysis = await analyzeCompetitor(request.url, request.keywords);
          sendResponse({ success: true, data: competitorAnalysis });
          break;

        case 'startBackgroundRankingCheck':
          startBackgroundRankingCheck(request.keyword, request.country, request.domain);
          sendResponse({ success: true, message: 'Background scan started' });
          break;

        case 'getRankingStatus':
          const status = await getRankingStatus();
          sendResponse({ success: true, data: status });
          break;

        case 'getRankingResults':
          const results = await getRankingResults(request.scanId);
          sendResponse({ success: true, data: results });
          break;

        case 'getRankingHistory':
          const rankingHistory = await getRankingHistory();
          sendResponse({ success: true, data: rankingHistory });
          break;

        case 'exportRankingData':
          const rankingExport = await exportRankingData(request.scanId, request.format);
          sendResponse({ success: true, data: rankingExport });
          break;

        case 'cancelRankingCheck':
          cancelRankingCheck();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

function handleContextMenuClick(info, tab) {
    switch (info.menuItemId) {
      case 'analyze-page':
        openPopupForTab(tab.id);
        break;

      case 'analyze-link':
        analyzeExternalUrl(info.linkUrl);
        break;
    }
  }

function openPopupForTab(tabId) {
    // Focus on the tab and open popup
    chrome.tabs.update(tabId, { active: true });
    chrome.action.openPopup();
  }

async function analyzeExternalUrl(url) {
    // This would typically open a new tab or show results
    // For now, we'll just store it for later analysis
    try {
      const result = await chrome.storage.local.get('pendingAnalysis');
      const pending = result.pendingAnalysis || [];
      pending.push({
        url: url,
        timestamp: new Date().toISOString(),
        type: 'external'
      });
      
      await chrome.storage.local.set({ pendingAnalysis: pending });
      
      try {
        if (chrome.notifications && chrome.notifications.create) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'URL Added for Analysis',
            message: `${url} has been added to your analysis queue.`
          });
        }
      } catch (notificationError) {
        console.log('Could not show notification:', notificationError);
      }
    } catch (error) {
      console.error('Error adding URL for analysis:', error);
    }
  }

async function getSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      return result.settings || {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

async function saveSettings(settings) {
    try {
      await chrome.storage.sync.set({ settings });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

async function saveAnalysis(analysis) {
    try {
      // Get existing history
      const result = await chrome.storage.local.get('analysisHistory');
      const history = result.analysisHistory || [];
      
      // Add new analysis
      const analysisRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        url: analysis.url,
        title: analysis.metaTitle || 'Untitled',
        seoScore: calculateSEOScore(analysis),
        data: analysis
      };
      
      history.unshift(analysisRecord);
      
      // Keep only last 100 analyses
      if (history.length > 100) {
        history.splice(100);
      }
      
      await chrome.storage.local.set({ analysisHistory: history });
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

async function getHistory() {
    try {
      const result = await chrome.storage.local.get('analysisHistory');
      return result.analysisHistory || [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

async function clearHistory() {
    try {
      await chrome.storage.local.remove('analysisHistory');
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

async function exportData() {
    try {
      const history = await getHistory();
      const settings = await getSettings();
      
      return {
        exportDate: new Date().toISOString(),
        version: chrome.runtime.getManifest().version,
        settings: settings,
        history: history
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

async function analyzeCompetitor(url, keywords) {
    // This is a placeholder for competitor analysis
    // In a real implementation, this might call an external API
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock competitor analysis data
      const mockAnalysis = {
        url: url,
        keywords: keywords,
        timestamp: new Date().toISOString(),
        seoScore: Math.floor(Math.random() * 40) + 40, // 40-80
        metrics: {
          wordCount: Math.floor(Math.random() * 2000) + 500,
          backlinks: Math.floor(Math.random() * 100) + 10,
          loadTime: (Math.random() * 3 + 1).toFixed(1) + 's',
          domainAuthority: Math.floor(Math.random() * 50) + 30,
          pageAuthority: Math.floor(Math.random() * 40) + 20
        },
        recommendations: [
          'Improve page loading speed',
          'Add more internal links',
          'Optimize meta descriptions',
          'Increase content length'
        ]
      };
      
      return mockAnalysis;
    } catch (error) {
      console.error('Error analyzing competitor:', error);
      throw error;
    }
  }

function calculateSEOScore(analysis) {
    // Simple SEO score calculation
    let score = 0;
    let maxScore = 0;

    // Title (20 points)
    maxScore += 20;
    if (analysis.metaTitle) {
      const titleLength = analysis.metaTitle.length;
      if (titleLength >= 30 && titleLength <= 60) score += 20;
      else if (titleLength > 0) score += 10;
    }

    // Description (20 points)
    maxScore += 20;
    if (analysis.metaDescription) {
      const descLength = analysis.metaDescription.length;
      if (descLength >= 120 && descLength <= 160) score += 20;
      else if (descLength > 0) score += 10;
    }

    // H1 tags (15 points)
    maxScore += 15;
    if (analysis.h1Count === 1) score += 15;
    else if (analysis.h1Count > 0) score += 8;

    // Images with alt (15 points)
    maxScore += 15;
    if (analysis.imageCount > 0) {
      const altRatio = (analysis.imagesWithAlt || 0) / analysis.imageCount;
      score += Math.round(altRatio * 15);
    } else {
      score += 15; // No images is fine
    }

    // Content length (10 points)
    maxScore += 10;
    if (analysis.wordCount >= 300) score += 10;
    else if (analysis.wordCount >= 100) score += 5;

    // Internal links (10 points)
    maxScore += 10;
    if (analysis.internalLinks >= 3) score += 10;
    else if (analysis.internalLinks > 0) score += 5;

    // Technical factors (10 points)
    maxScore += 10;
    if (analysis.technicalChecks) {
      const passedChecks = analysis.technicalChecks.filter(check => check.status === 'pass').length;
      const totalChecks = analysis.technicalChecks.length;
      if (totalChecks > 0) {
        score += Math.round((passedChecks / totalChecks) * 10);
      }
    }

    return Math.round((score / maxScore) * 100);
  }

// Utility method to check if notifications are supported
function isNotificationSupported() {
    return chrome.notifications && typeof chrome.notifications.create === 'function';
  }

// Method to handle errors gracefully
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    try {
      if (isNotificationSupported()) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'SEO Analyzer Error',
          message: `An error occurred: ${error.message}`
        });
      }
    } catch (notificationError) {
      console.log('Could not show error notification:', notificationError);
    }
  }

// Background service is initialized at the top of the file

// ============================================
// BACKGROUND RANKING CHECKER
// ============================================

let currentRankingScan = null;
let rankingScanCancelled = false;

async function startBackgroundRankingCheck(keyword, country, domain) {
  console.log('🚀 Starting background ranking check:', { keyword, country, domain });
  
  // Create scan ID
  const scanId = Date.now().toString();
  
  // Initialize scan status
  currentRankingScan = {
    id: scanId,
    keyword,
    country,
    domain,
    status: 'running',
    currentPage: 0,
    totalPages: 10,
    resultsFound: 0,
    startTime: Date.now(),
    progress: 0
  };
  
  // Save initial status
  await chrome.storage.local.set({ currentRankingScan });
  
  // Update badge
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6' });
  
  // Start scanning in background
  performBackgroundScan(scanId, keyword, country, domain);
}

async function performBackgroundScan(scanId, keyword, country, domain) {
  rankingScanCancelled = false;
  
  const allResults = [];
  const extractedKeywords = new Map();
  const paaQuestions = [];
  const resultsPerPage = 10;
  const totalPages = 10;
  
  try {
    for (let page = 0; page < totalPages; page++) {
      if (rankingScanCancelled) {
        console.log('❌ Scan cancelled by user');
        await updateScanStatus(scanId, 'cancelled', page + 1);
        return;
      }
      
      const currentPage = page + 1;
      const startPosition = page * resultsPerPage;
      
      // Update status
      await updateScanStatus(scanId, 'running', currentPage, allResults.length);
      
      try {
        // Fetch results for this page
        const results = await fetchGoogleResultsBackground(keyword, country, startPosition);
        
        if (results && results.results && results.results.length > 0) {
          allResults.push(...results.results);
          
          // Extract keywords from first 3 pages
          if (page < 3 && results.results.length > 0) {
            extractKeywordsFromResults(results.results, extractedKeywords);
          }
          
          // Collect PAA questions ONLY from FIRST PAGE (page 0)
          if (page === 0 && results.paaQuestions && results.paaQuestions.length > 0) {
            console.log(`📋 Extracting PAA questions from FIRST PAGE ONLY (page ${page + 1})`);
            results.paaQuestions.forEach(q => {
              if (!paaQuestions.includes(q)) {
                paaQuestions.push(q);
              }
            });
            console.log(`✅ Added ${results.paaQuestions.length} PAA questions from page 1`);
          } else if (page > 0) {
            console.log(`⏭️ Skipping PAA extraction from page ${page + 1} (only extracting from page 1)`);
          }
          
          // Update progress
          await updateScanStatus(scanId, 'running', currentPage, allResults.length);
        }
      } catch (pageError) {
        if (pageError.message === 'CAPTCHA_DETECTED') {
          console.error(`🚫 CAPTCHA on page ${currentPage}`);
          await completeScan(scanId, keyword, country, domain, allResults, extractedKeywords, paaQuestions, 'captcha', currentPage);
          return;
        }
        console.error(`Error on page ${currentPage}:`, pageError);
      }
      
      // Wait between pages
      if (page < totalPages - 1) {
        await sleep(2000);
      }
    }
    
    // Complete scan successfully
    await completeScan(scanId, keyword, country, domain, allResults, extractedKeywords, paaQuestions, 'completed');
    
  } catch (error) {
    console.error('❌ Background scan error:', error);
    await completeScan(scanId, keyword, country, domain, allResults, extractedKeywords, paaQuestions, 'error');
  }
}

async function fetchGoogleResultsBackground(keyword, country, startPosition) {
  // Random delay
  const randomDelay = 3000 + Math.random() * 3000;
  await sleep(randomDelay);
  
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${country}&hl=en&num=10&start=${startPosition}`;
  
  console.log(`🔍 Fetching page: ${url}`);
  
  // Create tab
  const tab = await chrome.tabs.create({ url, active: false });
  
  try {
    // Wait for load
    await waitForTabComplete(tab.id);
    await sleep(7000);
    
    // Check for CAPTCHA
    const captchaCheck = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const hasCaptcha = document.body.innerHTML.includes('recaptcha') || 
                          document.body.innerHTML.includes('captcha') ||
                          document.querySelector('iframe[src*="recaptcha"]') !== null ||
                          document.querySelector('#captcha') !== null ||
                          document.body.textContent.includes('unusual traffic');
        return { hasCaptcha };
      }
    });
    
    if (captchaCheck[0]?.result?.hasCaptcha) {
      await chrome.tabs.remove(tab.id);
      throw new Error('CAPTCHA_DETECTED');
    }
    
    // Extract results
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractResultsFromPageBackground
    });
    
    await chrome.tabs.remove(tab.id);
    
    const extractionResult = results[0]?.result || { results: [], paaQuestions: [], debug: {} };
    
    // Log extraction summary
    console.log('📦 Extraction complete:', {
      resultsFound: extractionResult.results?.length || 0,
      paaFound: extractionResult.paaQuestions?.length || 0,
      debug: extractionResult.debug
    });
    
    if (extractionResult.results && extractionResult.results.length > 0) {
      console.log('📋 Extracted domains:', extractionResult.results.map(r => r.domain));
    }
    
    return extractionResult;
    
  } catch (error) {
    try {
      await chrome.tabs.remove(tab.id);
    } catch (e) {}
    throw error;
  }
}

// This function runs in the tab context
function extractResultsFromPageBackground() {
  console.log('🔎 Starting extraction on:', window.location.href);
  
  const results = [];
  const paaQuestions = new Set();
  const debug = {
    url: window.location.href,
    title: document.title,
    selectorsChecked: []
  };
  
  // Check if this is the first page (start=0) for PAA extraction
  const urlParams = new URLSearchParams(window.location.search);
  const startParam = parseInt(urlParams.get('start') || '0');
  const isFirstPage = startParam === 0;
  
  console.log(`📄 Page detection: start=${startParam}, isFirstPage=${isFirstPage}`);
  
  // COMPREHENSIVE EXTRACTION - Multiple strategies
  let allContainers = [];
  
  // Strategy 1: Modern Google selectors (2024)
  const modernSelectors = [
    'div.MjjYud',           // Current primary container
    'div.g',                // Classic container (still used)
    'div.tF2Cxc',           // Title/link wrapper
    'div.Gx5Zad.xpd',       // Result card
    'div[data-sokoban-container]', // Data attribute
    'div.hlcw0c',           // New variant
    'div.yuRUbf',           // Link container
    'div[jscontroller]'     // JS-driven containers
  ];
  
  console.log('Trying modern selectors...');
  for (const selector of modernSelectors) {
    try {
      const found = document.querySelectorAll(selector);
      debug.selectorsChecked.push({ selector, count: found.length });
      
      if (found.length > 0) {
        const filtered = Array.from(found).filter(el => {
          const hasH3 = el.querySelector('h3');
          const hasLink = el.querySelector('a[href]');
          const notKP = !el.closest('.kno-kp, .kp-blk');
          const notAd = !el.querySelector('[data-text-ad]') && !el.closest('[data-text-ad]');
          
          return hasH3 && hasLink && notKP && notAd;
        });
        
        if (filtered.length > 0) {
          allContainers = filtered;
          debug.workingSelector = selector;
          console.log(`✅ Found ${filtered.length} containers with: ${selector}`);
          break;
        }
      }
    } catch (e) {
      console.log(`❌ Selector failed: ${selector}`, e);
    }
  }
  
  // Strategy 2: Find by h3 elements (ultra aggressive)
  if (allContainers.length === 0) {
    console.log('⚠️ Fallback: Looking for h3 elements...');
    const allH3s = document.querySelectorAll('h3');
    const containerSet = new Set();
    
    allH3s.forEach(h3 => {
      let parent = h3.parentElement;
      let depth = 0;
      
      while (parent && depth < 8) {
        const link = parent.querySelector('a[href]');
        if (link && link.href && link.href.startsWith('http')) {
          const isAd = parent.closest('[data-text-ad]');
          const isKP = parent.closest('.kno-kp, .kp-blk');
          
          if (!isAd && !isKP) {
            containerSet.add(parent);
            break;
          }
        }
        parent = parent.parentElement;
        depth++;
      }
    });
    
    allContainers = Array.from(containerSet);
    debug.usedH3Fallback = true;
    console.log(`📦 Found ${allContainers.length} containers via h3 fallback`);
  }
  
  // Strategy 3: Search in main content area
  if (allContainers.length === 0) {
    console.log('🆘 Ultimate fallback: Searching main content area...');
    const mainContent = document.querySelector('#search, #rso, #center_col, #rcnt');
    
    if (mainContent) {
      const allDivs = mainContent.querySelectorAll('div');
      allContainers = Array.from(allDivs).filter(div => {
        const h3 = div.querySelector('h3');
        const link = div.querySelector('a[href]');
        const hasText = div.textContent.trim().length > 100;
        
        if (h3 && link && hasText) {
          const href = link.href;
          const isExternal = href && 
                            href.startsWith('http') && 
                            !href.includes('google.com/search') &&
                            !href.includes('accounts.google') &&
                            !href.includes('support.google');
          
          const isAd = div.closest('[data-text-ad]');
          const hasParentResult = div.parentElement && div.parentElement.querySelector('h3') !== h3;
          
          return isExternal && !isAd && !hasParentResult;
        }
        return false;
      });
      
      debug.usedContentAreaFallback = true;
      console.log(`🎯 Found ${allContainers.length} containers via content area`);
    }
  }
  
  debug.containersFound = allContainers.length;
  console.log(`📊 Total containers to process: ${allContainers.length}`);
  
  // Extract data from containers
  allContainers.forEach((container, index) => {
    try {
      // Find title - multiple methods
      let titleElement = container.querySelector('h3');
      if (!titleElement) {
        titleElement = container.querySelector('[role="heading"]');
      }
      if (!titleElement) {
        titleElement = container.querySelector('.LC20lb, .DKV0Md');
      }
      
      // Find link - multiple methods
      let linkElement = null;
      
      // Method 1: h3's parent/ancestor link
      if (titleElement) {
        linkElement = titleElement.closest('a[href]');
        if (!linkElement) {
          linkElement = titleElement.parentElement?.closest('a[href]');
        }
      }
      
      // Method 2: First valid link in container
      if (!linkElement) {
        const anchors = container.querySelectorAll('a[href]');
        for (const anchor of anchors) {
          const href = anchor.href;
          if (href && 
              href.startsWith('http') && 
              !href.includes('google.com/search') &&
              !href.includes('webcache.google') &&
              !href.includes('translate.google') &&
              !href.includes('accounts.google')) {
            linkElement = anchor;
            break;
          }
        }
      }
      
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
            console.log('Failed to parse redirect:', e);
          }
        }
        
        // Find snippet - multiple selectors
        let snippetElement = container.querySelector('.VwiC3b');
        if (!snippetElement) {
          snippetElement = container.querySelector('.yXK7lf, .lyLwlc, .IsZvec, .aCOpRe, .yDYNvb');
        }
        if (!snippetElement) {
          // Find text-heavy div
          const textDivs = container.querySelectorAll('div, span');
          for (const div of textDivs) {
            const text = div.textContent.trim();
            if (text.length > 50 && text.length < 500 && !div.querySelector('h3')) {
              snippetElement = div;
              break;
            }
          }
        }
        
        const snippet = snippetElement ? snippetElement.textContent.trim() : '';
        
        // Validate URL
        if (url && url.startsWith('http') && 
            !url.includes('google.com/search') && 
            !url.includes('webcache.google') &&
            !url.includes('translate.google') &&
            title && title.length > 3) {
          
          // Extract domain
          let domain = '';
          try {
            const urlObj = new URL(url);
            domain = urlObj.hostname.replace(/^www\./, '');
          } catch (e) {
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
          
          console.log(`✅ Result #${results.length}: ${domain} - ${title.substring(0, 50)}`);
        }
      } else {
        console.log(`⚠️ Container ${index} missing elements:`, {
          hasTitle: !!titleElement,
          hasLink: !!linkElement
        });
      }
    } catch (error) {
      console.error(`❌ Error extracting result ${index}:`, error);
    }
  });
  
  console.log(`✅ Total results extracted: ${results.length}`);
  
  // Extract PAA questions ONLY from FIRST PAGE
  if (isFirstPage) {
    console.log('❓ Starting COMPREHENSIVE PAA extraction from FIRST PAGE ONLY...');
  } else {
    console.log('⏭️ Skipping PAA extraction - not first page (start=' + startParam + ')');
  }
  
  if (isFirstPage) {
    // Strategy 1: MASSIVELY EXPANDED PAA selectors (October 2025 Google update)
  const paaSelectors = [
      // Primary PAA containers
      '[jsname="Cpkphb"]',
      '[jsname="yEVEwb"]',
      '[jsname="Hhmu2e"]',
      'div[data-q]',
      'div[data-init-q]',
      'div[data-initq]',
      
      // Question wrappers and containers
      '.related-question-pair',
      '.cbphWd',
      '.JolIg',
      '.iDjcJe',
      '.s75CSd',
      '.wDYxhc',
      '.Q8Kwad',
      '.related-question',
      '.kno-ftr',
      '.eFM0qc',
      '.iDjcJe',
      '.yp1CPe',
      
      // Role-based selectors
      'div[role="heading"][aria-level="3"]',
      'div[role="heading"]',
      'div[role="button"]',
      '[role="button"][jsname]',
      
      // Attribute-based selectors
      '[data-hveid]',
      '[data-ved]',
      'div[jsmodel]',
      'div[jscontroller][jsname]',
      'div[jscontroller]',
      'span[jsname]',
      'div[data-sokoban-container]',
      'div.g[data-hveid]',
      
      // Text-containing divs (very aggressive)
      'div[jsaction*="click"]',
      'div[jsaction*="expand"]',
      'button[jsname]',
      'details summary',
      '[aria-expanded]'
  ];
  
  console.log('🔍 Trying PAA selectors...');
    let selectorMatchCount = 0;
    
    paaSelectors.forEach((selector, index) => {
    try {
      const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Selector ${index + 1}/${paaSelectors.length}: "${selector}" found ${elements.length} elements`);
          selectorMatchCount++;
        }
        
      elements.forEach(el => {
          // Get direct text content (not deeply nested)
          let text = el.textContent.trim();
          
          // Try to get cleaner text from specific child if available
          const heading = el.querySelector('h3, [role="heading"], div[style*="font"]');
          if (heading && heading.textContent.length > 10 && heading.textContent.length < text.length) {
            text = heading.textContent.trim();
          }
          
        // Must have question mark and be reasonable length
          if (text.includes('?') && text.length > 10 && text.length < 2000) {
            // Clean up the text - VERY AGGRESSIVE CLEANING
            let cleaned = text
            .replace(/\s+/g, ' ')  // Normalize spaces
            .replace(/^\s*›\s*/, '')  // Remove leading arrow
            .replace(/^\s*•\s*/, '')  // Remove bullet
            .replace(/^\s*\.\.\.\s*/, '')  // Remove ellipsis
              .replace(/^\s*-\s*/, '')  // Remove dash
              .replace(/^\s*\*\s*/, '')  // Remove asterisk
              .replace(/Feedback$/, '')  // Remove "Feedback" at end
              .replace(/View all$/, '')  // Remove "View all"
            .trim();
          
          // Split on question marks to get individual questions
          const questions = cleaned.split(/\?+/).filter(q => q.trim().length > 0);
            
          questions.forEach(q => {
            const question = (q.trim() + '?').trim();
            const wordCount = question.split(' ').length;
            
              // VERY LENIENT filtering - accept almost anything that looks like a question
              if (wordCount >= 2 && wordCount <= 100 && question.length >= 10 && question.length < 1000) {
                // Remove common prefixes that get included
                let finalQuestion = question
                  .replace(/^People also ask\s*/i, '')
                  .replace(/^Related questions\s*/i, '')
                  .replace(/^Question:\s*/i, '')
                  .replace(/^Q:\s*/i, '')
                  .trim();
                
                if (finalQuestion.length >= 10 && finalQuestion.includes('?')) {
                  paaQuestions.add(finalQuestion);
                }
            }
          });
        }
      });
    } catch (e) {
      console.log(`PAA selector failed: ${selector}`, e);
    }
  });
  
    console.log(`📋 PAA from ${selectorMatchCount} matching selectors: ${paaQuestions.size}`);
  
    // Strategy 2: Find ALL headings/buttons/links with questions (VERY AGGRESSIVE)
  try {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, div[role="heading"], div[role="button"], button, a, summary, [aria-label]');
      let headingCount = 0;
      
    headings.forEach(h => {
      const text = h.textContent.trim();
        const ariaLabel = h.getAttribute('aria-label') || '';
        const combinedText = (text + ' ' + ariaLabel).trim();
        
        if (combinedText.includes('?') && combinedText.length > 10 && combinedText.length < 1000) {
          const cleaned = combinedText.replace(/\s+/g, ' ').trim();
        const wordCount = cleaned.split(' ').length;
          
          // VERY LENIENT - accept 2+ words
          if (wordCount >= 2 && wordCount <= 100 && !cleaned.toLowerCase().includes('google.com')) {
            // Split by ? to get individual questions
            const questions = cleaned.split('?').filter(q => q.trim().length >= 10);
            questions.forEach(q => {
              const question = q.trim() + '?';
              if (question.length >= 12 && question.length < 500) {
                paaQuestions.add(question);
                headingCount++;
              }
            });
        }
      }
    });
      
      console.log(`📋 PAA after heading scan (+${headingCount} new): ${paaQuestions.size}`);
  } catch (e) {
    console.log('Heading PAA extraction failed:', e);
  }
  
    // Strategy 3: Find "People also ask" section and extract EVERYTHING (ULTRA AGGRESSIVE)
    try {
      const paaSection = Array.from(document.querySelectorAll('div, section, main, article, aside')).find(el => {
        const text = el.textContent.toLowerCase();
        const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
        return text.includes('people also ask') || 
               text.includes('related questions') ||
               text.includes('people also search') ||
               ariaLabel.includes('people also ask') ||
               ariaLabel.includes('related questions');
      });
    
    if (paaSection) {
        console.log('✅ Found "People also ask" section! Extracting ALL questions...');
        
        // Get ALL elements that might contain questions
        const allElements = paaSection.querySelectorAll('*');
        let sectionCount = 0;
        
      allElements.forEach(el => {
        const text = el.textContent.trim();
          
          // Only process if element has reasonable text length and contains ?
          if (text.includes('?') && text.length > 10 && text.length < 2000) {
            // Check if this is a leaf node or has minimal children
            const childDivs = el.querySelectorAll('div, section, article').length;
            
            // Prefer leaf nodes or elements with few children
            if (childDivs <= 2) {
          const cleaned = text.replace(/\s+/g, ' ').trim();
              
              // Split by ? to handle multiple questions
              const questions = cleaned.split('?').filter(q => q.trim().length >= 8);
              
              questions.forEach(q => {
                const question = q.trim() + '?';
                const wordCount = question.split(' ').length;
                
                // VERY LENIENT - 2+ words, reasonable length
                if (wordCount >= 2 && wordCount <= 100 && question.length >= 10 && question.length < 800) {
                  const finalQ = question
                    .replace(/^People also ask\s*/i, '')
                    .replace(/^Related questions\s*/i, '')
                    .trim();
                  
                  if (finalQ.length >= 10) {
                    paaQuestions.add(finalQ);
                    sectionCount++;
          }
        }
      });
            }
          }
        });
        
        console.log(`📋 PAA after section scan (+${sectionCount} new): ${paaQuestions.size}`);
    } else {
        console.log('⚠️ "People also ask" section not found - trying text search...');
        
        // Fallback: search entire document for text near "people also ask"
        const allText = document.body.innerText;
        const paaIndex = allText.toLowerCase().indexOf('people also ask');
        
        if (paaIndex !== -1) {
          console.log('Found "People also ask" text in document!');
          // Get surrounding text (next 2000 characters)
          const surroundingText = allText.substring(paaIndex, paaIndex + 2000);
          const questions = surroundingText.split('?').filter(q => q.trim().length >= 10);
          
          questions.forEach(q => {
            const question = q.trim() + '?';
            const wordCount = question.split(' ').length;
            if (wordCount >= 2 && wordCount <= 100 && question.length >= 12 && question.length < 500) {
              paaQuestions.add(question.replace(/^People also ask\s*/i, '').trim());
            }
          });
          
          console.log(`📋 PAA after text fallback: ${paaQuestions.size}`);
        }
    }
  } catch (e) {
    console.log('PAA section extraction failed:', e);
  }
  
    // Strategy 4: Search for ALL expandable/clickable question elements
  try {
      const expandableElements = document.querySelectorAll('[aria-expanded], [role="button"], button, summary, details, [onclick], [jsaction]');
      let expandableCount = 0;
      
    expandableElements.forEach(el => {
      const text = el.textContent.trim();
        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        const combinedText = (text + ' ' + ariaLabel + ' ' + title).trim();
        
        if (combinedText.includes('?') && combinedText.length > 10 && combinedText.length < 1000) {
          // Split by ? to get individual questions
          const questions = combinedText.split('?').filter(q => q.trim().length >= 8);
          
          questions.forEach(q => {
            const question = q.trim() + '?';
            const wordCount = question.split(' ').length;
            
            // VERY LENIENT - 2+ words
            if (wordCount >= 2 && wordCount <= 100 && question.length >= 10 && question.length < 600) {
              paaQuestions.add(question.replace(/\s+/g, ' ').trim());
              expandableCount++;
            }
          });
        }
      });
      
      console.log(`📋 PAA after expandable scan (+${expandableCount} new): ${paaQuestions.size}`);
  } catch (e) {
    console.log('Expandable PAA extraction failed:', e);
  }
  
    // Strategy 5: NUCLEAR OPTION - find ANY element containing a question (EXTREMELY AGGRESSIVE)
    try {
      console.log('🚀 Activating NUCLEAR extraction mode...');
      
      // Search ALL text elements in main content areas
      const allTextElements = document.querySelectorAll('#center_col *, #rso *, #search *, #rcnt *, main *, article *');
      let nuclearCount = 0;
      const processedTexts = new Set();
      
    allTextElements.forEach(el => {
        // Get both direct text and full text
        const fullText = el.textContent?.trim() || '';
        
        // Skip if too long (likely contains multiple nested elements)
        if (fullText.length > 500 || fullText.length < 10) return;
        if (!fullText.includes('?')) return;
        if (processedTexts.has(fullText)) return;
        
        processedTexts.add(fullText);
        
        // Check if element has few children (prefer leaf nodes)
        const childElements = el.children.length;
        
        if (childElements <= 3) {  // Leaf or near-leaf node
          const cleaned = fullText.replace(/\s+/g, ' ').trim();
          
          // Split by ? and process each question
          const parts = cleaned.split('?');
          
          parts.forEach((part, index) => {
            if (index < parts.length - 1) {  // Not the last part (after final ?)
              const question = (part.trim() + '?').trim();
              const wordCount = question.split(' ').length;
              
              // EXTREMELY LENIENT - just needs to look vaguely like a question
              if (wordCount >= 2 && 
                  wordCount <= 100 && 
                  question.length >= 10 && 
                  question.length < 500 &&
                  !question.toLowerCase().includes('google.com') &&
                  !question.toLowerCase().includes('support.google')) {
                
                const finalQuestion = question
                  .replace(/^People also ask\s*/i, '')
                  .replace(/^Related questions?\s*/i, '')
                  .replace(/^View all\s*/i, '')
                  .replace(/^Feedback\s*/i, '')
                  .replace(/^\s*[-•›]\s*/, '')
        .trim();
      
                if (finalQuestion.length >= 10 && finalQuestion.split(' ').length >= 2) {
                  paaQuestions.add(finalQuestion);
                  nuclearCount++;
                }
              }
            }
          });
        }
      });
      
      console.log(`📋 PAA after NUCLEAR scan (+${nuclearCount} new): ${paaQuestions.size}`);
    } catch (e) {
      console.log('Nuclear PAA extraction failed:', e);
    }
    
    // Strategy 6: FINAL FALLBACK - RegEx pattern matching on entire page HTML
    try {
      console.log('🔥 Final fallback: RegEx pattern matching...');
      const pageHTML = document.body.innerHTML;
      const pageText = document.body.innerText;
      
      // Find text that looks like questions using regex
      const questionPattern = /\b([A-Z][^.!?]*\?)/g;
      const matches = pageText.match(questionPattern) || [];
      let regexCount = 0;
      
      matches.forEach(match => {
        const cleaned = match.trim().replace(/\s+/g, ' ');
        const wordCount = cleaned.split(' ').length;
        
        if (wordCount >= 2 && 
            wordCount <= 100 && 
            cleaned.length >= 10 && 
            cleaned.length < 500 &&
            !cleaned.toLowerCase().includes('google.com') &&
            !cleaned.includes('©')) {
          paaQuestions.add(cleaned);
          regexCount++;
      }
    });
      
      console.log(`📋 PAA after RegEx scan (+${regexCount} new): ${paaQuestions.size}`);
  } catch (e) {
      console.log('RegEx PAA extraction failed:', e);
    }
  }
  
  // Clean and filter questions (INTELLIGENT FILTERING) - ONLY on first page
  let cleanedQuestions = [];
  
  if (isFirstPage) {
    cleanedQuestions = Array.from(paaQuestions)
    .map(q => {
      // First cleanup
      return q
        .replace(/\s+/g, ' ')
        .replace(/\?+/g, '?')
        .replace(/^[›•\-\*\s]+/, '')  // Remove leading bullets/symbols
        .replace(/[›•\-\*\s]+$/, '')  // Remove trailing symbols
        .replace(/^\d+\.\s*/, '')  // Remove leading numbers like "1. "
        .trim();
    })
    .filter(q => {
      // INTELLIGENT FILTERING TO REMOVE JUNK
      
      // Must have question mark
      if (!q.includes('?')) return false;
      
      // Basic length checks
      const words = q.split(' ');
      const wordCount = words.length;
      if (wordCount < 2 || wordCount > 50) return false;
      if (q.length < 10 || q.length > 300) return false;
      
      // Must contain letters
      if (!/[a-zA-Z]/.test(q)) return false;
      
      // REMOVE JAVASCRIPT/CODE PATTERNS
      if (q.includes('function(') || q.includes('){') || q.includes('var ') || q.includes('new Image')) return false;
      if (q.includes('.call(') || q.includes('.src=') || q.includes('setAttribute')) return false;
      if (q.includes('className') || q.includes('getElementById') || q.includes('querySelector')) return false;
      if (q.includes('\\x') || q.includes('\\u')) return false;  // Encoded characters
      
      // REMOVE URLs AND TECHNICAL FRAGMENTS
      if (q.includes('://') || q.includes('www.')) return false;
      if (q.includes('.com') || q.includes('.org') || q.includes('.net')) return false;
      if (q.includes('http') || q.includes('https')) return false;
      if (q.includes('google.com') || q.includes('googletagmanager')) return false;
      
      // REMOVE CODE-LIKE PATTERNS
      if (q.includes('id\\x') || q.includes('\\x26')) return false;
      if ((q.match(/\\/g) || []).length > 2) return false;  // Too many backslashes
      if ((q.match(/\(/g) || []).length > 2) return false;  // Too many parentheses
      if ((q.match(/\{/g) || []).length > 0) return false;  // Any curly braces
      if (q.includes('==') || q.includes('!=') || q.includes('===')) return false;
      
      // REMOVE FRAGMENTS WITH TOO MANY SPECIAL CHARACTERS
      const specialCharCount = (q.match(/[^a-zA-Z0-9\s\?\'\-]/g) || []).length;
      if (specialCharCount > 5) return false;  // Too many special chars
      
      // REMOVE IF TOO MANY CONSECUTIVE UPPERCASE OR LOWERCASE
      if (/[A-Z]{10,}/.test(q)) return false;  // 10+ consecutive uppercase
      if (/[a-z]{50,}/.test(q)) return false;  // 50+ consecutive lowercase (likely code)
      
      // MUST START WITH A LETTER OR COMMON QUESTION WORD
      const firstWord = words[0].toLowerCase();
      const questionWords = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'is', 'are', 'can', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'has', 'have', 'was', 'were', 'am'];
      const startsWithLetter = /^[a-zA-Z]/.test(q);
      const startsWithQuestionWord = questionWords.includes(firstWord);
      const startsWithCapital = /^[A-Z]/.test(q);
      
      // Accept if starts with question word OR capital letter (but not code-like)
      if (!startsWithLetter && !startsWithCapital) return false;
      
      // REMOVE GOOGLE INTERNAL STUFF
      if (q.toLowerCase().includes('support.google')) return false;
      if (q.toLowerCase().includes('policies.google')) return false;
      if (q.toLowerCase().includes('accounts.google')) return false;
      
      // REMOVE DATE PREFIXES (but keep the question)
      // This will be handled in the next map
      
      // CHECK FOR NATURAL LANGUAGE (must have at least some common words)
      const commonWords = ['the', 'a', 'an', 'is', 'are', 'to', 'for', 'of', 'in', 'on', 'at', 'with', 'and', 'or', 'what', 'why', 'how', 'best', 'good', 'bad', 'can', 'do', 'does', 'will', 'should'];
      const hasCommonWord = words.some(w => commonWords.includes(w.toLowerCase()));
      if (!hasCommonWord && wordCount > 5) return false;  // Likely code/junk if no common words
      
      return true;
    })
    .map(q => {
      // CLEAN UP DATE PREFIXES (e.g., "Aug 21, 2024 What is..." -> "What is...")
      q = q.replace(/^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}\s+/i, '');  // Remove "Aug 21, 2024 "
      q = q.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s+/, '');  // Remove "8/21/2024 "
      
      // Remove leading colons and spaces
      q = q.replace(/^[\s:]+/, '');
      
      return q.trim();
    })
    .filter(q => q.length >= 10)  // Re-filter after cleanup
    .filter((q, index, self) => {
      // Remove exact duplicates
      return self.indexOf(q) === index;
    })
    .filter((q, index, self) => {
      // Remove questions that are substrings of other questions
      return !self.some((other, otherIndex) => 
        otherIndex !== index && other.includes(q) && other.length > q.length + 5
      );
    })
    .sort((a, b) => a.length - b.length);  // Sort by length (shorter questions first)
  
  console.log(`✅ Final PAA questions extracted: ${cleanedQuestions.length}`);
    console.log(`📋 Sample PAA questions:`, cleanedQuestions.slice(0, 10));
  } else {
    console.log('⏭️ Skipping PAA cleaning - not first page');
  }
  
  return {
    results,
    paaQuestions: cleanedQuestions,
    debug
  };
}

async function completeScan(scanId, keyword, country, domain, allResults, extractedKeywords, paaQuestions, status, captchaPage = null) {
  console.log(`✅ Completing scan ${scanId} with status: ${status}`);
  console.log(`📊 Total results collected: ${allResults.length}`);
  
  // Find ranking position with enhanced matching
  let rankingPosition = null;
  let rankingUrl = null;
  
  if (domain && allResults.length > 0) {
    // Normalize input domain
    const normalizedInput = domain.toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/$/, '')
      .replace(/\?.*$/, '')  // Remove query params
      .replace(/#.*$/, '')   // Remove hash
      .trim();
    
    console.log(`🔍 Looking for domain: "${normalizedInput}"`);
    console.log(`📋 In ${allResults.length} results:`, allResults.map((r, i) => `${i+1}. ${r.domain}`));
    
    // Try multiple matching strategies
    const foundResult = allResults.find((result, index) => {
      const resultDomain = result.domain.toLowerCase().replace('www.', '');
      const resultUrl = result.url.toLowerCase();
      
      // Get root domain for comparison
      const getRootDomain = (d) => {
        const parts = d.split('.');
        if (parts.length >= 2) {
          return parts.slice(-2).join('.');
        }
        return d;
      };
      
      // Strategy 1: Exact match
      if (resultDomain === normalizedInput) {
        console.log(`✅ Strategy 1 (Exact): Found at position ${index + 1} - ${resultDomain}`);
        return true;
      }
      
      // Strategy 2: Result contains input (e.g., "blog.hostinger.com" contains "hostinger.com")
      if (resultDomain.includes(normalizedInput)) {
        console.log(`✅ Strategy 2 (Contains): Found at position ${index + 1} - ${resultDomain} contains ${normalizedInput}`);
        return true;
      }
      
      // Strategy 3: Input contains result (e.g., "hostinger.com" contains partial)
      if (normalizedInput.includes(resultDomain)) {
        console.log(`✅ Strategy 3 (Reverse): Found at position ${index + 1} - ${normalizedInput} contains ${resultDomain}`);
        return true;
      }
      
      // Strategy 4: Root domain match
      const inputRoot = getRootDomain(normalizedInput);
      const resultRoot = getRootDomain(resultDomain);
      
      if (inputRoot === resultRoot && inputRoot.length > 3 && !inputRoot.includes('.co.')) {
        console.log(`✅ Strategy 4 (Root): Found at position ${index + 1} - Root match: ${inputRoot}`);
        return true;
      }
      
      // Strategy 5: URL contains domain
      if (resultUrl.includes(normalizedInput)) {
        console.log(`✅ Strategy 5 (URL): Found at position ${index + 1} - URL contains ${normalizedInput}`);
        return true;
      }
      
      // Strategy 6: Fuzzy match - remove common TLDs
      const inputBase = normalizedInput.replace(/\.(com|net|org|co\.uk|io|dev|app)$/, '');
      const resultBase = resultDomain.replace(/\.(com|net|org|co\.uk|io|dev|app)$/, '');
      
      if (inputBase && resultBase && inputBase === resultBase) {
        console.log(`✅ Strategy 6 (Fuzzy): Found at position ${index + 1} - Base match: ${inputBase}`);
        return true;
      }
      
      return false;
    });
    
    if (foundResult) {
      rankingPosition = allResults.indexOf(foundResult) + 1;
      rankingUrl = foundResult.url;
      console.log(`🎯 FINAL: Domain "${normalizedInput}" found at position #${rankingPosition}`);
      console.log(`🔗 URL: ${rankingUrl}`);
    } else {
      console.log(`❌ Domain "${normalizedInput}" NOT found in results`);
      console.log(`💡 Available domains:`, allResults.map(r => r.domain).join(', '));
    }
  } else if (!domain) {
    console.log(`ℹ️ No domain specified - showing all results only`);
  } else {
    console.log(`⚠️ No results to search in`);
  }
  
  // Prepare final data
  const scanData = {
    id: scanId,
    keyword,
    country,
    domain,
    status,
    startTime: currentRankingScan?.startTime || Date.now(),
    endTime: Date.now(),
    duration: Date.now() - (currentRankingScan?.startTime || Date.now()),
    totalResults: allResults.length,
    rankingPosition,
    rankingUrl,
    captchaPage,
    results: allResults,
    keywords: Array.from(extractedKeywords.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)  // Sort by frequency
      .filter(kw => kw.word.split(' ').length >= 2),  // Only multi-word phrases (no single words)
    totalKeywordsExtracted: extractedKeywords.size,
    paaQuestions: paaQuestions  // ALL PAA questions (no limit)
  };
  
  // Save to history
  await saveRankingScanToHistory(scanData);
  
  // Update current scan status
  currentRankingScan = {
    ...scanData,
    status,
    progress: 100
  };
  
  await chrome.storage.local.set({ currentRankingScan });
  
  // Update badge
  if (rankingPosition) {
    chrome.action.setBadgeText({ text: `#${rankingPosition}` });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  } else {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: status === 'completed' ? '#10b981' : '#ef4444' });
  }
  
  // Show notification
  try {
    if (chrome.notifications) {
      const message = rankingPosition 
        ? `Your site ranks #${rankingPosition} for "${keyword}"`
        : status === 'captcha'
        ? `Scan stopped due to CAPTCHA. Found ${allResults.length} results.`
        : `Scan complete. ${allResults.length} results found.`;
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'SEO Checker - Ranking Scan Complete',
        message
      });
    }
  } catch (e) {}
  
  console.log('💾 Scan saved:', scanData);
}

async function saveRankingScanToHistory(scanData) {
  try {
    const result = await chrome.storage.local.get('rankingHistory');
    const history = result.rankingHistory || [];
    
    // Add to beginning
    history.unshift(scanData);
    
    // Keep last 50 scans
    if (history.length > 50) {
      history.splice(50);
    }
    
    await chrome.storage.local.set({ rankingHistory: history });
    console.log('📊 Saved to history. Total scans:', history.length);
  } catch (error) {
    console.error('Error saving to history:', error);
  }
}

async function updateScanStatus(scanId, status, currentPage, resultsFound = 0) {
  if (currentRankingScan && currentRankingScan.id === scanId) {
    currentRankingScan.status = status;
    currentRankingScan.currentPage = currentPage;
    currentRankingScan.resultsFound = resultsFound;
    currentRankingScan.progress = (currentPage / currentRankingScan.totalPages) * 100;
    
    await chrome.storage.local.set({ currentRankingScan });
    
    // Update badge
    chrome.action.setBadgeText({ text: `${currentPage}/10` });
  }
}

async function getRankingStatus() {
  const result = await chrome.storage.local.get('currentRankingScan');
  return result.currentRankingScan || null;
}

async function getRankingResults(scanId) {
  if (currentRankingScan && currentRankingScan.id === scanId) {
    return currentRankingScan;
  }
  
  // Check history
  const result = await chrome.storage.local.get('rankingHistory');
  const history = result.rankingHistory || [];
  return history.find(scan => scan.id === scanId) || null;
}

async function getRankingHistory() {
  const result = await chrome.storage.local.get('rankingHistory');
  return result.rankingHistory || [];
}

async function exportRankingData(scanId, format = 'json') {
  const scanData = await getRankingResults(scanId);
  
  if (!scanData) {
    throw new Error('Scan not found');
  }
  
  if (format === 'json') {
    return {
      format: 'json',
      filename: `ranking-${scanData.keyword}-${scanData.id}.json`,
      data: JSON.stringify(scanData, null, 2),
      mimeType: 'application/json'
    };
  } else if (format === 'csv') {
    // Create CSV
    let csv = 'Position,Title,Domain,URL,Snippet\n';
    scanData.results.forEach(result => {
      csv += `${result.position},"${result.title.replace(/"/g, '""')}","${result.domain}","${result.url}","${result.snippet.replace(/"/g, '""')}"\n`;
    });
    
    // Add keywords section
    csv += '\n\nExtracted Keywords\n';
    csv += 'Keyword,Count\n';
    scanData.keywords.forEach(kw => {
      csv += `"${kw.word}",${kw.count}\n`;
    });
    
    // Add PAA section
    csv += '\n\nPeople Also Ask\n';
    csv += 'Question\n';
    scanData.paaQuestions.forEach(q => {
      csv += `"${q.replace(/"/g, '""')}"\n`;
    });
    
    return {
      format: 'csv',
      filename: `ranking-${scanData.keyword}-${scanData.id}.csv`,
      data: csv,
      mimeType: 'text/csv'
    };
  }
}

function cancelRankingCheck() {
  rankingScanCancelled = true;
  chrome.action.setBadgeText({ text: '' });
}

function extractKeywordsFromResults(results, keywordsMap) {
  console.log(`🔑 Extracting ALL long-tail keywords from ${results.length} results...`);
  console.log('📝 Extracting from: Titles + Descriptions (Snippets)');
  
  if (!results || results.length === 0) {
    console.warn('⚠️ No results provided for keyword extraction!');
    return;
  }
  
  const initialSize = keywordsMap.size;
  
  results.forEach((result, index) => {
    // Extract from TITLE
    const titleText = (result.title || '').toLowerCase();
    if (titleText && titleText.length > 0) {
      const beforeTitle = keywordsMap.size;
      extractPhrasesFromText(titleText, keywordsMap, `title-${index}`);
      console.log(`  Result ${index + 1} title: extracted ${keywordsMap.size - beforeTitle} new phrases`);
    }
    
    // Extract from DESCRIPTION/SNIPPET
    const snippetText = (result.snippet || '').toLowerCase();
    if (snippetText && snippetText.length > 0) {
      const beforeSnippet = keywordsMap.size;
      extractPhrasesFromText(snippetText, keywordsMap, `snippet-${index}`);
      console.log(`  Result ${index + 1} snippet: extracted ${keywordsMap.size - beforeSnippet} new phrases`);
    }
  });
  
  const totalExtracted = keywordsMap.size - initialSize;
  console.log(`✅ Total unique keyword phrases extracted: ${keywordsMap.size} (+${totalExtracted} new)`);
  console.log(`📊 Breakdown: 2-word, 3-word, 4-word... up to 10-word phrases`);
  
  // Log sample keywords for debugging
  const sampleKeywords = Array.from(keywordsMap.entries()).slice(0, 10);
  console.log(`📋 Sample keywords:`, sampleKeywords.map(([k, v]) => `"${k}" (${v})`));
}

function extractPhrasesFromText(text, keywordsMap, source) {
  if (!text || text.length < 5) return;
  
  // Clean and normalize text - MORE AGGRESSIVE
  const cleanText = text
    .replace(/[^\w\s'-]/g, ' ')  // Keep letters, numbers, spaces, hyphens, apostrophes
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim();
  
  const words = cleanText.split(' ').filter(w => w.length > 0);
  
  // REDUCED stop words list - only filter the most common
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'is', 'was', 'are', 'be', 'it', 'this', 'that'
  ]);
  
  // Extract phrases from 2 to 10 words (VERY AGGRESSIVE - extract EVERYTHING)
  for (let phraseLength = 2; phraseLength <= 10; phraseLength++) {
    for (let i = 0; i <= words.length - phraseLength; i++) {
      const phrase = words.slice(i, i + phraseLength);
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
      
      // REDUCED filler phrases list - only the most obvious
      const fillerPhrases = [
        'click here', 'privacy policy', 'terms of service', 'all rights reserved'
      ];
      if (fillerPhrases.some(filler => phraseStr.toLowerCase() === filler)) {
        continue;
      }
      
      // MORE LENIENT length requirements
      if (phraseStr.length >= 6 && phraseStr.length <= 150) {  // Reduced minimum from 8, increased max from 120
        const count = keywordsMap.get(phraseStr) || 0;
        keywordsMap.set(phraseStr, count + 1);
      }
    }
  }
  
  console.log(`[${source}] Extracted ${keywordsMap.size} phrases from text of length ${text.length}`);
}

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 15000);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
