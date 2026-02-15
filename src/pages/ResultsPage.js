import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { ResultsNavbar } from '../components/layout';
import { ScrollToTopButton } from '../components/common';
import { 
  TabNavigation, 
  PinterestTab,
  ScoringTab, 
  ProductsTab,
  TAB_ORDER
} from '../components/tabs';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';

/**
 * ResultsPage - Displays search results with tabbed navigation
 */
export function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitiatedSearch = useRef(false);
  const lastSearchKeyRef = useRef('');
  
  const {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    isSearching,
    setIsSearching,
    setProgressData,
    setSearchStep,
    setSearchMessage,
    setPinterestImages,
    setAnalysisData,
    setProductsData,
    setBoardName,
    setNoResultsMessage,
    setEbayWidgetData,
    setProcessingTime,
    setSearchStartTime,
    setElapsedTime,
    setEstimatedTime,
    setSegmentTimes,
    activeTab,
    setActiveTab,
    tabStates,
    updateTabState,
    resetSearch,
    isPinterestUrl,
    API_URL,
    precisionSearch,
    setPrecisionSearch,
    // Re-search state
    selectedImages,
    analysisData,
    editedKeywords,
    setReSearchSource,
    clearAllFilters,
  } = useSearch();

  // -------------------------------------------------------------------
  // Tab state helper (mirrors TabNavigation logic) — needed for swipe
  // -------------------------------------------------------------------
  const getTabState = useCallback((tabId) => {
    const ts = tabStates[tabId];
    const tabIndex = TAB_ORDER.indexOf(tabId);
    if (searchType === 'keyword') {
      if (tabId === 'products') return ts?.loaded ? 'completed' : (ts?.loading ? 'loading' : 'pending');
      return 'hidden';
    }
    if (ts?.loaded) return 'completed';
    if (ts?.loading) return 'loading';
    const allPrevDone = TAB_ORDER.slice(0, tabIndex).every(id => tabStates[id]?.loaded);
    return allPrevDone ? 'pending' : 'disabled';
  }, [tabStates, searchType]);

  // Swipe-to-navigate between tabs on mobile
  const swipeTabOrder = useMemo(
    () => searchType === 'keyword' ? ['products'] : TAB_ORDER,
    [searchType]
  );
  const { containerRef: swipeRef } = useSwipeNavigation({
    activeTab,
    onTabChange: setActiveTab,
    tabOrder: swipeTabOrder,
    getTabState,
  });
  
  // Get query from URL
  const queryFromUrl = searchParams.get('q') || '';
  const precisionFromUrl = (() => {
    const raw = (searchParams.get('precision') || '').toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
  })();
  
  // ============================================
  // AUTO TAB NAVIGATION CONFIGURATION
  // ============================================
  // Tab order for sequential navigation (scoring is skipped - user can view it manually)
  const TAB_SEQUENCE = ['pinterest', 'products'];
  
  // Track if search is complete (user has full control after this)
  const [searchComplete, setSearchComplete] = useState(false);
  
  // Track tabs that have already auto-switched to prevent re-triggering
  const autoSwitchedTabs = useRef(new Set());
  
  // ============================================
  // AUTO TAB NAVIGATION EFFECT
  // ============================================
  // Switch to the LATEST loaded tab only when a NEW tab finishes loading.
  // This allows user to freely switch between already loaded tabs.
  useEffect(() => {
    // STOP auto-switching once search is complete - user has full control
    if (searchComplete) {
      console.log('🎯 Search complete - user has full control of tabs');
      return;
    }
    
    // Skip for keyword searches (only products tab)
    if (searchType === 'keyword') return;
    
    // Skip if not a pinterest search
    if (!searchType || searchType !== 'pinterest') return;
    
    // Find the latest tab in sequence that just became loaded (and hasn't been auto-switched to yet)
    for (let i = TAB_SEQUENCE.length - 1; i >= 0; i--) {
      const tabId = TAB_SEQUENCE[i];
      const tabState = tabStates[tabId];
      
      // Check if this tab just became loaded and we haven't auto-switched to it yet
      if (tabState?.loaded && !autoSwitchedTabs.current.has(tabId)) {
        console.log(`✅ AUTO-SWITCHING to newly loaded tab: ${tabId}`);
        autoSwitchedTabs.current.add(tabId);
        setActiveTab(tabId);
        break;
      }
    }
  }, [tabStates, searchType, setActiveTab, searchComplete]);
  
  // ============================================
  // TAB STATE UPDATER (from SSE events)
  // ============================================
  // Handle phase updates from backend - update tab states
  const handlePhaseUpdate = useCallback((phase) => {
    console.log('📡 Phase update:', phase);
    
    // Update tab states based on phase
    switch (phase) {
      case 'pinterest':
      case 'grid':
        updateTabState('pinterest', { loading: true });
        break;
      case 'analysis':
        updateTabState('pinterest', { loading: false, loaded: true });
        updateTabState('analysis', { loading: true });
        break;
      case 'products':
      case 'search':
      case 'enriching':
      case 'scoring':
        updateTabState('analysis', { loading: false, loaded: true });
        updateTabState('scoring', { loading: false, loaded: true });
        updateTabState('products', { loading: true });
        break;
      case 'complete':
        updateTabState('products', { loading: false, loaded: true });
        // Switch to products tab, then give user full control
        setActiveTab('products');
        // Use timeout to ensure tab switch happens before marking complete
        setTimeout(() => {
          setSearchComplete(true);
          console.log('🎉 Search complete - user now has full control');
        }, 100);
        break;
      default:
        break;
    }
  }, [updateTabState]);
  
  // Start search when page loads with query
  const initiateSearch = useCallback(async (query, precisionMode = false) => {
    if (!query || hasInitiatedSearch.current) return;
    hasInitiatedSearch.current = true;
    
    console.log("🔍 Initiating search for:", query);
    setPrecisionSearch(!!precisionMode);
    
    // Reset search complete flag for new search
    setSearchComplete(false);
    
    // Reset auto-switched tabs tracker for new search
    autoSwitchedTabs.current = new Set();
    
    // Detect search type
    const isPinterest = isPinterestUrl(query);
    const detectedSearchType = isPinterest ? 'pinterest' : 'keyword';
    console.log("🔍 Detected search type:", detectedSearchType);
    
    // Reset and initialize
    resetSearch();
    setSearchQuery(query);
    setIsSearching(true);
    setSearchType(detectedSearchType);
    
    // Initialize tab states based on search type
    if (isPinterest) {
      console.log("📷 Setting initial tab to pinterest");
      updateTabState('pinterest', { loading: true, loaded: false });
      setActiveTab('pinterest');
      setEstimatedTime(40);
      setSegmentTimes({
        pinterest: { startTime: Date.now(), endTime: null, elapsed: 0 },
        analysis: { startTime: null, endTime: null, elapsed: 0 },
        search: { startTime: null, endTime: null, elapsed: 0 }
      });
      setProgressData({ phase: 'pinterest', progress: 0, subStep: '', current: 0, total: 0 });
    } else {
      updateTabState('products', { loading: true, loaded: false });
      setActiveTab('products');
      setEstimatedTime(15);
      setSegmentTimes({
        search: { startTime: Date.now(), endTime: null, elapsed: 0 }
      });
      setProgressData({ phase: 'search', progress: 0, subStep: '', current: 0, total: 0 });
    }
    
    setSearchStartTime(Date.now());
    setElapsedTime(0);
    
    try {
      // Create EventSource for SSE
      const encodedQuery = encodeURIComponent(query);
      const eventSource = new EventSource(
        `${API_URL}/api/search/stream?query=${encodedQuery}&marketplace=ebay${precisionMode ? '&precision=1' : ''}`
      );
      
      eventSource.addEventListener('status', (event) => {
        const data = JSON.parse(event.data);
        console.log('📡 Status:', data);
        setSearchStep(data.step);
        setSearchMessage(data.message);
      });
      
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        console.log('📊 Progress:', data);
        
        const newProgressData = {
          phase: data.phase,
          progress: data.progress,
          subStep: data.subStep || '',
          current: data.current || 0,
          total: data.total || 0
        };
        
        setProgressData(newProgressData);
        
        // Update tab states (auto-switch is handled by useEffect)
        handlePhaseUpdate(data.phase);
        
        // Update segment times
        if (data.phase === 'pinterest' || data.phase === 'grid') {
          // Already handled in handlePhaseUpdate
        } else if (data.phase === 'analysis') {
          // Already handled in handlePhaseUpdate
          
          // Start analysis segment timer if not started
          setSegmentTimes(prev => {
            if (!prev.analysis?.startTime) {
              // End pinterest timer
              const pinterestEnd = Date.now();
              return {
                ...prev,
                pinterest: { ...prev.pinterest, endTime: pinterestEnd, elapsed: Math.floor((pinterestEnd - prev.pinterest.startTime) / 1000) },
                analysis: { startTime: Date.now(), endTime: null, elapsed: 0 }
              };
            }
            return prev;
          });
        } else if (['products', 'search', 'enriching', 'scoring'].includes(data.phase)) {
          updateTabState('analysis', { loading: false, loaded: true });
          updateTabState('scoring', { loading: false, loaded: true });
          updateTabState('products', { loading: true });
          
          // Start search segment timer if not started
          setSegmentTimes(prev => {
            if (!prev.search?.startTime) {
              const analysisEnd = Date.now();
              return {
                ...prev,
                analysis: prev.analysis?.startTime 
                  ? { ...prev.analysis, endTime: analysisEnd, elapsed: Math.floor((analysisEnd - prev.analysis.startTime) / 1000) }
                  : prev.analysis,
                search: { startTime: Date.now(), endTime: null, elapsed: 0 }
              };
            }
            return prev;
          });
        }
      });
      
      eventSource.addEventListener('pinterest_images', (event) => {
        const data = JSON.parse(event.data);
        console.log('🖼️ Pinterest Images:', data);
        setPinterestImages(data.images);
        setBoardName(data.board_name);
        setSearchType('pinterest');
      });
      
      eventSource.addEventListener('analysis', (event) => {
        const data = JSON.parse(event.data);
        console.log('🤖 Analysis:', data);
        setAnalysisData(data);
      });
      
      eventSource.addEventListener('products_basic', (event) => {
        const data = JSON.parse(event.data);
        console.log('🛍️ Basic Products:', data);
        setProductsData(data.products);
        if (data.ebay_widget) setEbayWidgetData(data.ebay_widget);
        if (data.message) setNoResultsMessage(data.message);
      });
      
      eventSource.addEventListener('products', (event) => {
        const data = JSON.parse(event.data);
        console.log('🛍️ Products:', data);
        setProductsData(data.products);
        if (data.message) setNoResultsMessage(data.message);
      });
      
      eventSource.addEventListener('product_description', (event) => {
        const data = JSON.parse(event.data);
        setProductsData(prev => {
          if (!prev) return prev;
          const updated = [...prev];
          if (updated[data.index]) {
            updated[data.index] = { ...updated[data.index], description: data.description };
          }
          return updated;
        });
      });
      
      eventSource.addEventListener('product_score', (event) => {
        const data = JSON.parse(event.data);
        setProductsData(prev => {
          if (!prev) return prev;
          const updated = [...prev];
          if (updated[data.index]) {
            updated[data.index] = {
              ...updated[data.index],
              match_score: data.match_score,
              score_breakdown: data.score_breakdown
            };
          }
          return updated;
        });
      });
      
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        console.log('✅ Complete:', data);
        
        setProcessingTime(data.processing_time);
        setSearchType(data.searchType);
        setIsSearching(false);
        setProgressData({ phase: 'complete', progress: 100, subStep: '', current: 0, total: 0 });
        
        // Mark all tabs as complete
        updateTabState('pinterest', { loading: false, loaded: true });
        updateTabState('analysis', { loading: false, loaded: true });
        updateTabState('scoring', { loading: false, loaded: true });
        updateTabState('products', { loading: false, loaded: true });
        
        // End search timer
        setSegmentTimes(prev => {
          const searchEnd = Date.now();
          return {
            ...prev,
            search: prev.search?.startTime
              ? { ...prev.search, endTime: searchEnd, elapsed: Math.floor((searchEnd - prev.search.startTime) / 1000) }
              : prev.search
          };
        });
        
        eventSource.close();
      });
      
      eventSource.addEventListener('error', (event) => {
        if (event.data) {
          const data = JSON.parse(event.data);
          console.error('❌ Error:', data);
          alert(data.message || 'An error occurred during search.');
        }
        setIsSearching(false);
        eventSource.close();
      });
      
      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error);
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE closed');
        } else {
          alert('Connection error. Please try again.');
          setIsSearching(false);
        }
        eventSource.close();
      };
      
    } catch (error) {
      console.error("❌ Search error:", error);
      alert("An unexpected error occurred.");
      setIsSearching(false);
    }
  }, [
    API_URL, isPinterestUrl, resetSearch, setSearchQuery, setIsSearching,
    setSearchType, updateTabState, setActiveTab, setEstimatedTime,
    setSegmentTimes, setProgressData, setSearchStartTime, setElapsedTime,
    setSearchStep, setSearchMessage, setPinterestImages, setAnalysisData,
    setProductsData, setBoardName, setNoResultsMessage, setEbayWidgetData,
    setProcessingTime, handlePhaseUpdate, setPrecisionSearch
  ]);

  // Parse SSE stream from POST response and dispatch events (same handlers as GET stream)
  const consumeSSEStream = useCallback(async (response, handlers) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const processLine = (eventName, dataStr) => {
      try {
        if (eventName && handlers[eventName]) {
          handlers[eventName]({ data: dataStr != null ? dataStr : null });
        }
      } catch (_) {}
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for (const block of parts) {
        let event = null;
        let data = null;
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) event = line.slice(7).trim();
          else if (line.startsWith('data: ')) data = line.slice(6);
        }
        if (event) processLine(event, data);
      }
    }
    if (buffer.trim()) {
      let event = null, data = null;
      for (const line of buffer.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data = line.slice(6);
      }
      if (event) processLine(event, data);
    }
  }, []);

  // Start image search (visual search): POST images, then same SSE handling as query search
  const initiateImageSearch = useCallback(async (imageFiles, precisionMode = false) => {
    if (!imageFiles?.length || hasInitiatedSearch.current) return;
    hasInitiatedSearch.current = true;

    console.log('📷 Initiating image search with', imageFiles.length, 'image(s)');

    setSearchComplete(false);
    autoSwitchedTabs.current = new Set();
    resetSearch();
    setPrecisionSearch(!!precisionMode);
    setSearchQuery('');
    setIsSearching(true);
    setSearchType('pinterest');
    updateTabState('pinterest', { loading: true, loaded: false });
    setActiveTab('pinterest');
    setEstimatedTime(40);
    setSegmentTimes({
      pinterest: { startTime: Date.now(), endTime: null, elapsed: 0 },
      analysis: { startTime: null, endTime: null, elapsed: 0 },
      search: { startTime: null, endTime: null, elapsed: 0 }
    });
    setProgressData({ phase: 'pinterest', progress: 0, subStep: '', current: 0, total: 0 });
    setSearchStartTime(Date.now());
    setElapsedTime(0);

    const formData = new FormData();
    imageFiles.forEach((file) => formData.append('images', file));
    formData.append('precision', precisionMode ? '1' : '0');

    try {
      const response = await fetch(`${API_URL}/api/search/stream-images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(err.message || 'Image search failed');
      }

      const handlers = {
        status: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setSearchStep(data.step);
          setSearchMessage(data.message);
        },
        progress: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProgressData({
            phase: data.phase,
            progress: data.progress,
            subStep: data.subStep || '',
            current: data.current || 0,
            total: data.total || 0
          });
          handlePhaseUpdate(data.phase);
          if (data.phase === 'analysis') {
            setSegmentTimes(prev => {
              if (prev.analysis?.startTime) return prev;
              return {
                ...prev,
                pinterest: prev.pinterest?.startTime ? { ...prev.pinterest, endTime: Date.now(), elapsed: Math.floor((Date.now() - prev.pinterest.startTime) / 1000) } : prev.pinterest,
                analysis: { startTime: Date.now(), endTime: null, elapsed: 0 }
              };
            });
          } else if (['products', 'search', 'enriching', 'scoring'].includes(data.phase)) {
            updateTabState('analysis', { loading: false, loaded: true });
            updateTabState('scoring', { loading: false, loaded: true });
            updateTabState('products', { loading: true });
            setSegmentTimes(prev => {
              if (prev.search?.startTime) return prev;
              return {
                ...prev,
                analysis: prev.analysis?.startTime ? { ...prev.analysis, endTime: Date.now(), elapsed: Math.floor((Date.now() - prev.analysis.startTime) / 1000) } : prev.analysis,
                search: { startTime: Date.now(), endTime: null, elapsed: 0 }
              };
            });
          }
        },
        pinterest_images: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setPinterestImages(data.images);
          setBoardName(data.board_name || 'Your photos');
          setSearchType('pinterest');
        },
        analysis: (e) => {
          if (!e.data) return;
          setAnalysisData(JSON.parse(e.data));
        },
        products_basic: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(data.products);
          if (data.ebay_widget) setEbayWidgetData(data.ebay_widget);
          if (data.message) setNoResultsMessage(data.message);
        },
        products: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(data.products);
          if (data.message) setNoResultsMessage(data.message);
        },
        product_description: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            if (updated[data.index]) updated[data.index] = { ...updated[data.index], description: data.description };
            return updated;
          });
        },
        product_score: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            if (updated[data.index]) {
              updated[data.index] = { ...updated[data.index], match_score: data.match_score, score_breakdown: data.score_breakdown };
            }
            return updated;
          });
        },
        complete: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProcessingTime(data.processing_time);
          setSearchType(data.searchType || 'pinterest');
          setIsSearching(false);
          setProgressData({ phase: 'complete', progress: 100, subStep: '', current: 0, total: 0 });
          updateTabState('pinterest', { loading: false, loaded: true });
          updateTabState('analysis', { loading: false, loaded: true });
          updateTabState('scoring', { loading: false, loaded: true });
          updateTabState('products', { loading: false, loaded: true });
          setSegmentTimes(prev => ({
            ...prev,
            search: prev.search?.startTime ? { ...prev.search, endTime: Date.now(), elapsed: Math.floor((Date.now() - prev.search.startTime) / 1000) } : prev.search
          }));
          setSearchComplete(true);
        },
        error: (e) => {
          if (e.data) {
            try {
              const data = JSON.parse(e.data);
              alert(data.message || 'An error occurred.');
            } catch (_) {
              alert('An error occurred during search.');
            }
          }
          setIsSearching(false);
        }
      };

      await consumeSSEStream(response, handlers);
    } catch (error) {
      console.error('❌ Image search error:', error);
      alert(error.message || 'Image search failed.');
      setIsSearching(false);
    }
  }, [
    API_URL, updateTabState, setActiveTab, setEstimatedTime, setSegmentTimes, setProgressData,
    setSearchStartTime, setElapsedTime, setSearchStep, setSearchMessage, setPinterestImages,
    setAnalysisData, setProductsData, setBoardName, setNoResultsMessage, setEbayWidgetData,
    setProcessingTime, setSearchType, setIsSearching, handlePhaseUpdate, consumeSSEStream,
    setSearchComplete, resetSearch, setPrecisionSearch, setSearchQuery
  ]);

  // Timer effect for elapsed time
  useEffect(() => {
    let interval;
    if (isSearching) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        // Update current segment elapsed time
        setSegmentTimes(prev => {
          const updated = { ...prev };
          for (const segId of ['pinterest', 'analysis', 'search']) {
            if (updated[segId]?.startTime && !updated[segId]?.endTime) {
              updated[segId] = {
                ...updated[segId],
                elapsed: Math.floor((Date.now() - updated[segId].startTime) / 1000)
              };
            }
          }
          return updated;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching, setElapsedTime, setSegmentTimes]);
  
  // Initialize search on mount (query from URL or image files from state)
  useEffect(() => {
    const imageFiles = location.state?.imageFiles;
    const precisionFromState = !!location.state?.precisionSearch;
    if (imageFiles?.length && !hasInitiatedSearch.current) {
      initiateImageSearch(imageFiles, precisionFromState);
      navigate('/results', { replace: true, state: {} });
      return;
    }
    if (queryFromUrl) {
      const key = `${queryFromUrl}::${precisionFromUrl ? '1' : '0'}`;
      if (lastSearchKeyRef.current !== key) {
        // allow re-run when precision changes
        hasInitiatedSearch.current = false;
        lastSearchKeyRef.current = key;
      }
      if (!hasInitiatedSearch.current) {
        initiateSearch(queryFromUrl, precisionFromUrl);
      }
    } else if (!queryFromUrl && !imageFiles?.length && !hasInitiatedSearch.current) {
      navigate('/');
    }
  }, [queryFromUrl, precisionFromUrl, location.state?.imageFiles, location.state?.precisionSearch, initiateSearch, initiateImageSearch, navigate]);
  
  // Handle new search from navbar (query string or image files)
  const handleNewSearch = (queryOrImages) => {
    hasInitiatedSearch.current = false;
    if (Array.isArray(queryOrImages) && queryOrImages.length > 0) {
      initiateImageSearch(queryOrImages, precisionSearch);
    } else if (typeof queryOrImages === 'string' && queryOrImages.trim()) {
      navigate(`/results?q=${encodeURIComponent(queryOrImages)}${precisionSearch ? '&precision=1' : ''}`);
    }
  };

  // ===========================================================================
  // RE-SEARCH FROM SELECTED IMAGES
  // ===========================================================================
  // Sends selected image URLs to /api/search/from-images, which re-analyzes
  // the subset and searches products. Updates analysis + products without
  // clearing pinterest images so user can still see/modify their selection.
  const handleReSearchFromImages = useCallback(async () => {
    if (!selectedImages || selectedImages.length === 0) return;
    if (isSearching) return;

    console.log('🔄 Re-search from', selectedImages.length, 'selected images');

    // Collect image URLs from selected images
    const imageUrls = selectedImages.map(img =>
      img.url || `${API_URL}${img.localUrl}` || ''
    ).filter(Boolean);

    if (imageUrls.length === 0) return;

    // Prepare state for re-search (keep pinterest images intact)
    setReSearchSource('images');
    setIsSearching(true);
    setSearchComplete(false);
    setProductsData(null);
    setAnalysisData(null);
    setEbayWidgetData(null);
    setNoResultsMessage('');
    clearAllFilters();

    // Reset progress for analysis + search phases
    setProgressData({ phase: 'analysis', progress: 0, subStep: '', current: 0, total: 0 });
    setSearchStartTime(Date.now());
    setElapsedTime(0);
    setSegmentTimes({
      pinterest: { startTime: null, endTime: null, elapsed: 0 },
      analysis: { startTime: Date.now(), endTime: null, elapsed: 0 },
      search: { startTime: null, endTime: null, elapsed: 0 }
    });

    // Update tab states
    updateTabState('analysis', { loading: true, loaded: false });
    updateTabState('products', { loading: false, loaded: false });
    setActiveTab('products');

    try {
      const response = await fetch(`${API_URL}/api/search/from-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls, precision: precisionSearch })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(err.message || 'Re-analysis failed');
      }

      const handlers = {
        status: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setSearchStep(data.step);
          setSearchMessage(data.message);
        },
        progress: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProgressData({
            phase: data.phase, progress: data.progress,
            subStep: data.subStep || '', current: data.current || 0, total: data.total || 0
          });
          // Update tab/segment states
          if (data.phase === 'analysis') {
            updateTabState('analysis', { loading: true });
          } else if (['search', 'products', 'scoring'].includes(data.phase)) {
            updateTabState('analysis', { loading: false, loaded: true });
            updateTabState('products', { loading: true });
            setSegmentTimes(prev => {
              if (prev.search?.startTime) return prev;
              return {
                ...prev,
                analysis: prev.analysis?.startTime
                  ? { ...prev.analysis, endTime: Date.now(), elapsed: Math.floor((Date.now() - prev.analysis.startTime) / 1000) }
                  : prev.analysis,
                search: { startTime: Date.now(), endTime: null, elapsed: 0 }
              };
            });
          }
        },
        analysis: (e) => {
          if (!e.data) return;
          setAnalysisData(JSON.parse(e.data));
          updateTabState('analysis', { loading: false, loaded: true });
          updateTabState('scoring', { loading: false, loaded: true });
          setActiveTab('products');
        },
        products_basic: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(data.products);
          if (data.ebay_widget) setEbayWidgetData(data.ebay_widget);
          if (data.message) setNoResultsMessage(data.message);
        },
        products: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(data.products);
          if (data.message) setNoResultsMessage(data.message);
        },
        product_score: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            if (updated[data.index]) {
              updated[data.index] = { ...updated[data.index], match_score: data.match_score, score_breakdown: data.score_breakdown };
            }
            return updated;
          });
        },
        complete: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProcessingTime(data.processing_time);
          setIsSearching(false);
          setReSearchSource(null);
          setProgressData({ phase: 'complete', progress: 100, subStep: '', current: 0, total: 0 });
          updateTabState('products', { loading: false, loaded: true });
          setSegmentTimes(prev => ({
            ...prev,
            search: prev.search?.startTime
              ? { ...prev.search, endTime: Date.now(), elapsed: Math.floor((Date.now() - prev.search.startTime) / 1000) }
              : prev.search
          }));
          setSearchComplete(true);
          setActiveTab('products');
        },
        error: (e) => {
          if (e.data) {
            try { alert(JSON.parse(e.data).message); } catch (_) { alert('An error occurred.'); }
          }
          setIsSearching(false);
          setReSearchSource(null);
        }
      };

      await consumeSSEStream(response, handlers);
    } catch (error) {
      console.error('❌ Re-search from images error:', error);
      alert(error.message || 'Re-search failed.');
      setIsSearching(false);
      setReSearchSource(null);
    }
  }, [
    selectedImages, isSearching, API_URL, precisionSearch, consumeSSEStream,
    setIsSearching, setProductsData, setAnalysisData, setEbayWidgetData,
    setNoResultsMessage, setProgressData, setSearchStartTime, setElapsedTime,
    setSegmentTimes, updateTabState, setActiveTab, setSearchStep, setSearchMessage,
    setProcessingTime, setReSearchSource, clearAllFilters
  ]);

  // ===========================================================================
  // RE-SEARCH FROM MODIFIED KEYWORDS  
  // ===========================================================================
  // Sends edited keywords to /api/search/from-keywords, searches products
  // directly. Does NOT re-analyze. Keeps pinterest images and analysis intact.
  const handleReSearchFromKeywords = useCallback(async () => {
    if (!editedKeywords || editedKeywords.length === 0) return;
    if (isSearching) return;

    console.log('🔤 Re-search with', editedKeywords.length, 'keywords:', editedKeywords);

    // Prepare state (keep pinterest images and analysis intact)
    setReSearchSource('keywords');
    setIsSearching(true);
    setSearchComplete(false);
    setProductsData(null);
    setEbayWidgetData(null);
    setNoResultsMessage('');
    clearAllFilters();

    // Reset progress for search phase only
    setProgressData({ phase: 'search', progress: 0, subStep: '', current: 0, total: 0 });
    setSearchStartTime(Date.now());
    setElapsedTime(0);
    setSegmentTimes(prev => ({
      ...prev,
      search: { startTime: Date.now(), endTime: null, elapsed: 0 }
    }));

    // Update tab states
    updateTabState('products', { loading: true, loaded: false });
    setActiveTab('products');

    try {
      const response = await fetch(`${API_URL}/api/search/from-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: editedKeywords,
          analysisData: analysisData || undefined
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(err.message || 'Keyword search failed');
      }

      const handlers = {
        status: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setSearchStep(data.step);
          setSearchMessage(data.message);
        },
        progress: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProgressData({
            phase: data.phase, progress: data.progress,
            subStep: data.subStep || '', current: data.current || 0, total: data.total || 0
          });
          if (['search', 'products', 'scoring'].includes(data.phase)) {
            updateTabState('products', { loading: true });
          }
        },
        products_basic: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(data.products);
          if (data.ebay_widget) setEbayWidgetData(data.ebay_widget);
          if (data.message) setNoResultsMessage(data.message);
        },
        products: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(data.products);
          if (data.message) setNoResultsMessage(data.message);
        },
        product_score: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProductsData(prev => {
            if (!prev) return prev;
            const updated = [...prev];
            if (updated[data.index]) {
              updated[data.index] = { ...updated[data.index], match_score: data.match_score, score_breakdown: data.score_breakdown };
            }
            return updated;
          });
        },
        complete: (e) => {
          if (!e.data) return;
          const data = JSON.parse(e.data);
          setProcessingTime(data.processing_time);
          setIsSearching(false);
          setReSearchSource(null);
          setProgressData({ phase: 'complete', progress: 100, subStep: '', current: 0, total: 0 });
          updateTabState('products', { loading: false, loaded: true });
          setSegmentTimes(prev => ({
            ...prev,
            search: prev.search?.startTime
              ? { ...prev.search, endTime: Date.now(), elapsed: Math.floor((Date.now() - prev.search.startTime) / 1000) }
              : prev.search
          }));
          setSearchComplete(true);
        },
        error: (e) => {
          if (e.data) {
            try { alert(JSON.parse(e.data).message); } catch (_) { alert('An error occurred.'); }
          }
          setIsSearching(false);
          setReSearchSource(null);
        }
      };

      await consumeSSEStream(response, handlers);
    } catch (error) {
      console.error('❌ Re-search from keywords error:', error);
      alert(error.message || 'Keyword search failed.');
      setIsSearching(false);
      setReSearchSource(null);
    }
  }, [
    editedKeywords, analysisData, isSearching, API_URL, consumeSSEStream,
    setIsSearching, setProductsData, setEbayWidgetData, setNoResultsMessage,
    setProgressData, setSearchStartTime, setElapsedTime, setSegmentTimes,
    updateTabState, setActiveTab, setSearchStep, setSearchMessage,
    setProcessingTime, setReSearchSource, clearAllFilters
  ]);
  
  // Render active tab content
  const renderTabContent = () => {
    // For keyword search, only show products
    if (searchType === 'keyword') {
      return <ProductsTab />;
    }
    
    switch (activeTab) {
      case 'pinterest':
        return <PinterestTab onReSearchFromImages={handleReSearchFromImages} />;
      case 'scoring':
        return <ScoringTab />;
      case 'products':
        return <ProductsTab onReSearchFromKeywords={handleReSearchFromKeywords} />;
      default:
        return <PinterestTab onReSearchFromImages={handleReSearchFromImages} />;
    }
  };
  
  return (
    <div className="bg-[#EEEFE9] min-h-screen font-sans">
      {/* Results Navbar with Search - Fixed at top */}
      <ResultsNavbar onNewSearch={handleNewSearch} />
      
      {/* Tab Navigation - Immediately below navbar, sticky */}
      <div className="fixed top-[44px] sm:top-[49px] left-0 right-0 z-40">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchType={searchType}
        />
      </div>

      {/* Spacer for fixed navbar + tabs */}
      <div className="h-[92px] sm:h-[100px]" />
      
      {/* Tab Content - aligned with navbar and tabs, swipeable on mobile */}
      <main ref={swipeRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {renderTabContent()}
      </main>
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
}

export default ResultsPage;
