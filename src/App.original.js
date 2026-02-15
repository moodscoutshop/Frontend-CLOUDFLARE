import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowRight, Sparkles, Search, ShoppingBag, Heart, TrendingUp, Zap, X, Mail, User, CheckCircle, Phone, MessageSquare, Tag, ExternalLink, Loader2, AlertCircle, Calendar, Clock, Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
// import logo from './assets/logo.svg';
import logo from './assets/logo.svg';
import { KeywordFilterBadges, CategoryDropdown, filterProducts, getUniqueKeywords } from './components/ProductFilters';

// Marketplace logos
import ebayLogo from './assets/ebay.svg';
import targetLogo from './assets/BullseyeRed.svg';
import walmartLogo from './assets/spark-icon.svg';
import amazonLogo from './assets/amazon-icon.svg';
import etsyLogo from './assets/etsy-ar21.svg';


// Placeholder image for products without images
const NO_IMAGE_PLACEHOLDER = 'https://www.freeiconspng.com/uploads/no-image-icon-6.png';

export default function MoodScoutLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Progressive loading states
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(''); // 'pinterest', 'analysis', 'products', 'enriching'
  const [searchMessage, setSearchMessage] = useState('');
  const [searchType, setSearchType] = useState(null); // 'pinterest' or 'keyword'
  const [noResultsMessage, setNoResultsMessage] = useState(''); // For handling no results
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0 }); // Track enrichment progress
  
  // Progress bar states
  const [progressData, setProgressData] = useState({
    phase: '',           // Current phase: pinterest, analysis, search, complete
    progress: 0,         // 0-100 percentage
    subStep: '',         // Detailed sub-step message
    current: 0,          // Current item (for enrichment)
    total: 0,            // Total items (for enrichment)
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(40); // Total estimated time (10+15+10+5)
  const [searchStartTime, setSearchStartTime] = useState(null);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showProgressBar, setShowProgressBar] = useState(false); // Control progress bar visibility
  
  // Segment timing states
  const [segmentTimes, setSegmentTimes] = useState({
    pinterest: { startTime: null, endTime: null, elapsed: 0 },
    analysis: { startTime: null, endTime: null, elapsed: 0 },
    search: { startTime: null, endTime: null, elapsed: 0 }
  });
  
  // Dynamic segment widths (updated after completion based on actual times)
  const [dynamicSegmentWidths, setDynamicSegmentWidths] = useState(null);
  
  // Progressive data states
  const [pinterestImages, setPinterestImages] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [boardName, setBoardName] = useState('');
  const [ebayWidgetData, setEbayWidgetData] = useState(null); // eBay widget configuration  
  
  // Filter states for products
  const [selectedKeywordFilters, setSelectedKeywordFilters] = useState([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  
  // Sorting states for products
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price', 'match_score'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
  // Product relevance explanation states
  const [expandedCards, setExpandedCards] = useState(new Set()); // Set of product IDs that are expanded
  const [loadingRelevance, setLoadingRelevance] = useState(new Set()); // Set of product IDs currently loading
  const [relevanceExplanations, setRelevanceExplanations] = useState({}); // Map of product ID -> explanation text
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    reason: '', 
    categories: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [otherMarketplace, setOtherMarketplace] = useState('');
  
  // Marketplace selection state
  const [selectedMarketplace, setSelectedMarketplace] = useState('ebay');
  const [showMarketplaceDropdown, setShowMarketplaceDropdown] = useState(false);

  // Scoring section toggle state
  const [isScoringExpanded, setIsScoringExpanded] = useState(false);

  // Refs for scrolling to sections
  const resultsRef = useRef(null);
  const pinterestSectionRef = useRef(null);
  const analysisSectionRef = useRef(null);
  const productsSectionRef = useRef(null);

  // API URL - UPDATED FOR PRODUCTION
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const marketplaceOptions = [
    "Etsy",
    "Temu",
    "Shein",
    "Amazon",
    "Target",
    "eBay",
    "Shopify Stores",
    "AliExpress",
    "Walmart",
    "Other"
  ];

  // Marketplaces configuration - easy to add new marketplaces
  const marketplaces = [
    {
      id: 'ebay',
      name: 'eBay',
      logo: ebayLogo,
      color: 'from-blue-500 to-blue-600',
      available: true,
      description: 'Search millions of unique items'
    },
    {
      id: 'target',
      name: 'Target',
      logo: targetLogo,
      color: 'from-red-500 to-red-600',
      available: false,
      description: 'Coming Soon'
    },
    {
      id: 'walmart',
      name: 'Walmart',
      logo: walmartLogo,
      color: 'from-yellow-500 to-yellow-600',
      available: false,
      description: 'Coming Soon'
    },
    {
      id: 'amazon',
      name: 'Amazon',
      logo: amazonLogo,
      color: 'from-orange-500 to-orange-600',
      available: false,
      description: 'Coming Soon'
    },
    {
      id: 'etsy',
      name: 'Etsy',
      logo: etsyLogo,
      color: 'from-pink-500 to-pink-600',
      available: false,
      description: 'Coming Soon'
    }
  ];

  // Dummy articles data - easily replaceable with API data
  const articles = [
    {
      id: 1,
      title: "10 Hidden Gems on eBay You Need to Know About",
      excerpt: "Discover the secret categories and search techniques that reveal eBay's most unique treasures.",
      content: "eBay is home to millions of listings, but the real treasures are often hidden in plain sight. In this guide, we'll explore unconventional search strategies, lesser-known categories, and expert tips for finding one-of-a-kind items that match your aesthetic. From vintage home decor to rare collectibles, learn how to navigate eBay like a pro and uncover deals that others miss.",
      image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=600&fit=crop",
      author: "Sarah Mitchell",
      date: "January 5, 2025",
      readTime: "5 min read",
      category: "Shopping Tips",
      tags: ["eBay", "Shopping", "Deals"]
    },
    {
      id: 2,
      title: "How to Score Designer Items at 70% Off on eBay",
      excerpt: "Master the art of finding authentic luxury goods at unbeatable prices with these proven strategies.",
      content: "Shopping for designer items on eBay can save you thousands, but it requires knowledge and strategy. This comprehensive guide covers authentication tips, timing your purchases for maximum savings, understanding seller ratings, and negotiating like a professional buyer. Whether you're after luxury handbags, watches, or fashion pieces, learn how to build a designer collection without breaking the bank.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
      author: "Marcus Chen",
      date: "December 28, 2024",
      readTime: "7 min read",
      category: "Luxury Shopping",
      tags: ["Designer", "Luxury", "Deals"]
    },
    {
      id: 3,
      title: "eBay vs. Other Marketplaces: Why eBay Wins for Unique Finds",
      excerpt: "Compare eBay with other online marketplaces and discover why it's the go-to platform for distinctive items.",
      content: "In the crowded world of online marketplaces, eBay stands out for several key reasons. This article breaks down the advantages of eBay's auction system, its vast selection of vintage and rare items, buyer protection policies, and global reach. We'll compare pricing, variety, and user experience across major platforms to show why eBay remains unmatched for discovering unique, personality-driven products that align with your aesthetic vision.",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop",
      author: "Emily Rodriguez",
      date: "December 20, 2024",
      readTime: "6 min read",
      category: "Marketplace Comparison",
      tags: ["eBay", "Shopping", "Comparison"]
    }
  ];

  // ============================================================================
  // FILTERING LOGIC
  // ============================================================================
  
  // Get unique keywords from products for filter badges
  const availableKeywords = useMemo(() => {
    if (!productsData || productsData.length === 0) return [];
    return getUniqueKeywords(productsData);
  }, [productsData]);

  // Filter products based on selected keyword and category filters
  const filteredProducts = useMemo(() => {
    if (!productsData || productsData.length === 0) return [];
    
    // First apply filters
    let products = filterProducts(productsData, selectedKeywordFilters, selectedCategoryFilters);
    
    // Then apply sorting if not default
    if (sortBy !== 'default') {
      products = [...products].sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'price') {
          // Use priceValue if available, otherwise try to parse price string
          aValue = a.priceValue != null ? a.priceValue : (a.price ? parseFloat(a.price.replace(/[^0-9.]/g, '')) : 0);
          bValue = b.priceValue != null ? b.priceValue : (b.price ? parseFloat(b.price.replace(/[^0-9.]/g, '')) : 0);
        } else if (sortBy === 'match_score') {
          aValue = a.match_score != null ? a.match_score : 0;
          bValue = b.match_score != null ? b.match_score : 0;
        } else {
          return 0; // No sorting
        }
        
        // Handle null/undefined values
        if (aValue == null) aValue = 0;
        if (bValue == null) bValue = 0;
        
        // Apply sort order
        if (sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
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

  // Clear all keyword filters
  const handleClearKeywordFilters = useCallback(() => {
    setSelectedKeywordFilters([]);
  }, []);

  // Handle category filter toggle
  const handleCategoryFilterToggle = useCallback((categoryPath) => {
    setSelectedCategoryFilters(prev => 
      prev.includes(categoryPath)
        ? prev.filter(c => c !== categoryPath)
        : [...prev, categoryPath]
    );
  }, []);

  // Clear all category filters
  const handleClearCategoryFilters = useCallback(() => {
    setSelectedCategoryFilters([]);
  }, []);

  // Reset all filters when new search starts
  const resetFilters = useCallback(() => {
    setSelectedKeywordFilters([]);
    setSelectedCategoryFilters([]);
    setSortBy('default');
    setSortOrder('asc');
    // Reset product relevance states
    setExpandedCards(new Set());
    setLoadingRelevance(new Set());
    setRelevanceExplanations({});
  }, []);
  
  // Handle "Why is this relevant?" button click
  const handleRelevanceClick = async (e, product, productIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const productId = product.id || product.url || `product-${productIndex}`;
    
    // If already expanded, collapse it
    if (expandedCards.has(productId)) {
      setExpandedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      return;
    }
    
    // If already loaded, just expand
    if (relevanceExplanations[productId]) {
      setExpandedCards(prev => new Set(prev).add(productId));
      return;
    }
    
    // Start loading
    setLoadingRelevance(prev => new Set(prev).add(productId));
    
    try {
      // Extract keywords from analysis data or use selected filters
      const keywords = analysisData?.contents || selectedKeywordFilters || [];
      
      const response = await fetch(`${API_URL}/api/product/relevance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: searchQuery,
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
        // Store explanation and expand card
        setRelevanceExplanations(prev => ({
          ...prev,
          [productId]: data.explanation
        }));
        setExpandedCards(prev => new Set(prev).add(productId));
      } else {
        console.error('Failed to get relevance explanation:', data.message);
        alert('Failed to generate explanation. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching relevance explanation:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoadingRelevance(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };
  
  // Handle sorting change
  const handleSortChange = useCallback((newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // ============================================================================
  // SORTING DROPDOWN COMPONENT
  // ============================================================================
  const SortDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    // Close dropdown when clicking outside
    useEffect(() => {
      function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const sortOptions = [
      { value: 'default', label: 'Default (no sorting)' },
      { value: 'price_asc', label: 'Price: Low → High', sortBy: 'price', sortOrder: 'asc' },
      { value: 'price_desc', label: 'Price: High → Low', sortBy: 'price', sortOrder: 'desc' },
      { value: 'match_score_asc', label: 'Match Score: Low → High', sortBy: 'match_score', sortOrder: 'asc' },
      { value: 'match_score_desc', label: 'Match Score: High → Low', sortBy: 'match_score', sortOrder: 'desc' },
    ];
    
    const currentValue = sortBy === 'default' ? 'default' : `${sortBy}_${sortOrder}`;
    const currentLabel = sortOptions.find(opt => opt.value === currentValue)?.label || 'Default (no sorting)';
    
    const handleSelect = (option) => {
      if (option.value === 'default') {
        handleSortChange('default', 'asc');
      } else {
        handleSortChange(option.sortBy, option.sortOrder);
      }
      setIsOpen(false);
    };
    
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200
            ${sortBy !== 'default' 
              ? 'bg-purple-50 border-purple-300 text-purple-700' 
              : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
            }
          `}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="text-sm font-medium">{currentLabel}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
            <div className="p-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full text-left px-4 py-2 rounded-lg transition-colors duration-150
                    ${currentValue === option.value
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
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
  };

  // Handle article click
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  // Phase-specific messages for progress bar
  const phaseMessages = {
    pinterest: "Exploring your Pinterest board... 🎨",
    analysis: "AI is studying your aesthetic... 🧠",
    search: "Finding matching treasures on eBay... 🔍",
    complete: "Your curated results are ready! ✨"
  };

  // Segment-specific motivational messages
  const segmentMotivationalMessages = {
    pinterest: [
      "Downloading your inspiration... 📥",
      "Gathering your aesthetic vibes... ✨",
      "Capturing your Pinterest magic... 🎨",
      "Almost done collecting images... 📷"
    ],
    analysis: [
      "AI is reading your style... 🤖",
      "Understanding your aesthetic... 🎯",
      "Decoding colors and themes... 🌈",
      "Creating your style profile... 💎"
    ],
    search: [
      "Hunting for perfect matches... 🔍",
      "Scouring eBay's marketplace... 💍",
      "Finding hidden gems for you... ✨",
      "Curating your personalized picks... 🛍️",
      "Scoring and ranking results... 📊",
      "Almost there, quality takes time... ⏳"
    ]
  };

  // Segment configuration: dynamic based on search type
  // Pinterest search: 3 segments (Pinterest, AI Analysis, Search)
  // Keyword search: 1 segment (Search only)
  const segments = useMemo(() => {
    if (searchType === 'keyword') {
      return [
        { id: 'search', name: 'Search', estimatedDuration: 15, widthPercent: 100 }
      ];
    }
    // Default: Pinterest flow with 3 segments
    return [
      { id: 'pinterest', name: 'Pinterest', estimatedDuration: 10, widthPercent: 25 },
      { id: 'analysis', name: 'AI Analysis', estimatedDuration: 15, widthPercent: 37.5 },
      { id: 'search', name: 'Search', estimatedDuration: 15, widthPercent: 37.5 }
    ];
  }, [searchType]);

  // Get current segment index
  const getCurrentSegmentIndex = () => {
    const phase = progressData.phase;
    
    // For keyword search, everything maps to the single search segment (index 0)
    if (searchType === 'keyword') {
      if (phase === 'complete') return 1; // All complete
      return 0; // All phases map to search segment
    }
    
    // Pinterest flow: 3 segments
    if (phase === 'pinterest' || phase === 'grid') return 0;
    if (phase === 'analysis') return 1;
    if (phase === 'products' || phase === 'search' || phase === 'enriching' || phase === 'scoring') return 2;
    if (phase === 'complete') return 3; // All complete
    return 0;
  };

  // Get segment status: 'completed', 'active', 'pending'
  const getSegmentStatus = (segmentIndex) => {
    const currentIndex = getCurrentSegmentIndex();
    if (segmentIndex < currentIndex) return 'completed';
    if (segmentIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Reusable scroll function with navbar offset
  const scrollToSection = useCallback((ref) => {
    if (!ref?.current) return;
    
    // Get navbar height (fixed navbar is approximately 72px, but we calculate dynamically)
    const navbarHeight = 80; // Fixed navbar height + some padding
    const elementPosition = ref.current.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navbarHeight;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }, []);

  // Handle clicking on progress bar segment to navigate to respective section
  const handleSegmentClick = useCallback((segmentId) => {
    // Only allow navigation when progress is complete
    if (progressData.phase !== 'complete') return;
    
    let targetRef = null;
    
    // For keyword search, clicking the single segment goes to products
    if (searchType === 'keyword') {
      targetRef = productsSectionRef;
    } else {
      // For Pinterest search, map segment ID to corresponding ref
      switch (segmentId) {
        case 'pinterest':
          targetRef = pinterestSectionRef;
          break;
        case 'analysis':
          targetRef = analysisSectionRef;
          break;
        case 'search':
          targetRef = productsSectionRef;
          break;
        default:
          targetRef = resultsRef;
      }
    }
    
    scrollToSection(targetRef);
  }, [progressData.phase, searchType, scrollToSection]);

  // Motivational messages (friendly & engaging) - fallback
  const motivationalMessages = [
    "Almost there! ✨",
    "Finding perfect matches for you...",
    "Good things take time 💫",
    "Your curated results are coming...",
    "We're close to something great!",
    "Hang tight, magic in progress... 🪄",
    "Quality over speed, always 💎",
    "Discovering hidden gems... 💍",
    "Building your personalized collection..."
  ];

  // Elapsed time counter + segment time tracking
  useEffect(() => {
    let interval;
    if (isSearching && searchStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - searchStartTime) / 1000);
        setElapsedTime(elapsed);
        
        // Update current segment elapsed time - use progressData.phase directly for accuracy
        const currentIdx = getCurrentSegmentIndex();
        const currentSegmentId = segments[currentIdx]?.id;
        
        setSegmentTimes(prev => {
          // Only update if segment exists and has a start time but no end time
          if (currentSegmentId && prev[currentSegmentId]?.startTime && !prev[currentSegmentId]?.endTime) {
            return {
              ...prev,
              [currentSegmentId]: {
                ...prev[currentSegmentId],
                elapsed: Math.floor((Date.now() - prev[currentSegmentId].startTime) / 1000)
              }
            };
          }
          return prev;
        });
        
        // Dynamically extend estimated time if exceeded
        if (elapsed >= estimatedTime - 5) {
          setEstimatedTime(prev => prev + 15);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching, searchStartTime, estimatedTime, progressData.phase]);

  // Track segment transitions
  useEffect(() => {
    const phase = progressData.phase;
    if (!phase || phase === 'complete') return;
    
    // Map phase to segment
    let segmentId = null;
    if (phase === 'pinterest' || phase === 'grid') segmentId = 'pinterest';
    else if (phase === 'analysis') segmentId = 'analysis';
    else if (phase === 'products' || phase === 'search' || phase === 'enriching' || phase === 'scoring') segmentId = 'search';
    
    if (segmentId && segmentTimes[segmentId] && !segmentTimes[segmentId].startTime) {
      // Start this segment
      setSegmentTimes(prev => ({
        ...prev,
        [segmentId]: { ...prev[segmentId], startTime: Date.now(), elapsed: 0 }
      }));
      
      // End previous segment (only for Pinterest flow with multiple segments)
      if (searchType !== 'keyword') {
        const segmentOrder = ['pinterest', 'analysis', 'search'];
        const currentIdx = segmentOrder.indexOf(segmentId);
        if (currentIdx > 0) {
          const prevSegmentId = segmentOrder[currentIdx - 1];
          if (segmentTimes[prevSegmentId]?.startTime && !segmentTimes[prevSegmentId]?.endTime) {
            setSegmentTimes(prev => ({
              ...prev,
              [prevSegmentId]: {
                ...prev[prevSegmentId],
                endTime: Date.now(),
                elapsed: Math.floor((Date.now() - prev[prevSegmentId].startTime) / 1000)
              }
            }));
          }
        }
      }
    }
  }, [progressData.phase, searchType]);

  // Mark all segments complete when done and calculate dynamic widths
  useEffect(() => {
    if (progressData.phase === 'complete') {
      setSegmentTimes(prev => {
        const updated = { ...prev };
        // Use appropriate segment IDs based on search type
        const segmentIds = searchType === 'keyword' 
          ? ['search'] 
          : ['pinterest', 'analysis', 'search'];
        
        // First, mark all segments as complete
        segmentIds.forEach(id => {
          if (updated[id]?.startTime && !updated[id]?.endTime) {
            updated[id] = {
              ...updated[id],
              endTime: Date.now(),
              elapsed: Math.floor((Date.now() - updated[id].startTime) / 1000)
            };
          }
        });
        
        // Calculate total elapsed time from all segments
        const totalTime = segmentIds.reduce((sum, id) => {
          return sum + (updated[id]?.elapsed || 1); // Use 1 as minimum to avoid division by zero
        }, 0);
        
        // Calculate dynamic widths based on actual times (with minimum 15% width)
        const newWidths = {};
        segmentIds.forEach(id => {
          const segmentTime = updated[id]?.elapsed || 1;
          const rawPercent = (segmentTime / totalTime) * 100;
          // Ensure minimum width of 15% and maximum of 60%
          newWidths[id] = Math.max(15, Math.min(60, rawPercent));
        });
        
        // Normalize widths to total 100%
        const totalWidth = Object.values(newWidths).reduce((sum, w) => sum + w, 0);
        segmentIds.forEach(id => {
          newWidths[id] = (newWidths[id] / totalWidth) * 100;
        });
        
        // Update dynamic widths state
        setDynamicSegmentWidths(newWidths);
        
        return updated;
      });
    }
  }, [progressData.phase]);

  // Motivational message rotation (every 3 seconds) - segment specific
  useEffect(() => {
    let interval;
    if (isSearching) {
      // Get segment-specific messages or fallback
      const getRandomMessage = () => {
        const currentSegmentId = segments[getCurrentSegmentIndex()]?.id;
        const messages = segmentMotivationalMessages[currentSegmentId] || motivationalMessages;
        return messages[Math.floor(Math.random() * messages.length)];
      };
      
      // Set initial message
      setMotivationalMessage(getRandomMessage());
      
      interval = setInterval(() => {
        setMotivationalMessage(getRandomMessage());
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSearching, progressData.phase]);

  // Show progress bar when searching starts and keep visible after completion
  useEffect(() => {
    if (isSearching) {
      setShowProgressBar(true);
    }
  }, [isSearching]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close marketplace dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMarketplaceDropdown && !event.target.closest('.marketplace-dropdown')) {
        setShowMarketplaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMarketplaceDropdown]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showModal]);

  useEffect(() => {
    const mappedCategories = selectedCategories.map(cat => {
      if (cat === 'Other' && otherMarketplace.trim()) {
        return `Other: ${otherMarketplace.trim()}`;
      }
      return cat;
    });

    setFormData(prevData => ({
      ...prevData,
      categories: mappedCategories
    }));
  }, [selectedCategories, otherMarketplace]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      let newCategories;
      
      if (isSelected) {
        newCategories = prev.filter(cat => cat !== category);
        if (category === 'Other') {
          setOtherMarketplace('');
        }
      } else {
        newCategories = [...prev, category];
        if (category === 'Other') {
          setOtherMarketplace('');
        }
      }
      
      setFormData(prevData => ({
        ...prevData,
        categories: newCategories
      }));
      
      return newCategories;
    });
  };

  const removeCategory = (categoryToRemove) => {
    setSelectedCategories(prev => {
      const newCategories = prev.filter(cat => cat !== categoryToRemove);
      if (categoryToRemove === 'Other') {
        setOtherMarketplace('');
      }
      
      setFormData(prevData => ({
        ...prevData,
        categories: newCategories
      }));
      
      return newCategories;
    });
  };

  // Helper function to detect Pinterest URLs
  const isPinterestUrl = (query) => {
    if (!query) return false;
    const pinterestPatterns = [
      /pinterest\.com/i,
      /pin\.it/i,
      /pinterest\./i
    ];
    return pinterestPatterns.some(pattern => pattern.test(query));
  };

  // // DISABLED - Search functionality (under construction)
  // const handleSearch = async (e) => {
  //   e.preventDefault();
  //   // Disabled until Etsy API is configured
  //   return;
  // };

  
  // Search functionality with SSE (Server-Sent Events) for progressive loading
  const handleSearch = async (e) => {
    e.preventDefault();
    console.log("🔍 Search initiated for:", searchQuery);
    console.log("🛒 Marketplace:", selectedMarketplace);

    if (!searchQuery.trim()) {
      alert("Please enter a search query or Pinterest URL.");
      return;
    }
    
    // Check if selected marketplace is available
    const marketplace = marketplaces.find(m => m.id === selectedMarketplace);
    if (!marketplace?.available) {
      alert(`${marketplace?.name || 'This marketplace'} is coming soon! Currently, only eBay is available.`);
      return;
    }

    // Detect search type early (Pinterest URL vs keyword search)
    const isPinterest = isPinterestUrl(searchQuery);
    const detectedSearchType = isPinterest ? 'pinterest' : 'keyword';
    console.log(`   Search type: ${detectedSearchType}`);

    // Reset all states
    setIsSearching(true);
    setSearchStep('');
    setSearchMessage('Starting search...');
    setPinterestImages(null);
    setAnalysisData(null);
    setProductsData(null);
    setProcessingTime(null);
    setBoardName('');
    setSearchType(detectedSearchType); // Set search type immediately
    setNoResultsMessage('');
    setEnrichmentProgress({ current: 0, total: 0 });
    setShowSearchResults(true);
    setEbayWidgetData(null); // Reset eBay widget data
    resetFilters(); // Reset all filters when new search starts
    
    // Auto-scroll to results section after a brief delay
    setTimeout(() => {
      scrollToSection(resultsRef);
    }, 100);
    
    // Initialize progress bar based on search type
    if (isPinterest) {
      // Pinterest flow: 3 segments
      setProgressData({ phase: 'pinterest', progress: 0, subStep: '', current: 0, total: 0 });
      setEstimatedTime(40); // Total estimated time in seconds (10+15+15)
      setSegmentTimes({
        pinterest: { startTime: Date.now(), endTime: null, elapsed: 0 },
        analysis: { startTime: null, endTime: null, elapsed: 0 },
        search: { startTime: null, endTime: null, elapsed: 0 }
      });
    } else {
      // Keyword search: 1 segment (search only)
      setProgressData({ phase: 'search', progress: 0, subStep: '', current: 0, total: 0 });
      setEstimatedTime(15); // Just search time
      setSegmentTimes({
        search: { startTime: Date.now(), endTime: null, elapsed: 0 }
      });
    }
    setSearchStartTime(Date.now());
    setElapsedTime(0);
    setDynamicSegmentWidths(null); // Reset dynamic widths for new search

    try {
      // Create EventSource for SSE
      const encodedQuery = encodeURIComponent(searchQuery);
      const eventSource = new EventSource(`${API_URL}/api/search/stream?query=${encodedQuery}&marketplace=${selectedMarketplace}`);
      
      eventSource.addEventListener('status', (event) => {
        const data = JSON.parse(event.data);
        console.log('📡 Status:', data);
        setSearchStep(data.step);
        setSearchMessage(data.message);
      });

      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        console.log('📊 Progress:', data);
        setProgressData({
          phase: data.phase,
          progress: data.progress,
          subStep: data.subStep || '',
          current: data.current || 0,
          total: data.total || 0
        });
      });
      
      eventSource.addEventListener('pinterest_images', (event) => {
        const data = JSON.parse(event.data);
        console.log('🖼️ Pinterest Images received:', data);
        setPinterestImages(data.images);
        setBoardName(data.board_name);
        setSearchType('pinterest');
      });
      
      eventSource.addEventListener('analysis', (event) => {
        const data = JSON.parse(event.data);
        console.log('🤖 Analysis received:', data);
        setAnalysisData(data);
      });
      
      // Handle basic products (without descriptions/scores)
      eventSource.addEventListener('products_basic', (event) => {
        const data = JSON.parse(event.data);
        console.log('🛍️ Basic Products received:', data);
        setProductsData(data.products);
        setEnrichmentProgress({ current: 0, total: data.total_products });
        
        // Capture eBay widget data if available
        if (data.ebay_widget) {
          console.log('🏷️ eBay Widget data received:', data.ebay_widget);
          setEbayWidgetData(data.ebay_widget);
        }
        
        // Handle no results message
        if (data.message) {
          setNoResultsMessage(data.message);
        }
      });
      
      // Handle legacy 'products' event (full products with descriptions/scores)
      eventSource.addEventListener('products', (event) => {
        const data = JSON.parse(event.data);
        console.log('🛍️ Products received (legacy):', data);
        setProductsData(data.products);
        
        if (data.message) {
          setNoResultsMessage(data.message);
        }
      });
      
      // Handle individual product description updates
      eventSource.addEventListener('product_description', (event) => {
        const data = JSON.parse(event.data);
        console.log(`📝 Description [${data.index}]:`, data.description?.substring(0, 50) + '...');
        
        setProductsData(prevProducts => {
          if (!prevProducts) return prevProducts;
          const updated = [...prevProducts];
          if (updated[data.index]) {
            updated[data.index] = {
              ...updated[data.index],
              description: data.description
            };
          }
          return updated;
        });
      });
      
      // Handle individual product score updates
      eventSource.addEventListener('product_score', (event) => {
        const data = JSON.parse(event.data);
        console.log(`📊 Score [${data.index}]:`, data.match_score);
        
        setProductsData(prevProducts => {
          if (!prevProducts) return prevProducts;
          const updated = [...prevProducts];
          if (updated[data.index]) {
            updated[data.index] = {
              ...updated[data.index],
              match_score: data.match_score,
              score_breakdown: data.score_breakdown
            };
          }
          return updated;
        });
        
        // Update enrichment progress
        setEnrichmentProgress(prev => ({
          ...prev,
          current: prev.current + 1
        }));
      });
      
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        console.log('✅ Search complete:', data);
        setProcessingTime(data.processing_time);
        setSearchType(data.searchType);
        setIsSearching(false);
        setSearchStep('');
        setSearchMessage('');
        // Set progress to complete
        setProgressData({ phase: 'complete', progress: 100, subStep: '', current: 0, total: 0 });
        eventSource.close();
      });
      
      eventSource.addEventListener('error', (event) => {
        if (event.data) {
          const data = JSON.parse(event.data);
          console.error('❌ Search error:', data);
          alert(data.message || 'An error occurred during search.');
        }
        setIsSearching(false);
        eventSource.close();
      });
      
      // Handle connection errors
      eventSource.onerror = (error) => {
        console.error('❌ SSE Connection error:', error);
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('SSE connection closed');
        } else {
          alert('Connection error. Please try again.');
          setIsSearching(false);
        }
        eventSource.close();
      };
      
    } catch (error) {
      console.error("❌ Search error:", error);
      alert("An unexpected error occurred during search.");
      setIsSearching(false);
    }
  };

  const saveToDatabase = async (data) => {
    try {
      console.log('💾 Saving to database...');
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          categories: data.categories || []
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          return { success: false, duplicate: true };
        }
        throw new Error(result.message || 'Database error');
      }

      console.log('✅ Database save successful');
      return { success: true, duplicate: false };
    } catch (error) {
      console.error('❌ Database error:', error);
      return { success: false, error: error.message };
    }
  };

  const sendEmail = async (data) => {
    try {
      console.log('📧 Sending email...');
      
      const serviceID = 'service_bu2wks4';
      const templateID = 'template_27up41k';
      const publicKey = 'RePsWz0YaYvq-ZsRU';

      const templateParams = {
        to_name: 'MoodScout Team',
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        reason: data.reason,
        category: Array.isArray(data.categories) ? data.categories.join(', ') : data.categories || 'None selected',
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceID,
          template_id: templateID,
          user_id: publicKey,
          template_params: templateParams,
        }),
      });

      if (response.ok) {
        console.log('✅ Email sent successfully');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Email failed:', errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      alert('Please select at least one marketplace');
      return;
    }

    if (selectedCategories.includes('Other') && !otherMarketplace.trim()) {
      alert('Please add the marketplace name for "Other".');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const cleanedData = {
        ...formData,
        phone: formData.phone?.trim() || 'N/A',
        categories: formData.categories
      };

      const dbResult = await saveToDatabase(cleanedData);
      
      if (dbResult.duplicate) {
        setSubmitStatus('duplicate');
        setIsSubmitting(false);
        return;
      }

      if (!dbResult.success) {
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      const emailResult = await sendEmail(cleanedData);
      
      if (!emailResult.success) {
        console.warn('⚠️ Email failed but data was saved to database');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', reason: '', categories: [] });
      setSelectedCategories([]);
      setOtherMarketplace('');
      
      setTimeout(() => {
        setShowModal(false);
        setSubmitStatus(null);
      }, 2500);

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "AI-Powered Discovery",
      description: "Advanced vision models analyze your Pinterest boards to understand your style and preferences"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Smart Matching",
      description: "Sophisticated similarity scoring finds eBay products that perfectly match your aesthetic"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Curated Results",
      description: "Ranked by relevance, discover amazing deals that align with your vision"
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="MoodScout Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              MoodScout
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-gray-200 text-gray-800 px-6 py-2.5 rounded-full font-medium border border-gray-300 hover:bg-gray-300 hover:text-gray-900 transition-all duration-300 shadow-sm"
            >
              Share Feedback
            </button>
          </div>
        </div>
      </nav>

      {/* Waitlist Modal - Keep existing code */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative my-8">
            <button
              onClick={() => {
                setShowModal(false);
                setSubmitStatus(null);
                setSelectedCategories([]);
                setOtherMarketplace('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Thanks for your feedback! 🎉</h3>
                <p className="text-gray-600">We'll use it to make MoodScout better.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Help Improve MoodScout</h3>
                  <p className="text-gray-600">Your feedback helps us make MoodScout better before launch.</p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-gray-500">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marketplaces You'd Like to See <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 ml-2">(Select multiple)</span>
                    </label>
                    
                    {selectedCategories.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {selectedCategories.map((category, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                          >
                            {category}
                            <button
                              type="button"
                              onClick={() => removeCategory(category)}
                              className="text-purple-600 hover:text-purple-800 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-xl">
                      {marketplaceOptions.map((category, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleCategoryToggle(category)}
                          className={`p-3 text-left rounded-lg border transition-all ${
                            selectedCategories.includes(category)
                              ? 'bg-purple-50 border-purple-500 text-purple-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{category}</span>
                            {selectedCategories.includes(category) && (
                              <CheckCircle className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {selectedCategories.includes('Other') && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Add your marketplace name
                        </label>
                        <input
                          type="text"
                          value={otherMarketplace}
                          onChange={(e) => setOtherMarketplace(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                          placeholder="Enter the marketplace you'd like to see"
                        />
                      </div>
                    )}
                    
                    {selectedCategories.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Please select at least one marketplace</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback / Ideas / Issues <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows="4"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Tell us what you like, what's missing, or what to fix before launch..."
                      />
                    </div>
                  </div>

                  {submitStatus === 'error' && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <strong>Something went wrong.</strong> Please try again.
                      </div>
                    </div>
                  )}

                  {submitStatus === 'duplicate' && (
                    <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl text-sm flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <div>
                        <strong>This email is already on the waitlist!</strong> We'll notify you when we launch.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.name || !formData.email || selectedCategories.length === 0 || !formData.reason || (selectedCategories.includes('Other') && !otherMarketplace.trim())}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Feedback
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  We respect your privacy. Your feedback is used only to improve the product.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 overflow-hidden">
            <button
              onClick={() => {
                setShowArticleModal(false);
                setSelectedArticle(null);
              }}
              className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-gray-900 transition-colors rounded-full p-2 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Article Header Image */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img 
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block bg-purple-500 text-white text-xs px-3 py-1 rounded-full mb-3">
                  {selectedArticle.category}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  {selectedArticle.title}
                </h2>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{selectedArticle.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedArticle.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{selectedArticle.readTime}</span>
                </div>
              </div>

              {/* Article Body */}
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  {selectedArticle.content}
                </p>
              </div>

              {/* Article Tags */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal */}
      {showArticleModal && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 overflow-hidden">
            <button
              onClick={() => {
                setShowArticleModal(false);
                setSelectedArticle(null);
              }}
              className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-gray-600 hover:text-gray-900 transition-colors rounded-full p-2 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Article Header Image */}
            <div className="relative h-64 md:h-80 overflow-hidden">
              <img 
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="inline-block bg-purple-500 text-white text-xs px-3 py-1 rounded-full mb-3">
                  {selectedArticle.category}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  {selectedArticle.title}
                </h2>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {/* Article Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{selectedArticle.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedArticle.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{selectedArticle.readTime}</span>
                </div>
              </div>

              {/* Article Body */}
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  {selectedArticle.content}
                </p>
              </div>

              {/* Article Tags */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Search - UNDER CONSTRUCTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-pink-50/30 to-white -z-10"></div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse -z-10"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse -z-10" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-purple-200 rounded-full px-6 py-2 mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Product Discovery</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent"> Pinterest Dreams</span>
              <br />Into Reality
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover perfectly matched eBay products from your Pinterest boards. 
              Let AI understand your style and find the treasures you'll love.
            </p>

            {/* Google-style Search Bar - UNDER CONSTRUCTION */}
            <div className="max-w-2xl mx-auto mb-8 relative">
              {/* Under Construction Badge */}
              {/* <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                  <Wrench className="w-4 h-4" />
                  <span>Coming Soon</span>
                </div>
              </div> */}

              <form onSubmit={handleSearch} className="relative z-20">
                {/* Info message */}
                <p className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Paste your Pinterest board URL to find products that match your board's aesthetic.
                </p>

                <div className="relative group">
                  {/* Marketplace Selector Dropdown - Left Side (HIDDEN FOR NOW - will be unhidden in future) */}
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 marketplace-dropdown hidden">
                    <button
                      type="button"
                      onClick={() => setShowMarketplaceDropdown(!showMarketplaceDropdown)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <img 
                        src={marketplaces.find(m => m.id === selectedMarketplace)?.logo} 
                        alt={marketplaces.find(m => m.id === selectedMarketplace)?.name}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-sm font-semibold text-gray-700">{marketplaces.find(m => m.id === selectedMarketplace)?.name}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showMarketplaceDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showMarketplaceDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
                        <div className="p-2">
                          {marketplaces.map((marketplace) => (
                            <button
                              key={marketplace.id}
                              type="button"
                              onClick={() => {
                                if (marketplace.available) {
                                  setSelectedMarketplace(marketplace.id);
                                  setShowMarketplaceDropdown(false);
                                }
                              }}
                              disabled={!marketplace.available}
                              className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                ${
                                  marketplace.available
                                    ? selectedMarketplace === marketplace.id
                                      ? `bg-gradient-to-r ${marketplace.color} text-white shadow-md`
                                      : 'hover:bg-gray-50 text-gray-700'
                                    : 'opacity-50 cursor-not-allowed'
                                }
                              `}
                            >
                              <img 
                                src={marketplace.logo} 
                                alt={marketplace.name}
                                className="w-8 h-8 object-contain flex-shrink-0"
                              />
                              <div className="flex-1 text-left">
                                <div className="font-semibold flex items-center gap-2">
                                  {marketplace.name}
                                  {!marketplace.available && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Soon</span>
                                  )}
                                </div>
                                <div className={`text-xs ${
                                  selectedMarketplace === marketplace.id && marketplace.available
                                    ? 'text-white/80'
                                    : 'text-gray-500'
                                }`}>
                                  {marketplace.description}
                                </div>
                              </div>
                              {selectedMarketplace === marketplace.id && marketplace.available && (
                                <CheckCircle className="w-5 h-5" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Icon (decorative) - Hidden when there's content, Clear Icon shown instead */}
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors z-10"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  ) : (
                    <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  )}
                  
                  {/* Search Input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="https://www.pinterest.com/username/board-name/"
                    className="w-full pl-6 pr-14 py-5 text-lg border-2 border-gray-200 rounded-full outline-none transition-all shadow-lg bg-gray-50 focus:border-purple-300 focus:shadow-xl"
                  />
                </div>
                <div className="flex gap-3 justify-center mt-6">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Search Marketplace(s)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="bg-gray-200 text-gray-800 px-8 py-3 rounded-full font-medium border border-gray-300 hover:bg-gray-300 hover:text-gray-900 transition-all duration-300 shadow-sm"
                  >
                    Share Feedback
                  </button>
                </div>
              </form>

              {/* Marketplace Options Info */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* eBay - Active */}
                <div className="flex items-center gap-3 bg-white border-2 border-blue-200 rounded-full px-5 py-2.5 shadow-sm">
                  <img 
                    src={ebayLogo} 
                    alt="eBay"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-700">Searching eBay</span>
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                
                {/* More Marketplaces - Coming Soon */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5">
                  <div className="flex -space-x-2">
                    <img src={amazonLogo} alt="Amazon" className="w-5 h-5 object-contain opacity-50" />
                    <img src={targetLogo} alt="Target" className="w-5 h-5 object-contain opacity-50" />
                    <img src={walmartLogo} alt="Walmart" className="w-5 h-5 object-contain opacity-50" />
                  </div>
                  <span className="text-sm text-gray-500">More marketplaces coming soon</span>
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Search Results Section - Progressive Loading with SSE */}
      {showSearchResults && (
        <section ref={resultsRef} className="py-12 px-6 bg-gradient-to-b from-purple-50 to-white">
          <div className="max-w-7xl mx-auto">
            
            {/* Interactive Segmented Progress Tracker */}
            {showProgressBar && (
              <div className="max-w-3xl mx-auto mb-10">
                <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
                  {/* Header with Elapsed Time */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${progressData.phase === 'complete' ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`}></div>
                      <span className="text-gray-700 font-medium">
                        {progressData.phase === 'complete' ? 'Completed' : 'Processing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium text-purple-600">{elapsedTime}s</span> elapsed
                      </span>
                      {progressData.phase !== 'complete' && (
                        <span className="text-gray-500">
                          ~{Math.max(0, estimatedTime - elapsedTime)}s left
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Segmented Progress Bar */}
                  <div className="flex items-stretch h-14 rounded-full overflow-hidden bg-gray-100 mb-4 shadow-inner">
                    {segments.map((segment, index) => {
                      const status = getSegmentStatus(index);
                      const segmentTime = segmentTimes[segment.id];
                      const isComplete = status === 'completed' || progressData.phase === 'complete';
                      const isActive = status === 'active' && progressData.phase !== 'complete';
                      const isPending = status === 'pending';
                      const isClickable = progressData.phase === 'complete';
                      
                      // Use dynamic width after completion, otherwise use default
                      const segmentWidth = dynamicSegmentWidths && progressData.phase === 'complete'
                        ? dynamicSegmentWidths[segment.id]
                        : segment.widthPercent;
                      
                      return (
                        <div
                          key={segment.id}
                          onClick={() => isClickable && handleSegmentClick(segment.id)}
                          role={isClickable ? 'button' : undefined}
                          tabIndex={isClickable ? 0 : undefined}
                          onKeyDown={(e) => isClickable && e.key === 'Enter' && handleSegmentClick(segment.id)}
                          className={`relative flex flex-col items-center justify-center transition-all duration-500 ${
                            index < segments.length - 1 ? 'border-r-2 border-white/50' : ''
                          } ${
                            isComplete 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                              : isActive 
                                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-gradient-x text-white' 
                                : 'bg-gray-200 text-gray-400'
                          } ${isClickable ? 'cursor-pointer hover:brightness-110 hover:scale-[1.02] active:scale-100' : ''}`}
                          style={{ width: `${segmentWidth}%` }}
                          title={isClickable ? `Click to navigate to ${segment.name}` : undefined}
                        >
                          {/* Pulsing overlay for active segment */}
                          {isActive && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-inherit"></div>
                          )}
                          
                          {/* Segment Content */}
                          <div className="relative z-10 flex flex-col items-center px-2">
                            {/* Segment Name */}
                            <span className={`font-semibold text-xs sm:text-sm truncate max-w-full ${
                              isComplete ? 'text-white' : isActive ? 'text-white' : 'text-gray-500'
                            }`}>
                              {segment.name}
                            </span>
                            
                            {/* Time Display */}
                            <span className={`text-[10px] sm:text-xs mt-0.5 ${
                              isComplete ? 'text-green-100' : isActive ? 'text-purple-100' : 'text-gray-400'
                            }`}>
                              {isComplete && segmentTime?.elapsed > 0 
                                ? `${segmentTime.elapsed}s ✓`
                                : isActive && segmentTime?.elapsed > 0
                                  ? `${segmentTime.elapsed}s`
                                  : `~${segment.estimatedDuration}s`
                              }
                            </span>
                          </div>
                          
                          {/* Completion checkmark for completed segments */}
                          {isComplete && (
                            <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Status Message */}
                  <div className="text-center">
                    <p className={`font-semibold mb-1 ${
                      progressData.phase === 'complete' ? 'text-green-600' : 'text-purple-700'
                    }`}>
                      {progressData.phase === 'complete' 
                        ? phaseMessages.complete
                        : phaseMessages[segments[getCurrentSegmentIndex()]?.id] || 'Processing...'
                      }
                    </p>
                    
                    {/* Motivational Message */}
                    {progressData.phase !== 'complete' && (
                      <p className="text-gray-500 text-sm italic animate-fade-in-out">
                        {motivationalMessage}
                      </p>
                    )}
                    
                    {/* Completion Summary */}
                    {progressData.phase === 'complete' && (
                      <p className="text-gray-500 text-sm">
                        Total time: <span className="font-medium text-purple-600">{elapsedTime}s</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Results Header - Shows when we have any data */}
            {(pinterestImages || productsData) && (
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Search Results
                </h2>
                <p className="text-gray-600">
                  {searchType === 'pinterest' && boardName && (
                    <>Board: <span className="font-semibold">{boardName}</span> | </>
                  )}
                  {pinterestImages && <>{pinterestImages.length} images</>}
                  {processingTime && <> • Completed in {processingTime}s</>}
                </p>
              </div>
            )}

            {/* Row 1: Pinterest Board Images Gallery - Shows immediately when available */}
            {pinterestImages && pinterestImages.length > 0 && (
            <div ref={pinterestSectionRef} className="mb-12 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Pinterest Board Images</h3>
                <span className="ml-auto text-gray-500 text-sm">{pinterestImages.length} images</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {pinterestImages.map((image, index) => (
                  <div 
                    key={`pinterest-${index}`}
                    className="relative group aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <img 
                      src={image.url || `${API_URL}${image.localUrl}` || `https://via.placeholder.com/300x300?text=Image+${index + 1}`}
                      alt={`Pinterest ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/300x300?text=Image+${index + 1}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white text-sm font-medium truncate">Image {image.index || index + 1}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Loading placeholder for analysis */}
            {isSearching && searchStep === 'analysis' && !analysisData && (
              <div className="mb-12 animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="h-8 w-48 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                  <div className="h-24 bg-gray-100 rounded"></div>
                </div>
              </div>
            )}

            {/* Row 2: Unified AI Analysis & Keywords - Shows when analysis is complete */}
            {analysisData && (
            <div ref={analysisSectionRef} className="mb-12 animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">AI Analysis</h3>
                {analysisData.model_used && (
                  <span className="ml-auto text-xs text-gray-400">Model: {analysisData.model_used}</span>
                )}
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Category, Theme, Summary */}
                  <div>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-semibold">
                        {analysisData.category}
                      </span>
                      <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full font-semibold">
                        {analysisData.theme}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {analysisData.summary}
                    </p>
                  </div>
                  
                  {/* Right: Clickable Keywords (Contents) + Colors */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Keywords & Colors
                      {/* {selectedKeywordFilters.length > 0 && ( */}
                        <span className="ml-2 text-xs font-normal text-purple-600">
                          (Click to filter products)
                        </span>
                      {/* )} */}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {/* Clickable keyword filter badges */}
                      <KeywordFilterBadges
                        keywords={availableKeywords}
                        selectedKeywords={selectedKeywordFilters}
                        onKeywordToggle={handleKeywordFilterToggle}
                        onClearAll={handleClearKeywordFilters}
                      />
                    </div>
                    {/* Color palette badges (non-clickable) */}
                    {analysisData.color_palette && analysisData.color_palette.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        {analysisData.color_palette.map((color, idx) => (
                          <span 
                            key={`color-${idx}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-sm rounded-full"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Scoring System Explanation Section */}
            {analysisData && (
              <div className="mb-12 animate-fadeIn">
                {/* Header - Clickable Toggle */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full px-6 py-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">Match Scoring System</span>
                  </div>
                  <button 
                    onClick={() => setIsScoringExpanded(!isScoringExpanded)}
                    className="group flex items-center justify-center gap-3 mx-auto hover:opacity-80 transition-opacity"
                  >
                    <h3 className="text-3xl font-bold text-gray-800">What Do These Scores Mean?</h3>
                    <ChevronDown className={`w-6 h-6 text-purple-500 transition-transform duration-300 ${isScoringExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed mt-3">
                    Every product gets a <strong>Match Score (0-100%)</strong> based on how well it aligns with your Pinterest aesthetic. 
                    {!isScoringExpanded && <span className="text-purple-600 ml-1 cursor-pointer hover:underline" onClick={() => setIsScoringExpanded(true)}>Click to learn more...</span>}
                  </p>
                </div>
                
                {/* Collapsible Content */}
                {isScoringExpanded && (
                <>
                  {/* Expanded intro text */}
                  <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed text-center mb-8">
                    We analyze four key dimensions and weight them to prioritize what matters most: getting the <em>right item</em> with the <em>right vibe</em>.
                  </p>

                {/* Scoring Breakdown Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {/* Content Match Card */}
                  <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <span className="text-xl font-bold text-blue-600">C</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-1">Content Match</h4>
                        <span className="inline-block text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                          35% Weight (Highest Priority)
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      Checks if the product contains the actual <strong>objects, materials, and features</strong> you're looking for. 
                      We compare your Pinterest keywords against eBay's Item Specifics (Material, Type, Style) and product descriptions.
                    </p>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm font-semibold text-blue-800 mb-2">Example:</p>
                      <p className="text-sm text-gray-700">
                        Your board has "oak wood", "handmade", "rustic table" → Product with <strong>Material: Oak</strong>, 
                        <strong>Type: Handmade</strong>, <strong>Style: Rustic</strong> = High content score ✅
                      </p>
                    </div>
                  </div>

                  {/* Color Match Card */}
                  <div className="bg-white rounded-2xl shadow-md border border-green-100 p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                          <span className="text-xl font-bold text-green-600">L</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-1">Color Match</h4>
                        <span className="inline-block text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full font-semibold">
                          25% Weight
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      Ensures the product's <strong>color palette</strong> matches your board's aesthetic. 
                      We check eBay's Color attribute and understand synonyms (e.g., "Burgundy" matches "Red").
                    </p>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <p className="text-sm font-semibold text-green-800 mb-2">Example:</p>
                      <p className="text-sm text-gray-700">
                        Your board palette: "Navy", "Gold", "Cream" → Product with <strong>Color: Navy Blue</strong> or 
                        gold accents in description = High color score 🎨
                      </p>
                    </div>
                  </div>

                  {/* Category Match Card */}
                  <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-600">Cat</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-1">Category Match</h4>
                        <span className="inline-block text-sm bg-orange-50 text-orange-700 px-3 py-1 rounded-full font-semibold">
                          25% Weight
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      Verifies the product <strong>type is correct</strong> based on your board's focus. 
                      We match against eBay's category hierarchy (e.g., "Home & Garden → Kitchen → Cookware").
                    </p>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <p className="text-sm font-semibold text-orange-800 mb-2">Example:</p>
                      <p className="text-sm text-gray-700">
                        Your board focuses on "Home Decor" → Product in <strong>Home & Garden → Decor</strong> 
                        category = High category score 🏠
                      </p>
                    </div>
                  </div>

                  {/* Theme Match Card */}
                  <div className="bg-white rounded-2xl shadow-md border border-amber-100 p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                          <span className="text-xl font-bold text-amber-600">T</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-800 mb-1">Theme Match</h4>
                        <span className="inline-block text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold">
                          15% Weight
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      Captures the <strong>aesthetic mood and style</strong> of your collection. 
                      We check Theme, Genre, Franchise, and Character fields to match the overall vibe.
                    </p>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-sm font-semibold text-amber-800 mb-2">Example:</p>
                      <p className="text-sm text-gray-700">
                        Your board has "Harry Potter" theme → Product with <strong>Franchise: Harry Potter</strong> or 
                        <strong>Character: Hogwarts</strong> = High theme score ✨
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Footer */}
                <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 max-w-3xl mx-auto">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-bold text-gray-800 mb-2">How We Calculate Final Scores</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <strong>Final Match Score</strong> = (Content × 0.35) + (Color × 0.25) + (Category × 0.25) + (Theme × 0.15). 
                        We prioritize <strong>Content + Category (60%)</strong> to ensure you get the <em>right product type</em>, 
                        then add <strong>Color + Theme (40%)</strong> for the perfect <em>aesthetic match</em>. 
                        Our AI checks official eBay Item Specifics first, falling back to smart text analysis when needed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collapse Button */}
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => {
                      setIsScoringExpanded(false);
                      // Scroll to matched products section after collapsing
                      setTimeout(() => {
                        scrollToSection(productsSectionRef);
                      }, 100);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-purple-200 rounded-full text-purple-600 font-medium hover:bg-purple-50 transition-colors shadow-sm"
                  >
                    <ChevronDown className="w-4 h-4 rotate-180" />
                    Hide Scoring Details
                  </button>
                </div>
                </>
                )}
              </div>
            )}

            {/* Loading placeholder for products */}
            {isSearching && searchStep === 'products' && !productsData && (
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div className="h-8 w-48 bg-gray-200 rounded"></div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden">
                      <div className="aspect-square bg-gray-100"></div>
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 3: Matched Products - Shows when products are available */}
            {productsData && productsData.length > 0 && (
            <div ref={productsSectionRef} className="animate-fadeIn">
              {/* Header with Category Dropdown */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Matched Products from eBay</h3>
                
                {/* Category Filter Dropdown and Sort Dropdown - centered */}
                <div className="flex-1 flex justify-center items-center gap-3">
                  <CategoryDropdown
                    products={productsData}
                    selectedCategories={selectedCategoryFilters}
                    onCategoryToggle={handleCategoryFilterToggle}
                    onClearCategories={handleClearCategoryFilters}
                  />
                  <SortDropdown />
                </div>
                
                {/* Dynamic product count */}
                <span className="text-gray-500 text-sm">
                  {filteredProducts.length === productsData.length 
                    ? `${productsData.length} products found`
                    : `${filteredProducts.length} of ${productsData.length} products`
                  }
                </span>
              </div>
              
              {/* Active Filters Summary */}
              {(selectedKeywordFilters.length > 0 || selectedCategoryFilters.length > 0) && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Active Filters:</span>
                    {selectedKeywordFilters.map((kw, idx) => (
                      <span 
                        key={`active-kw-${idx}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full"
                      >
                        <Tag className="w-3 h-3" />
                        {kw}
                        <button 
                          onClick={() => handleKeywordFilterToggle(kw)}
                          className="hover:text-purple-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {selectedCategoryFilters.map((cat, idx) => (
                      <span 
                        key={`active-cat-${idx}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-pink-200 text-pink-800 text-xs rounded-full"
                      >
                        {cat.split(' > ').pop()}
                        <button 
                          onClick={() => handleCategoryFilterToggle(cat)}
                          className="hover:text-pink-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => { handleClearKeywordFilters(); handleClearCategoryFilters(); }}
                      className="ml-2 text-xs text-purple-600 hover:text-purple-800 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
              
              {/* ============================================================================
                  eBay Partner Network Widget - COMMENTED OUT (No Campaign ID yet)
                  Uncomment when you have your eBay Partner Network Campaign ID
                  ============================================================================ */}
              {/*
              {ebayWidgetData && (
                <div className="mb-8 p-6 bg-white rounded-2xl shadow-md border border-gray-100">
                  <div className="text-center mb-4">
                    <p className="text-gray-600 text-sm mb-2">Browse these curated eBay listings:</p>
                    <a 
                      href={ebayWidgetData.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      View All on eBay
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  
                  <div id="ebay-widget-container" className="min-h-[400px] bg-gray-50 rounded-xl p-4 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="font-medium mb-2">eBay Partner Network Widget</p>
                      <p className="text-sm">Configure your Campaign ID in .env to enable the widget</p>
                      <p className="text-xs mt-2 text-gray-400">Item IDs: {ebayWidgetData.itemIds?.slice(0, 5).join(', ')}...</p>
                    </div>
                  </div>
                </div>
              )}
              */}
              
              {/* No results after filtering */}
              {filteredProducts.length === 0 && (selectedKeywordFilters.length > 0 || selectedCategoryFilters.length > 0) && (
                <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <Filter className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Match Your Filters</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-4">
                    Try adjusting your keyword or category filters to see more results.
                  </p>
                  <button
                    onClick={() => { handleClearKeywordFilters(); handleClearCategoryFilters(); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </button>
                </div>
              )}
              
              {/* Custom Product Cards - Display filtered eBay results */}
              {filteredProducts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product, index) => {
                  const productId = product.id || product.url || `product-${index}`;
                  const isExpanded = expandedCards.has(productId);
                  const isLoading = loadingRelevance.has(productId);
                  const explanation = relevanceExplanations[productId];
                  
                  return (
                    <div
                      key={`product-${productId}`}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 flex flex-col"
                    >
                      {/* Product Image with Description Hover */}
                      <a
                        href={product.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="aspect-square relative overflow-hidden bg-gray-100">
                        <img 
                          src={product.image || NO_IMAGE_PLACEHOLDER}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = NO_IMAGE_PLACEHOLDER;
                          }}
                        />
                        {product.match_score != null && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                            <TrendingUp className="w-3 h-3 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-600">{product.match_score.toFixed(1)}%</span>
                          </div>
                        )}
                        {/* Condition badge for eBay products */}
                        {product.condition && (
                          <div className="absolute top-3 left-3 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full z-10">
                            {product.condition}
                          </div>
                        )}
                        {/* Hover Popover for Description */}
                        {product.description && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end pointer-events-none">
                            <div className="p-4 text-white w-full">
                              <p className="text-sm leading-relaxed line-clamp-4">{product.description}</p>
                            </div>
                          </div>
                        )}
                        </div>
                      </a>
                      
                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Product Name */}
                        <a
                          href={product.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h4 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-purple-600 transition-colors mb-1">
                            {product.name || 'Untitled Product'}
                          </h4>
                        </a>
                        
                        {product.price && (
                          <p className="text-lg font-bold text-green-600 mb-2">{product.price}</p>
                        )}
                        
                        {/* Seller info for eBay */}
                        {product.seller && (
                          <p className="text-xs text-gray-500 mb-2">Seller: {product.seller}</p>
                        )}
                        
                        {/* Score Breakdown */}
                        {product.score_breakdown && searchType === 'pinterest' && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded" title="Content match">C:{product.score_breakdown.content}</span>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded" title="Color match">L:{product.score_breakdown.color}</span>
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded" title="Category match">Cat:{product.score_breakdown.category}</span>
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded" title="Theme match">T:{product.score_breakdown.theme}</span>
                          </div>
                        )}
                        
                        {/* External link indicator */}
                        <a
                          href={product.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-3 text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View on eBay</span>
                        </a>
                        
                        {/* Why is this relevant? Button - Glass Morphism Style */}
                        <button
                          onClick={(e) => handleRelevanceClick(e, product, index)}
                          disabled={isLoading}
                          className={`
                            mt-4 w-full py-2.5 px-4 rounded-xl transition-all duration-300
                            backdrop-blur-md border border-white/20
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${isExpanded 
                              ? 'bg-gradient-to-br from-purple-50/80 to-pink-50/80 text-purple-700 shadow-lg shadow-purple-200/50' 
                              : 'bg-gradient-to-br from-white/60 to-white/40 text-gray-700 hover:from-purple-50/60 hover:to-pink-50/60 hover:text-purple-700 hover:shadow-md hover:shadow-purple-200/30'
                            }
                            ${isLoading ? 'cursor-wait' : ''}
                          `}
                          style={{
                            backdropFilter: 'blur(12px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                            boxShadow: isExpanded 
                              ? '0 8px 32px 0 rgba(168, 85, 247, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)' 
                              : '0 4px 16px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                          }}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2 text-sm font-medium">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </span>
                          ) : isExpanded ? (
                            <span className="flex items-center justify-center gap-2 text-sm font-medium">
                              <Sparkles className="w-4 h-4" />
                              Hide explanation
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2 text-sm font-medium">
                              <Sparkles className="w-4 h-4" />
                              Why is this relevant?
                            </span>
                          )}
                        </button>
                        
                        {/* Expanded Explanation Section - Smooth Animation */}
                        {isExpanded && explanation && (
                          <div 
                            className="mt-4 pt-4 border-t border-gray-200/50 animate-fadeIn overflow-hidden"
                            style={{
                              animation: 'fadeInDown 0.4s ease-out'
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100/80 to-pink-100/80 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-sm">
                                  <Sparkles className="w-4 h-4 text-purple-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-gray-800 mb-2">AI Explanation</h5>
                                <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
            )}

            {/* No Products Found - with custom message */}
            {!isSearching && productsData && productsData.length === 0 && (
              <div className="animate-fadeIn text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {noResultsMessage || 'No matching products found. Try a different search or Pinterest board.'}
                </p>
              </div>
            )}

            {/* Initial state - no results yet and not searching */}
            {!isSearching && !pinterestImages && !productsData && (
              <div className="text-center py-10">
                <p className="text-gray-500">Enter a Pinterest URL or search keyword to find matching products.</p>
              </div>
            )}

          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="how" className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and magical</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Share Your Board", desc: "Paste your Pinterest board URL and let us access your inspiration", icon: <Heart /> },
              { step: "02", title: "AI Analysis", desc: "Our vision models extract style, color, and aesthetic patterns", icon: <Zap /> },
              { step: "03", title: "Discover Products", desc: "Get ranked eBay results matching your exact taste", icon: <TrendingUp /> }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <div className="text-purple-600">
                      {item.icon}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-purple-500 mb-3">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-purple-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need for perfect product discovery</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog/Articles Section */}
      <section id="blog" className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Latest Articles</h2>
            <p className="text-xl text-gray-600">Tips, tricks, and insights for smarter eBay shopping</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {articles.map((article) => (
              <article 
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 cursor-pointer"
              >
                {/* Article Image */}
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  <img 
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6">
                  {/* Article Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{article.date}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>

                  {/* Article Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Article Excerpt */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <button
              onClick={() => {/* Will link to blog page in future */}}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              View All Articles
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Find Your Perfect Match?</h2>
              <p className="text-xl mb-8 text-purple-100">Join thousands discovering their dream products every day</p>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-white/80 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg border border-white/60 hover:bg-white/70 transition-all duration-300 inline-flex items-center gap-2 shadow-sm"
              >
                Share Feedback
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="MoodScout Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold">MoodScout</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 MoodScout. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
