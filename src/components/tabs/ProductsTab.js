import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, ExternalLink, TrendingUp, AlertCircle, 
  Filter, X, Tag, ChevronDown, ChevronUp, ArrowUpDown, Loader2, Sparkles, Brain 
} from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
// import { TimingDisplay } from './TabNavigation';
import { CategoryDropdown } from '../ProductFilters';
import { EbayGalleryWidget } from '../common/EbayGalleryWidget';
import { GlassProgressBar, KeywordEditor, ReSearchButton } from '../common';
import { useReferralCode } from '../../hooks/useReferralCode';
import { ReferralCodeModal } from '../modals/ReferralCodeModal';

// Predefined palette for condition badges — theme-aware where tokens exist
const CONDITION_COLORS = [
  // Theme-aware accents use dark ink for >=4.5:1 in both themes (white fails on L~0.7+ fills)
  { bg: 'oklch(var(--c-accent-green))', text: 'rgb(var(--c-on-primary-strong))' },
  { bg: 'oklch(var(--c-accent-blue))', text: 'rgb(var(--c-on-primary-strong))' },
  { bg: 'oklch(var(--c-accent-purple))', text: 'rgb(var(--c-on-primary-strong))' },
  { bg: 'rgb(var(--c-primary))', text: 'rgb(var(--c-on-primary-strong))' },
  // Fixed brand/categorical fills are dark enough for white text
  { bg: '#E60023', text: '#FFFFFF' },
  { bg: '#0D7C5F', text: '#FFFFFF' },
  { bg: '#1D4AFF', text: '#FFFFFF' },
  { bg: '#D4541C', text: '#FFFFFF' },
];

// Placeholder image for products without images
const NO_IMAGE_PLACEHOLDER = 'https://www.freeiconspng.com/uploads/no-image-icon-6.png';

/**
 * useDropdownPosition - Hook to dynamically calculate dropdown position.
 * Accepts an optional panelRef so it can measure the real dropdown width.
 * Returns { alignment: 'left' | 'center' | 'right', direction: 'down' | 'up' }
 */
function useDropdownPosition(isOpen, triggerRef, panelRef) {
  const [position, setPosition] = useState({ alignment: 'left', direction: 'down' });

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Measure real panel width if available, otherwise estimate
      const panelEl = panelRef?.current;
      const dropdownWidth = panelEl ? panelEl.scrollWidth : 288;
      const dropdownHeight = 320; // max-h-80

      // --- Horizontal ---
      const spaceRight = viewportWidth - rect.left;
      const spaceLeft  = rect.right;
      const center = rect.left + rect.width / 2;
      const half = dropdownWidth / 2;

      let alignment;
      if (spaceRight >= dropdownWidth) {
        alignment = 'left';
      } else if (spaceLeft >= dropdownWidth) {
        alignment = 'right';
      } else if (center - half >= 8 && center + half <= viewportWidth - 8) {
        alignment = 'center';
      } else {
        alignment = spaceRight >= spaceLeft ? 'left' : 'right';
      }

      // --- Vertical ---
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const direction = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'down' : 'up';

      setPosition({ alignment, direction });
    };

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef, panelRef]);

  return position;
}

/**
 * KeywordFilterDropdown - Multi-select keyword filter for products
 */
function KeywordFilterDropdown({ 
  keywords, 
  selectedKeywords, 
  onToggle, 
  onClearAll 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const position = useDropdownPosition(isOpen, triggerRef, panelRef);
  
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  if (!keywords || keywords.length === 0) return null;

  const alignClass =
    position.alignment === 'center' ? 'left-1/2 -translate-x-1/2' :
    position.alignment === 'right'  ? 'right-0' : 'left-0';

  const dropdownClasses = `
    absolute min-w-[16rem] max-w-[min(24rem,90vw)] max-h-80
    overflow-y-auto overflow-x-hidden
    bg-surface-container-low rounded-lg shadow-xl border border-outline/10 z-50
    ${position.direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}
    ${alignClass}
  `;
  
  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200
          text-sm
          ${selectedKeywords.length > 0 
            ? 'bg-primary/15 border-primary text-border-amber' 
            : 'bg-white border-[#C5BFAE] text-on-surface-variant hover:border-primary dark:bg-surface-elevated dark:border-outline/20'
          }
        `}
      >
        <Tag className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">
          {selectedKeywords.length > 0 
            ? `${selectedKeywords.length} Keywords`
            : 'Filter by Keyword'
          }
        </span>
        <span className="sm:hidden font-medium">
          {selectedKeywords.length > 0 ? selectedKeywords.length : 'Keywords'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div ref={panelRef} className={dropdownClasses}>
          {/* Header */}
          <div className="sticky top-0 bg-surface-container-low px-4 py-3 border-b border-outline/10">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-on-surface">Filter by Keyword</span>
              {selectedKeywords.length > 0 && (
                <button
                  onClick={() => {
                    onClearAll();
                    setIsOpen(false);
                  }}
                  className="text-xs text-primary hover:text-shadow-amber font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          {/* Keyword List */}
          <div className="p-2">
            {keywords.map((keyword, idx) => {
              const isSelected = selectedKeywords.includes(keyword);
              return (
                <button
                  key={`kw-${idx}`}
                  onClick={() => onToggle(keyword)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left
                    ${isSelected ? 'bg-primary/15 text-border-amber' : 'hover:bg-surface-section text-on-surface-variant'}
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
                    ${isSelected ? 'bg-primary border-primary' : 'bg-white border-[#C5BFAE] dark:bg-transparent dark:border-outline/20'}
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-on-primary-strong" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm flex-1 min-w-0 break-words">{keyword}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SortDropdown - Product sorting options
 */
function SortDropdown({ sortBy, sortOrder, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const position = useDropdownPosition(isOpen, triggerRef, panelRef);
  
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Price: Low → High', sortBy: 'price', sortOrder: 'asc' },
    { value: 'price_desc', label: 'Price: High → Low', sortBy: 'price', sortOrder: 'desc' },
    { value: 'match_score_asc', label: 'Score: Low → High', sortBy: 'match_score', sortOrder: 'asc' },
    { value: 'match_score_desc', label: 'Score: High → Low', sortBy: 'match_score', sortOrder: 'desc' },
  ];
  
  const currentValue = sortBy === 'default' ? 'default' : `${sortBy}_${sortOrder}`;
  const currentLabel = sortOptions.find(opt => opt.value === currentValue)?.label || 'Default';
  
  const handleSelect = (option) => {
    if (option.value === 'default') {
      onSortChange('default', 'asc');
    } else {
      onSortChange(option.sortBy, option.sortOrder);
    }
    setIsOpen(false);
  };
  
  const alignClass =
    position.alignment === 'center' ? 'left-1/2 -translate-x-1/2' :
    position.alignment === 'right'  ? 'right-0' : 'left-0';

  const dropdownClasses = `
    absolute min-w-[14rem] max-w-[90vw] bg-surface-container-low rounded-lg shadow-xl border border-outline/10 z-50
    ${position.direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}
    ${alignClass}
  `;
  
  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200
          text-sm
          ${sortBy !== 'default' 
            ? 'bg-primary/15 border-primary text-border-amber' 
            : 'bg-white border-[#C5BFAE] text-on-surface-variant hover:border-primary dark:bg-surface-elevated dark:border-outline/20'
          }
        `}
      >
        <ArrowUpDown className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">{currentLabel}</span>
        <span className="sm:hidden font-medium">Sort</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div ref={panelRef} className={dropdownClasses}>
          <div className="p-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`
                  w-full text-left px-4 py-2 rounded-lg transition-colors duration-150 text-sm
                  ${currentValue === option.value
                    ? 'bg-primary/15 text-border-amber font-medium'
                    : 'text-on-surface-variant hover:bg-surface-section'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ProductCard - Individual product display
 */
function ProductCard({ product, index, searchType, conditionColorMap, onProductClick }) {
  const { 
    expandedCards, setExpandedCards,
    loadingRelevance, setLoadingRelevance,
    relevanceExplanations, setRelevanceExplanations,
    analysisData, selectedKeywordFilters, searchQuery, API_URL
  } = useSearch();
  
  const productId = product.id || product.url || `product-${index}`;
  const isExpanded = expandedCards.has(productId);
  const isLoading = loadingRelevance.has(productId);
  const explanation = relevanceExplanations[productId];

  const currentPriceValue = product.priceValue != null
    ? Number(product.priceValue)
    : (product.price ? parseFloat(String(product.price).replace(/[^0-9.]/g, '')) : NaN);
  const originalPriceValue = product.originalPriceValue != null
    ? Number(product.originalPriceValue)
    : (product.originalPrice ? parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, '')) : NaN);
  const showOriginalPrice = Boolean(
    product.originalPrice
    && Number.isFinite(originalPriceValue)
    && Number.isFinite(currentPriceValue)
    && originalPriceValue > currentPriceValue
    && (!product.priceTreatment
      || product.priceTreatment === 'STRIKE_THROUGH'
      || product.priceTreatment === 'MARKDOWN')
  );
  
  const handleRelevanceClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If already expanded, collapse it
    if (isExpanded) {
      setExpandedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      return;
    }
    
    // If already loaded, just expand
    if (explanation) {
      setExpandedCards(prev => new Set(prev).add(productId));
      return;
    }
    
    // Start loading
    setLoadingRelevance(prev => new Set(prev).add(productId));
    
    try {
      const keywords = analysisData?.contents || selectedKeywordFilters || [];
      // For direct photo upload (no text query), send AI-generated image description so
      // "Why is this relevant?" explains product vs. visual interpretation of the image
      const visualContext = !searchQuery && analysisData?.summary ? analysisData.summary : undefined;
      
      const response = await fetch(`${API_URL}/api/product/relevance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: searchQuery,
          visualContext,
          keywords: keywords,
          product: {
            name: product.name,
            description: product.description || '',
            price: product.price,
            condition: product.condition,
            match_score: product.match_score
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.explanation) {
        setRelevanceExplanations(prev => ({ ...prev, [productId]: data.explanation }));
        setExpandedCards(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Error fetching relevance:', error);
    } finally {
      setLoadingRelevance(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };
  
  return (
    <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#D4CFC0] hover:border-primary flex flex-col dark:bg-surface-elevated dark:border-outline/15">
      {/* Product Image */}
      <a
        href={product.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={(e) => {
          if (onProductClick) {
            e.preventDefault();
            onProductClick(product.url || '#', product.name);
          }
        }}
      >
        <div className="aspect-square relative overflow-hidden bg-surface-container-low">
          <img
            src={product.image || NO_IMAGE_PLACEHOLDER}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = NO_IMAGE_PLACEHOLDER;
            }}
          />
          
          {/* Badges - stacked on mobile, left/right on larger screens */}
          {product.condition && (
            <div
              className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded z-10 font-medium"
              style={{
                backgroundColor: (() => {
                  const bg = conditionColorMap?.[product.condition]?.bg || '#E60023';
                  // Hex colors get 8-digit alpha; CSS var colors use color-mix
                  if (bg.startsWith('#') && bg.length === 7) return `${bg}E6`;
                  return `color-mix(in oklch, ${bg} 90%, transparent)`;
                })(),
                color: conditionColorMap?.[product.condition]?.text || '#FFFFFF',
              }}
            >
              {product.condition}
            </div>
          )}
          {product.match_score != null && (
            <div className={`absolute z-10 bg-surface-elevated/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1 shadow-sm ${
              product.condition
                ? 'top-8 left-2 sm:top-3 sm:right-3 sm:left-auto'
                : 'top-2 right-2 sm:top-3 sm:right-3'
            }`}>
              <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent-blue" />
              <span className="text-[10px] sm:text-xs font-semibold text-accent-blue">{product.match_score.toFixed(1)}%</span>
            </div>
          )}
          
          {/* Hover overlay: seller + score breakdown */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end pointer-events-none">
            <div className="p-2.5 sm:p-3 space-y-1.5">
              {product.seller && (
                <p className="text-[10px] sm:text-xs text-white/80">Seller: {product.seller}</p>
              )}
              {product.score_breakdown && searchType === 'pinterest' && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/90 dark:bg-blue-700/85 text-white rounded" title="Content">C:{product.score_breakdown.content}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-600/90 dark:bg-green-700/85 text-white rounded" title="Color">L:{product.score_breakdown.color}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/90 dark:bg-orange-700/85 text-white rounded" title="Category">Cat:{product.score_breakdown.category}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/90 dark:bg-amber-800/85 text-white rounded" title="Theme">T:{product.score_breakdown.theme}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </a>
      
      {/* Product Info */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
        <a
          href={product.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (onProductClick) {
              e.preventDefault();
              onProductClick(product.url || '#', product.name);
            }
          }}
        >
          <h4 className="font-semibold text-on-surface text-xs sm:text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
            {product.name || 'Untitled Product'}
          </h4>
        </a>
        
        {/* Price + View on eBay row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {product.price ? (
            <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
              {showOriginalPrice && (
                <span className="text-xs text-on-surface-variant line-through flex-shrink-0">
                  {product.originalPrice}
                </span>
              )}
              <span className="text-sm sm:text-base font-bold text-on-surface truncate">
                {product.price}
              </span>
            </div>
          ) : <span className="flex-1 min-w-0" />}
          <a
            href={product.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on eBay"
            className="flex items-center gap-1 text-accent-green text-xs sm:text-sm font-medium hover:text-accent-green transition-all flex-shrink-0"
            onClick={(e) => {
              if (onProductClick) {
                e.preventDefault();
                onProductClick(product.url || '#', product.name);
              }
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:group-hover:inline">View on eBay</span>
          </a>
        </div>
        
        {/* Why Relevant Button */}
        <button
          onClick={handleRelevanceClick}
          disabled={isLoading}
          className={`
            mt-3 w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-300
            backdrop-blur-md border text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isExpanded 
              ? 'bg-primary/15 text-border-amber shadow-lg border-primary' 
              : 'bg-white text-on-surface-variant hover:bg-primary/10 hover:text-border-amber border-[#C5BFAE] hover:border-primary dark:bg-surface-elevated/60 dark:border-outline/20'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Generating...</span>
            </span>
          ) : isExpanded ? (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Hide explanation</span>
              <span className="sm:hidden">Hide</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Why is this relevant?</span>
              <span className="sm:hidden">Why?</span>
            </span>
          )}
        </button>
        
        {/* Expanded Explanation */}
        {isExpanded && explanation && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-outline/10 animate-fade-in">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-xs sm:text-sm font-semibold text-on-surface mb-1 sm:mb-2">AI Explanation</h5>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ProductsTab - Displays matched products with filtering and sorting
 * Includes collapsible AI Analysis section for pinterest/image searches.
 */
export function ProductsTab({ onReSearchFromKeywords }) {
  const { 
    productsData,
    filteredProducts,
    availableKeywords,
    selectedKeywordFilters,
    selectedCategoryFilters,
    sortBy,
    sortOrder,
    handleKeywordFilterToggle,
    handleCategoryFilterToggle,
    clearKeywordFilters,
    clearCategoryFilters,
    clearAllFilters,
    handleSortChange,
    tabStates,
    segmentTimes,
    isSearching,
    progressData,
    noResultsMessage,
    searchType,
    searchQuery,
    analysisData,
    setProductsData,
    ebayWidgetData,
    API_URL,
    // Keyword editing state for embedded analysis
    editedKeywords,
    originalKeywords,
    keywordsModified,
    updateKeyword,
    removeKeyword,
    addKeyword,
    resetKeywords,
    reSearchSource,
  } = useSearch();
  
  const tabState = tabStates.products;
  const timing = segmentTimes.search;
  const isLoading = tabState?.loading || (isSearching && ['products', 'search', 'enriching', 'scoring'].includes(progressData.phase));
  const isComplete = tabState?.loaded || (productsData && productsData.length > 0 && !isSearching);
  
  const hasActiveFilters = selectedKeywordFilters.length > 0 || selectedCategoryFilters.length > 0;

  // Referral code modal state
  const {
    isModalOpen: isReferralModalOpen,
    pendingProductTitle: referralProductTitle,
    shouldShowModal,
    referralCode: activeReferralCode,
    openReferralModal,
    confirmReferral,
    cancelReferral,
    dismissReferral,
    DEFAULT_REFERRAL_CODE: defaultReferralCode,
  } = useReferralCode();

  /**
   * Intercept any eBay product click — open the referral modal instead of navigating.
   * (The hook handles whether to show the modal or redirect immediately.)
   * @param {string} url - eBay product URL
   * @param {string} [title] - Optional product title for context
   */
  const handleProductClick = (url, title) => {
    openReferralModal(url, title);
  };

  // AI analysis collapsible state — collapsed by default
  const [showAnalysis, setShowAnalysis] = useState(false);
  const isReSearching = isSearching && reSearchSource === 'keywords';
  const analysisLoading = tabStates.analysis?.loading || (isSearching && progressData.phase === 'analysis');

  const [showMoreLoading, setShowMoreLoading] = useState(false);
  const [showMoreDepth, setShowMoreDepth] = useState(4); // products per keyword so far (initial search = 4)
  const prevIsSearchingRef = useRef(isSearching);

  // Build condition → color map from all products
  const conditionColorMap = useMemo(() => {
    if (!productsData || productsData.length === 0) return {};
    const conditions = [...new Set(productsData.map(p => p.condition).filter(Boolean))];
    const map = {};
    conditions.forEach((cond, idx) => {
      map[cond] = CONDITION_COLORS[idx % CONDITION_COLORS.length];
    });
    return map;
  }, [productsData]);

  // Reset show-more depth when a new search completes (isSearching true -> false)
  useEffect(() => {
    if (prevIsSearchingRef.current === true && isSearching === false) {
      setShowMoreDepth(4);
    }
    prevIsSearchingRef.current = isSearching;
  }, [isSearching]);

  const handleShowMore = async () => {
    const searchKeywords = analysisData?.contents;
    if (!Array.isArray(searchKeywords) || searchKeywords.length === 0 || !API_URL) return;
    setShowMoreLoading(true);
    try {
      const nextDepth = Math.min(showMoreDepth + 4, 20); // backend allows 4, 8, 12, 20
      const response = await fetch(`${API_URL}/api/search/deep-fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: searchKeywords,
          productsPerKeyword: nextDepth,
          // Pass full analysis data for relevance scoring
          analysis: {
            contents: analysisData?.contents || [],
            color_palette: analysisData?.color_palette || [],
            category: analysisData?.category,
            theme: analysisData?.theme,
          },
        }),
      });
      const data = await response.json();
      if (!data.success) return;
      const incoming = Array.isArray(data.products) ? data.products : [];
      setProductsData((prev) => {
        if (!prev || prev.length === 0) return incoming;
        const existingIds = new Set(prev.map((p) => p.id || p.url));
        const newOnes = incoming.filter((p) => {
          const key = p.id || p.url;
          if (!key) return false;
          if (existingIds.has(key)) return false;
          existingIds.add(key);
          return true;
        });
        if (newOnes.length === 0) return prev;
        return [...prev, ...newOnes];
      });
      setShowMoreDepth(nextDepth);
    } catch (error) {
      console.error('Show more products error:', error);
    } finally {
      setShowMoreLoading(false);
    }
  };
  
  return (
    <div className="py-6 animate-fade-in">
      {/* Collapsible AI Analysis Section — only for pinterest/image searches */}
      {searchType !== 'keyword' && (
        <div className="mb-6">
          {/* Toggle Header */}
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-t-xl border border-[#D4CFC0] hover:bg-[#F8F7F2] transition-colors group dark:bg-surface-elevated dark:border-outline/15 dark:hover:bg-surface-container-low"
            style={!showAnalysis ? { borderRadius: '0.75rem' } : {}}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-purple to-accent-blue rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white dark:text-on-primary-strong" />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-base font-bold text-on-surface">AI Analysis</h3>
                <p className="text-xs text-on-surface-variant">
                  {analysisData ? 'Understanding your aesthetic' : analysisLoading ? 'Analyzing...' : 'Pending'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {analysisData && (
                <span className="text-xs text-accent-green font-medium bg-accent-green/10 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                  <span>✓</span> Complete
                </span>
              )}
              {analysisLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              )}
              {showAnalysis ? (
                <ChevronUp className="w-5 h-5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
              )}
            </div>
          </button>

          {/* Collapsible Content */}
          {showAnalysis && (
            <div className="bg-white rounded-b-xl border border-t-0 border-[#D4CFC0] overflow-hidden animate-fade-in dark:bg-surface-elevated dark:border-outline/15">
              {/* Gradient Header Bar */}
              <div className="h-1.5 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-green"></div>

              {/* Loading State */}
              {analysisLoading && !analysisData && (
                <div className="p-5 animate-pulse">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="h-10 w-24 bg-surface-container-low rounded-full" />
                        <div className="h-10 w-28 bg-surface-container-low rounded-full" />
                      </div>
                      <div className="h-24 bg-surface-container-low rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-surface-container-low rounded" />
                      <div className="flex flex-wrap gap-2">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-8 w-20 bg-surface-container-low rounded-full" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Content */}
              {analysisData && (
                <div className="p-5 sm:p-6">
                  <div className="space-y-5">
                    {/* Category, Theme, Summary */}
                    <div>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-accent-purple/20 text-[#6B3FA0] border border-accent-purple/35 dark:text-accent-purple">
                          Category: {analysisData.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-accent-blue/20 text-[#2F5FA8] border border-accent-blue/35 dark:text-accent-blue">
                          Theme: {analysisData.theme}
                        </span>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-sm">
                        {analysisData.summary}
                      </p>
                    </div>

                    {/* Editable Keywords & Colors */}
                    <div className="bg-[#FDFDF8] rounded-lg p-4 border border-[#C5BFAE] dark:bg-surface-container-low dark:border-outline/20">
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <h4 className="font-semibold text-on-surface flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-accent-green" />
                          Keywords & Colors
                        </h4>
                        <p className="text-xs text-on-surface-variant/80 italic">
                          Click any keyword to edit
                        </p>
                      </div>

                      {/* Editable Keywords */}
                      <div className="mb-4">
                        <KeywordEditor
                          keywords={editedKeywords}
                          originalKeywords={originalKeywords}
                          isModified={keywordsModified}
                          onUpdate={updateKeyword}
                          onRemove={removeKeyword}
                          onAdd={addKeyword}
                          onReset={resetKeywords}
                        />
                      </div>

                      {/* Color Palette */}
                      {analysisData.color_palette && analysisData.color_palette.length > 0 && (
                        <div className="pt-3 border-t border-outline-variant">
                          <h5 className="text-sm font-medium text-on-surface-variant mb-2">Color Palette</h5>
                          <div className="flex flex-wrap gap-2">
                            {analysisData.color_palette.map((color, idx) => (
                              <span
                                key={`color-${idx}`}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-accent-blue/20 text-[#2F5FA8] border border-accent-blue/35 text-sm rounded-full dark:text-accent-blue"
                              >
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Re-search action bar */}
                  {keywordsModified && editedKeywords.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-outline-variant flex items-center justify-between gap-4">
                      <p className="text-sm text-on-surface-variant">
                        <span className="font-medium text-on-surface">{editedKeywords.length}</span> keyword{editedKeywords.length !== 1 ? 's' : ''} (modified)
                      </p>
                      <ReSearchButton
                        label="Search Keywords"
                        onClick={() => onReSearchFromKeywords?.()}
                        loading={isReSearching}
                        disabled={isReSearching || editedKeywords.length === 0}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!analysisLoading && !analysisData && (
                <div className="text-center py-8">
                  <Sparkles className="w-6 h-6 text-on-surface-variant mx-auto mb-2" />
                  <p className="text-sm text-on-surface-variant">AI analysis will appear here once processing is complete.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Header with Timing - Hidden for keyword search since widget has its own header */}
      {searchType !== 'keyword' && (
        <div className="flex flex-col gap-4 mb-6">
        {/* Row: title and progress bar - stacks vertically on mobile */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 lg:gap-8">
            {/* Left: title */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-on-primary-strong" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Matched Products</h2>
                <p className="text-sm text-on-surface-variant">
                  {filteredProducts.length === productsData?.length 
                    ? `${productsData?.length || 0} products found`
                    : `${filteredProducts.length} of ${productsData?.length} products`
                  }
                </p>
              </div>
            </div>

            {/* Center: progress bar (grows to fill) */}
            <div className="flex-1 min-w-0">
              <GlassProgressBar />
            </div>
          </div>
          
          {/* Filters Row - Hidden for keyword search since widget has its own sorting */}
          {productsData && productsData.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <KeywordFilterDropdown
                keywords={availableKeywords}
                selectedKeywords={selectedKeywordFilters}
                onToggle={handleKeywordFilterToggle}
                onClearAll={clearKeywordFilters}
              />
              <CategoryDropdown
                products={productsData}
                selectedCategories={selectedCategoryFilters}
                onCategoryToggle={handleCategoryFilterToggle}
                onClearCategories={clearCategoryFilters}
              />
              <SortDropdown
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
            </div>
          )}
          
          {/* Active Filters Summary */}
          {hasActiveFilters && (
          <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-outline/10">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-border-amber">Active:</span>
              {selectedKeywordFilters.map((kw, idx) => (
                <span 
                  key={`active-kw-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-border-amber text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {kw}
                  <button onClick={() => handleKeywordFilterToggle(kw)} className="hover:text-shadow-amber">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedCategoryFilters.map((cat, idx) => (
                <span 
                  key={`active-cat-${idx}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-surface-container-low text-on-surface-variant text-xs rounded-full border border-[#C5BFAE] dark:border-outline/25"
                >
                  {cat.split(' > ').pop()}
                  <button onClick={() => handleCategoryFilterToggle(cat)} className="hover:text-on-surface">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="ml-2 text-xs text-primary hover:text-shadow-amber underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (!productsData || productsData.length === 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-surface-elevated rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="aspect-square bg-surface-container-low" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-surface-container-low rounded w-3/4" />
                <div className="h-6 bg-surface-container-low rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* No Results After Filtering */}
      {filteredProducts.length === 0 && hasActiveFilters && productsData?.length > 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md border border-[#D4CFC0] dark:bg-surface-elevated dark:border-outline/15">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 rounded-lg mb-4">
            <Filter className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-on-surface mb-2">No Products Match Your Filters</h3>
          <p className="text-on-surface-variant max-w-md mx-auto mb-4">
            Try adjusting your keyword or category filters to see more results.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-strong rounded-lg text-sm font-medium hover:bg-shadow-amber transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All Filters
          </button>
        </div>
      )}
      
      {/* No Products Found */}
      {!isLoading && productsData && productsData.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-surface-container-low rounded-lg mb-4">
            <AlertCircle className="w-7 h-7 text-on-surface-variant" />
          </div>
          <h3 className="text-xl font-semibold text-on-surface mb-2">No Results Found</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            {noResultsMessage || 'No matching products found. Try a different search or Pinterest board.'}
          </p>
        </div>
      )}
      
      {/* Product Grid */}
      {filteredProducts.length > 0 && (
        searchType === 'keyword' && ebayWidgetData?.searchUrl ? (
          /* eBay Gallery Widget for keyword search - gallery view with sorting & pagination */
          <div className="space-y-6">
            <EbayGalleryWidget
              searchEndpoint={`${API_URL}/search`}
              imageSearchEndpoint={`${API_URL}/search_by_image`}
              searchKeyword={searchQuery || ''}
              limit={50}
              hideSortOptions={false}
              onItemClick={handleProductClick}
            />
          </div>
        ) : (
          <>
            {/* Standard Product Card Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id || product.url || `product-${index}`}
                  product={product}
                  index={index}
                  searchType={searchType}
                  conditionColorMap={conditionColorMap}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
            {/* Show More - only when search completed and we have products (pinterest/image search) */}
            {searchType !== 'keyword' && productsData?.length > 0 && isComplete && (
              <div className="flex justify-center pt-6 pb-2">
                <button
                  type="button"
                  onClick={handleShowMore}
                  disabled={showMoreLoading || !analysisData?.contents?.length}
                  className={`
                    inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold
                    transition-colors min-w-[12rem]
                    ${showMoreLoading || !analysisData?.contents?.length
                      ? 'bg-surface-container-low text-on-surface-variant/60 cursor-not-allowed'
                      : 'bg-primary text-on-primary-strong hover:bg-shadow-amber'}
                  `}
                >
                  {showMoreLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading more products...</span>
                    </>
                  ) : (
                    <span>Show More Products</span>
                  )}
                </button>
              </div>
            )}
          </>
        )
      )}
      
      {/* Empty State */}
      {!isLoading && !productsData && (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-surface-container-low rounded-lg flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-on-surface-variant" />
          </div>
          <h3 className="text-lg font-semibold text-on-surface-variant mb-2">Products Loading</h3>
          <p className="text-on-surface-variant">Matched products will appear here once found.</p>
        </div>
      )}

      {/* Referral Code Modal — shown before every eBay redirect */}
      <ReferralCodeModal
        isOpen={isReferralModalOpen}
        defaultCode={defaultReferralCode}
        onConfirm={confirmReferral}
        onCancel={cancelReferral}
        onDismiss={dismissReferral}
        productTitle={referralProductTitle}
      />
    </div>
  );
}

export default ProductsTab;
