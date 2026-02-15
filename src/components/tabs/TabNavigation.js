import React, { useState, useRef, useEffect } from 'react';
import { Image, BarChart3, ShoppingBag, Check, Loader2, Clock, HelpCircle } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

/**
 * TabNavigation - Horizontal scrollable tabs (Google-style)
 * Handles tab states: loading, disabled, active
 */

// Tab configurations with lucide-react icons
export const TABS = [
  { id: 'pinterest', name: 'Pinterest Images', Icon: Image },
  { id: 'products', name: 'Matched Products', Icon: ShoppingBag },
  { id: 'scoring', name: 'Insights & Help', Icon: HelpCircle }
];

// Tab order for sequential loading
export const TAB_ORDER = ['pinterest', 'products', 'scoring'];

export function TabNavigation({ activeTab, onTabChange, searchType }) {
  const { tabStates, progressData, isSearching, processingTime, boardName } = useSearch();
  const scrollContainerRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const [tooltipMessage, setTooltipMessage] = useState('');
  
  // Check if all tabs are loaded (search complete)
  const allTabsLoaded = searchType === 'keyword' 
    ? tabStates.products?.loaded 
    : tabStates.pinterest?.loaded && tabStates.products?.loaded;
  
  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds) return null;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };  
  // Determine if this is an image upload search (not a Pinterest URL search)
  const isImageUploadSearch = boardName === 'Your photos' || boardName === '';

  // Get visible tabs based on search type, with dynamic naming
  const visibleTabs = searchType === 'keyword'
    ? TABS.filter(tab => tab.id === 'products')
    : TABS.map(tab => {
        if (tab.id === 'pinterest' && isImageUploadSearch) {
          return { ...tab, name: 'Your Images' };
        }
        return tab;
      });
  
  // Determine tab state
  const getTabState = (tabId) => {
    const tabState = tabStates[tabId];
    const tabIndex = TAB_ORDER.indexOf(tabId);
    const activeIndex = TAB_ORDER.indexOf(activeTab);
    
    // For keyword search, only products tab is relevant
    if (searchType === 'keyword') {
      if (tabId === 'products') {
        return tabState?.loaded ? 'completed' : (tabState?.loading ? 'loading' : 'pending');
      }
      return 'hidden';
    }
    
    // Check if tab is completed
    if (tabState?.loaded) return 'completed';
    
    // Check if tab is currently loading
    if (tabState?.loading) return 'loading';
    
    // Check if previous tabs are completed
    const previousTabs = TAB_ORDER.slice(0, tabIndex);
    const allPreviousCompleted = previousTabs.every(id => tabStates[id]?.loaded);
    
    if (allPreviousCompleted && !tabState?.loaded) {
      return 'pending'; // Can start loading
    }
    
    return 'disabled'; // Previous tabs not complete
  };
  
  // Handle tab click
  const handleTabClick = (tabId) => {
    const state = getTabState(tabId);
    
    if (state === 'disabled') {
      // Find the current loading/pending tab
      const currentLoadingTab = TAB_ORDER.find(id => 
        tabStates[id]?.loading || (!tabStates[id]?.loaded && getTabState(id) !== 'disabled')
      );
      
      const tabName = TABS.find(t => t.id === currentLoadingTab)?.name || 'previous tab';
      setTooltipMessage(`Please wait for "${tabName}" to finish loading`);
      setShowTooltip(tabId);
      
      // Auto-hide tooltip
      setTimeout(() => {
        setShowTooltip(null);
      }, 3000);
      return;
    }
    
    // Allow navigation to completed or loading tabs
    if (state === 'completed' || state === 'loading') {
      onTabChange(tabId);
    }
  };
  
  // Scroll to active tab
  useEffect(() => {
    if (scrollContainerRef.current && activeTab) {
      const container = scrollContainerRef.current;
      const activeElement = container.querySelector(`[data-tab="${activeTab}"]`);
      
      if (activeElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = activeElement.getBoundingClientRect();
        
        // Scroll if element is not fully visible
        if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
          activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [activeTab]);
  
  // Get tab styles based on state
  const getTabStyles = (tabId, state) => {
    const isActive = activeTab === tabId;
    
    const baseStyles = `
      relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium
      whitespace-nowrap rounded transition-all
      focus:outline-none focus:ring-2 focus:ring-amber-300
    `;
    
    if (state === 'disabled') {
      return `${baseStyles} text-gray-400 cursor-not-allowed opacity-60`;
    }
    
    if (isActive) {
      // Active tab - amber/orange primary button style
      return `${baseStyles} bg-[#EB9D2A] text-[#1D1F20] border border-[#B17816] shadow-[0_2px_0_0_#CD8407] cursor-default`;
    }
    
    if (state === 'completed') {
      // Completed - white with border, hover pops up
      return `${baseStyles} bg-white text-[#1D1F20] border border-[#D4CFC0] hover:-translate-y-0.5 hover:shadow-md cursor-pointer`;
    }
    
    if (state === 'loading') {
      // Loading - light section background
      return `${baseStyles} bg-[#EEEFE9] text-[#3D3F40] border border-[#D4CFC0] cursor-pointer`;
    }
    
    // Default/pending
    return `${baseStyles} bg-[#EEEFE9] text-[#5D5F60] border border-[#E0DCCE] hover:bg-[#E8E4D9] cursor-pointer`;
  };
  
  return (
    <div className="relative">
      {/* Tab container - full width on mobile, limited width on desktop */}
      <div className="sm:max-w-7xl sm:mx-auto sm:px-6 lg:px-8">
        <div
          ref={scrollContainerRef}
          className="
            flex items-center gap-1.5 sm:gap-2 py-2
            overflow-x-auto scrollbar-hide
            -webkit-overflow-scrolling-touch
            bg-[#EEEFE9] sm:rounded-b-lg border-b border-x border-t border-[#E0DCCE] px-3
          "
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
        {visibleTabs.map((tab) => {
          const state = getTabState(tab.id);
          const isActive = activeTab === tab.id;
          const TabIcon = tab.Icon;
          
          return (
            <div key={tab.id} className="relative" data-tab={tab.id}>
              <button
                onClick={() => handleTabClick(tab.id)}
                className={getTabStyles(tab.id, state)}
                disabled={state === 'disabled'}
              >
                {/* Tab Icon - SVG from lucide-react */}
                <TabIcon className="w-4 h-4" />
                
                {/* Tab Name */}
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                
                {/* Loading Indicator */}
                {state === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin text-[#EB9D2A]" />
                )}
                
                {/* Completed Indicator - removed per user request, active/disabled states are self-explanatory */}
              </button>
              
              {/* Tooltip for disabled tabs */}
              {showTooltip === tab.id && (
                <div className="
                  absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                  px-3 py-2 text-xs text-white bg-[#1D1F20] rounded-md
                  shadow-lg whitespace-nowrap border border-[#3D3F40]
                ">
                  {tooltipMessage}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0">
                    <div className="w-2 h-2 bg-[#1D1F20] rotate-45 transform translate-y-1" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Total Time Badge - commented out: timer now lives in GlassProgressBar */}
        {/* {allTabsLoaded && processingTime && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 ml-auto bg-white text-[#1D1F20] rounded-md text-sm font-medium whitespace-nowrap border border-[#D4CFC0]">
            <Clock className="w-3.5 h-3.5 text-[#EB9D2A]" />
            <span className="hidden sm:inline">Total:</span>
            <span>{formatTime(processingTime)}</span>
          </div>
        )} */}
        </div>
      </div>
      
      {/* Gradient fade edges for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#EEEFE9] to-transparent pointer-events-none sm:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#EEEFE9] to-transparent pointer-events-none sm:hidden" />
    </div>
  );
}

/**
 * TimingDisplay - Shows elapsed/completed time for tab loading
 */
export function TimingDisplay({ 
  isLoading, 
  isComplete, 
  elapsedTime, 
  estimatedTime,
  completedTime 
}) {
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  if (isComplete && completedTime) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-white px-3 py-1.5 rounded-md border border-[#D4CFC0]">
        <Check className="w-4 h-4" />
        <span>Completed in {formatTime(completedTime)}</span>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-[#EB9D2A] bg-white px-3 py-1.5 rounded-md border border-[#D4CFC0]">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{formatTime(elapsedTime)} elapsed</span>
        </div>
        {estimatedTime && (
          <span className="text-[#5D5F60]">
            ~{formatTime(Math.max(0, estimatedTime - elapsedTime))} remaining
          </span>
        )}
      </div>
    );
  }
  
  return null;
}

export default TabNavigation;
