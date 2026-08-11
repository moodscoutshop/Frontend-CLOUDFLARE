import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

/**
 * SearchContext - Global state management for search functionality
 * Manages search state, results, and loading states across pages
 */

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  // Search query and type
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState(null); // 'pinterest' or 'keyword'
  const [boardName, setBoardName] = useState('');

  // Precision Search (optional enhancement layer)
  const [precisionSearch, setPrecisionSearch] = useState(() => {
    try {
      const raw = localStorage.getItem('moodscout_precision_search');
      return raw === '1' || raw === 'true';
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('moodscout_precision_search', precisionSearch ? '1' : '0');
    } catch (_) {}
  }, [precisionSearch]);
  
  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [noResultsMessage, setNoResultsMessage] = useState('');
  
  // Progress data
  const [progressData, setProgressData] = useState({
    phase: '',
    progress: 0,
    subStep: '',
    current: 0,
    total: 0,
  });
  
  // Timing states
  const [searchStartTime, setSearchStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(40);
  const [processingTime, setProcessingTime] = useState(null);
  
  // Segment timing
  const [segmentTimes, setSegmentTimes] = useState({
    pinterest: { startTime: null, endTime: null, elapsed: 0 },
    analysis: { startTime: null, endTime: null, elapsed: 0 },
    search: { startTime: null, endTime: null, elapsed: 0 }
  });
  
  // Result data
  const [pinterestImages, setPinterestImages] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [ebayWidgetData, setEbayWidgetData] = useState(null);
  
  // === Image selection state (for re-search from subset) ===
  // Set of deselected image indices (images the user has "crossed out")
  const [deselectedImages, setDeselectedImages] = useState(new Set());
  
  // === Keyword editing state (for re-search from modified keywords) ===
  // Original keywords from the last AI analysis (used for reset)
  const [originalKeywords, setOriginalKeywords] = useState([]);
  // User-editable working copy of keywords
  const [editedKeywords, setEditedKeywords] = useState([]);
  // Track if user has modified keywords
  const keywordsModified = useMemo(() => {
    if (originalKeywords.length !== editedKeywords.length) return true;
    return originalKeywords.some((kw, i) => kw !== editedKeywords[i]);
  }, [originalKeywords, editedKeywords]);
  
  // === Re-search tracking ===
  // Tracks which "source" triggered the current partial search (null | 'images' | 'keywords')
  const [reSearchSource, setReSearchSource] = useState(null);
  
  // Filter states
  const [selectedKeywordFilters, setSelectedKeywordFilters] = useState([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Product relevance states
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [loadingRelevance, setLoadingRelevance] = useState(new Set());
  const [relevanceExplanations, setRelevanceExplanations] = useState({});
  
  // Active tab state for results page
  const [activeTab, setActiveTab] = useState('pinterest');
  
  // Tab loading states
  const [tabStates, setTabStates] = useState({
    pinterest: { loading: false, loaded: false, error: null },
    analysis: { loading: false, loaded: false, error: null },
    scoring: { loading: false, loaded: false, error: null },
    products: { loading: false, loaded: false, error: null }
  });
  
  // API URL
  const API_URL = process.env.REACT_APP_API_URL || 'https://backend-cloudflare.moodscoutshop.workers.dev';
  
  // Helper function to detect Pinterest URLs
  const isPinterestUrl = useCallback((query) => {
    if (!query) return false;
    const pinterestPatterns = [
      /pinterest\.com/i,
      /pin\.it/i,
      /pinterest\./i
    ];
    return pinterestPatterns.some(pattern => pattern.test(query));
  }, []);
  
  // Reset all search data
  const resetSearch = useCallback(() => {
    setIsSearching(false);
    setSearchStep('');
    setSearchMessage('');
    setPinterestImages(null);
    setAnalysisData(null);
    setProductsData(null);
    setProcessingTime(null);
    setBoardName('');
    setSearchType(null);
    setNoResultsMessage('');
    setEbayWidgetData(null);
    setSelectedKeywordFilters([]);
    setSelectedCategoryFilters([]);
    setSortBy('default');
    setSortOrder('asc');
    setExpandedCards(new Set());
    setLoadingRelevance(new Set());
    setRelevanceExplanations({});
    setActiveTab('pinterest');
    setProgressData({ phase: '', progress: 0, subStep: '', current: 0, total: 0 });
    setElapsedTime(0);
    setSearchStartTime(null);
    setTabStates({
      pinterest: { loading: false, loaded: false, error: null },
      analysis: { loading: false, loaded: false, error: null },
      scoring: { loading: false, loaded: false, error: null },
      products: { loading: false, loaded: false, error: null }
    });
    setSegmentTimes({
      pinterest: { startTime: null, endTime: null, elapsed: 0 },
      analysis: { startTime: null, endTime: null, elapsed: 0 },
      search: { startTime: null, endTime: null, elapsed: 0 }
    });
    setDeselectedImages(new Set());
    setOriginalKeywords([]);
    setEditedKeywords([]);
    setReSearchSource(null);
  }, []);
  
  // Sync keywords when analysisData changes (from initial search or re-analysis)
  useEffect(() => {
    if (analysisData?.contents) {
      setOriginalKeywords([...analysisData.contents]);
      setEditedKeywords([...analysisData.contents]);
    }
  }, [analysisData]);
  
  // === Image selection helpers ===
  const toggleImageDeselection = useCallback((imageIndex) => {
    setDeselectedImages(prev => {
      const next = new Set(prev);
      if (next.has(imageIndex)) {
        next.delete(imageIndex);
      } else {
        next.add(imageIndex);
      }
      return next;
    });
  }, []);
  
  const selectedImages = useMemo(() => {
    if (!pinterestImages) return [];
    return pinterestImages.filter((_, idx) => !deselectedImages.has(idx));
  }, [pinterestImages, deselectedImages]);
  
  const clearImageDeselections = useCallback(() => {
    setDeselectedImages(new Set());
  }, []);
  
  // === Keyword editing helpers ===
  const updateKeyword = useCallback((index, newValue) => {
    setEditedKeywords(prev => {
      const next = [...prev];
      next[index] = newValue;
      return next;
    });
  }, []);
  
  const removeKeyword = useCallback((index) => {
    setEditedKeywords(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const addKeyword = useCallback((keyword) => {
    if (keyword && keyword.trim()) {
      setEditedKeywords(prev => [...prev, keyword.trim()]);
    }
  }, []);
  
  const resetKeywords = useCallback(() => {
    setEditedKeywords([...originalKeywords]);
  }, [originalKeywords]);
  
  // Update tab state
  const updateTabState = useCallback((tabId, updates) => {
    setTabStates(prev => ({
      ...prev,
      [tabId]: { ...prev[tabId], ...updates }
    }));
  }, []);
  
  // Get unique keywords from products
  const availableKeywords = useMemo(() => {
    if (!productsData || productsData.length === 0) return [];
    const keywords = new Set();
    productsData.forEach(product => {
      if (product.search_query) {
        keywords.add(product.search_query);
      }
    });
    return Array.from(keywords);
  }, [productsData]);
  
  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!productsData || productsData.length === 0) return [];
    
    let products = productsData;
    
    // Apply keyword filter
    if (selectedKeywordFilters.length > 0) {
      products = products.filter(product => {
        const productKeyword = product.search_query || '';
        return selectedKeywordFilters.some(keyword =>
          productKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase() === productKeyword.toLowerCase()
        );
      });
    }
    
    // Apply category filter
    if (selectedCategoryFilters.length > 0) {
      products = products.filter(product => {
        const productCategories = (product.categories || []).map(cat =>
          typeof cat === 'string' ? cat.toLowerCase().trim() : ''
        );
        return selectedCategoryFilters.some(selectedCat =>
          productCategories.includes(selectedCat.toLowerCase().trim())
        );
      });
    }
    
    // Apply sorting
    if (sortBy !== 'default') {
      products = [...products].sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'price') {
          aValue = a.priceValue != null ? a.priceValue : (a.price ? parseFloat(a.price.replace(/[^0-9.]/g, '')) : 0);
          bValue = b.priceValue != null ? b.priceValue : (b.price ? parseFloat(b.price.replace(/[^0-9.]/g, '')) : 0);
        } else if (sortBy === 'match_score') {
          aValue = a.match_score != null ? a.match_score : 0;
          bValue = b.match_score != null ? b.match_score : 0;
        } else {
          return 0;
        }
        
        if (aValue == null) aValue = 0;
        if (bValue == null) bValue = 0;
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    return products;
  }, [productsData, selectedKeywordFilters, selectedCategoryFilters, sortBy, sortOrder]);
  
  // Handle keyword filter toggle
  const handleKeywordFilterToggle = useCallback((keyword) => {
    setSelectedKeywordFilters(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  }, []);
  
  // Handle category filter toggle
  const handleCategoryFilterToggle = useCallback((categoryPath) => {
    setSelectedCategoryFilters(prev =>
      prev.includes(categoryPath)
        ? prev.filter(c => c !== categoryPath)
        : [...prev, categoryPath]
    );
  }, []);
  
  // Clear filters
  const clearKeywordFilters = useCallback(() => setSelectedKeywordFilters([]), []);
  const clearCategoryFilters = useCallback(() => setSelectedCategoryFilters([]), []);
  const clearAllFilters = useCallback(() => {
    setSelectedKeywordFilters([]);
    setSelectedCategoryFilters([]);
    setSortBy('default');
    setSortOrder('asc');
  }, []);
  
  // Handle sort change
  const handleSortChange = useCallback((newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);
  
  const value = {
    // Query state
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    boardName,
    setBoardName,

    // Precision Search
    precisionSearch,
    setPrecisionSearch,
    
    // Loading state
    isSearching,
    setIsSearching,
    searchStep,
    setSearchStep,
    searchMessage,
    setSearchMessage,
    noResultsMessage,
    setNoResultsMessage,
    
    // Progress
    progressData,
    setProgressData,
    searchStartTime,
    setSearchStartTime,
    elapsedTime,
    setElapsedTime,
    estimatedTime,
    setEstimatedTime,
    processingTime,
    setProcessingTime,
    segmentTimes,
    setSegmentTimes,
    
    // Results
    pinterestImages,
    setPinterestImages,
    analysisData,
    setAnalysisData,
    productsData,
    setProductsData,
    ebayWidgetData,
    setEbayWidgetData,
    
    // Image selection (re-search from subset)
    deselectedImages,
    toggleImageDeselection,
    selectedImages,
    clearImageDeselections,
    
    // Keyword editing (re-search from modified keywords)
    originalKeywords,
    editedKeywords,
    keywordsModified,
    updateKeyword,
    removeKeyword,
    addKeyword,
    resetKeywords,
    
    // Re-search tracking
    reSearchSource,
    setReSearchSource,
    
    // Filters
    selectedKeywordFilters,
    selectedCategoryFilters,
    sortBy,
    sortOrder,
    availableKeywords,
    filteredProducts,
    handleKeywordFilterToggle,
    handleCategoryFilterToggle,
    clearKeywordFilters,
    clearCategoryFilters,
    clearAllFilters,
    handleSortChange,
    
    // Product relevance
    expandedCards,
    setExpandedCards,
    loadingRelevance,
    setLoadingRelevance,
    relevanceExplanations,
    setRelevanceExplanations,
    
    // Tab state
    activeTab,
    setActiveTab,
    tabStates,
    updateTabState,
    
    // Helpers
    isPinterestUrl,
    resetSearch,
    API_URL
  };
  
  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

export default SearchContext;
