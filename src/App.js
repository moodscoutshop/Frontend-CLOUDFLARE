import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowRight, Sparkles, Search, ShoppingBag, Heart, TrendingUp, Zap, X, Mail, User, CheckCircle, Phone, MessageSquare, Tag, ExternalLink, Loader2, AlertCircle, Calendar, Clock, Filter } from 'lucide-react';
// import logo from './assets/logo.svg';
import logo from './assets/logo.svg';
import { KeywordFilterBadges, CategoryDropdown, filterProducts, getUniqueKeywords } from './components/ProductFilters';


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
  const [estimatedTime, setEstimatedTime] = useState(68); // Total estimated time (~15+13+40)
  const [searchStartTime, setSearchStartTime] = useState(null);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showProgressBar, setShowProgressBar] = useState(false); // Control progress bar visibility
  
  // Segment timing states
  const [segmentTimes, setSegmentTimes] = useState({
    pinterest: { startTime: null, endTime: null, elapsed: 0 },
    analysis: { startTime: null, endTime: null, elapsed: 0 },
    search: { startTime: null, endTime: null, elapsed: 0 }
  });
  
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

  // API URL - UPDATED FOR PRODUCTION
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const ebayCategories = [
    "Art & Collectibles",
    "Bags & Purses",
    "Bath & Beauty",
    "Books, Movies & Music",
    "Clothing",
    "Craft Supplies & Tools",
    "Electronics & Accessories",
    "Home & Living",
    "Jewelry",
    "Paper & Party Supplies",
    "Pet Supplies",
    "Shoes",
    "Toys & Games",
    "Weddings",
    "Other"
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
    return filterProducts(productsData, selectedKeywordFilters, selectedCategoryFilters);
  }, [productsData, selectedKeywordFilters, selectedCategoryFilters]);

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
  }, []);

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
      "Almost there, quality takes time... ⏳"
    ]
  };

  // Segment configuration: name, estimated duration, width percentage
  const segments = [
    { id: 'pinterest', name: 'Pinterest', estimatedDuration: 15, widthPercent: 22 },
    { id: 'analysis', name: 'AI Analysis', estimatedDuration: 13, widthPercent: 19 },
    { id: 'search', name: 'Search', estimatedDuration: 40, widthPercent: 59 }
  ];

  // Get current segment index
  const getCurrentSegmentIndex = () => {
    const phase = progressData.phase;
    if (phase === 'pinterest' || phase === 'grid') return 0;
    if (phase === 'analysis') return 1;
    if (phase === 'products' || phase === 'enriching' || phase === 'search') return 2;
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
        
        // Update current segment elapsed time
        const currentSegmentId = segments[getCurrentSegmentIndex()]?.id;
        if (currentSegmentId && segmentTimes[currentSegmentId]?.startTime && !segmentTimes[currentSegmentId]?.endTime) {
          setSegmentTimes(prev => ({
            ...prev,
            [currentSegmentId]: {
              ...prev[currentSegmentId],
              elapsed: Math.floor((Date.now() - prev[currentSegmentId].startTime) / 1000)
            }
          }));
        }
        
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
    else if (phase === 'products' || phase === 'enriching' || phase === 'search') segmentId = 'search';
    
    if (segmentId && segmentTimes[segmentId] && !segmentTimes[segmentId].startTime) {
      // Start this segment
      setSegmentTimes(prev => ({
        ...prev,
        [segmentId]: { ...prev[segmentId], startTime: Date.now(), elapsed: 0 }
      }));
      
      // End previous segment
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
  }, [progressData.phase]);

  // Mark all segments complete when done
  useEffect(() => {
    if (progressData.phase === 'complete') {
      setSegmentTimes(prev => {
        const updated = { ...prev };
        ['pinterest', 'analysis', 'search'].forEach(id => {
          if (updated[id]?.startTime && !updated[id]?.endTime) {
            updated[id] = {
              ...updated[id],
              endTime: Date.now(),
              elapsed: Math.floor((Date.now() - updated[id].startTime) / 1000)
            };
          }
        });
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

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showModal]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      let newCategories;
      
      if (isSelected) {
        newCategories = prev.filter(cat => cat !== category);
      } else {
        newCategories = [...prev, category];
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
      
      setFormData(prevData => ({
        ...prevData,
        categories: newCategories
      }));
      
      return newCategories;
    });
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

    if (!searchQuery.trim()) {
      alert("Please enter a search query or Pinterest URL.");
      return;
    }

    // Reset all states
    setIsSearching(true);
    setSearchStep('');
    setSearchMessage('Starting search...');
    setPinterestImages(null);
    setAnalysisData(null);
    setProductsData(null);
    setProcessingTime(null);
    setBoardName('');
    setSearchType(null);
    setNoResultsMessage('');
    setEnrichmentProgress({ current: 0, total: 0 });
    setShowSearchResults(true);
    setEbayWidgetData(null); // Reset eBay widget data
    resetFilters(); // Reset all filters when new search starts
    
    // Initialize progress bar
    setProgressData({ phase: 'pinterest', progress: 0, subStep: '', current: 0, total: 0 });
    setSearchStartTime(Date.now());
    setElapsedTime(0);
    setEstimatedTime(68); // Total estimated time in seconds (~15+13+40)
    
    // Reset segment times
    setSegmentTimes({
      pinterest: { startTime: Date.now(), endTime: null, elapsed: 0 },
      analysis: { startTime: null, endTime: null, elapsed: 0 },
      search: { startTime: null, endTime: null, elapsed: 0 }
    });

    try {
      // Create EventSource for SSE
      const encodedQuery = encodeURIComponent(searchQuery);
      const eventSource = new EventSource(`${API_URL}/api/search/stream?query=${encodedQuery}`);
      
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
      alert('Please select at least one category');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const dbResult = await saveToDatabase(formData);
      
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

      const emailResult = await sendEmail(formData);
      
      if (!emailResult.success) {
        console.warn('⚠️ Email failed but data was saved to database');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', reason: '', categories: [] });
      setSelectedCategories([]);
      
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
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Join The Waitlist
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
                <h3 className="text-2xl font-bold mb-2">You're on the list! 🎉</h3>
                <p className="text-gray-600">We'll notify you when we launch.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Join the Waitlist</h3>
                  <p className="text-gray-600">Be the first to discover your perfect products</p>
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
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Categories Interest <span className="text-red-500">*</span>
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
                      {ebayCategories.map((category, index) => (
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
                    
                    {selectedCategories.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">Please select at least one category</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why do you want to use MoodScout? <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        rows="4"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Tell us what excites you about MoodScout..."
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
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || selectedCategories.length === 0 || !formData.reason}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Waitlist
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  We respect your privacy. No spam, ever.
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
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-pink-50/30 to-white"></div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
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

              <form onSubmit={handleSearch} className="relative">
              {/* className="relative opacity-60 pointer-events-none"> */}
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search eBay products"
                    // disabled
                    className="w-full pl-14 pr-14 py-5 text-lg border-2 border-gray-200 rounded-full outline-none transition-all shadow-lg bg-gray-50"
                  />
                  {/* className="w-full pl-14 pr-14 py-5 text-lg border-2 border-gray-200 rounded-full outline-none transition-all shadow-lg bg-gray-50 cursor-not-allowed"/> */}
                </div>
                <div className="flex gap-3 justify-center mt-6">
                  <button
                    type="submit"
                    // disabled
                    className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 pointer-events-auto">
                    {/* className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-3 rounded-full font-medium cursor-not-allowed"> */}

                    Search eBay
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 pointer-events-auto"
                  >
                    Join Waitlist
                  </button>
                </div>
              </form>

              {/* Info message */}
              <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Launching in 2026. Join the waitlist to be notified!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Section - Progressive Loading with SSE */}
      {showSearchResults && (
        <section className="py-12 px-6 bg-gradient-to-b from-purple-50 to-white">
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
                      
                      return (
                        <div
                          key={segment.id}
                          className={`relative flex flex-col items-center justify-center transition-all duration-500 ${
                            index < segments.length - 1 ? 'border-r-2 border-white/50' : ''
                          } ${
                            isComplete 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                              : isActive 
                                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-gradient-x text-white' 
                                : 'bg-gray-200 text-gray-400'
                          }`}
                          style={{ width: `${segment.widthPercent}%` }}
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
            <div className="mb-12 animate-fadeIn">
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
            <div className="mb-12 animate-fadeIn">
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
                      {selectedKeywordFilters.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-purple-600">
                          (Click to filter products)
                        </span>
                      )}
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

            {/* Scoring Legend */}
            {analysisData && (
              <div className="mb-12 flex flex-wrap items-center justify-center gap-6 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-purple-100 animate-fadeIn">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Match Scoring Legend:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded font-bold">C</span>
                  <span className="text-xs font-medium text-gray-600">Content Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded font-bold">L</span>
                  <span className="text-xs font-medium text-gray-600">Color Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">Cat</span>
                  <span className="text-xs font-medium text-gray-600">Category Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded font-bold">T</span>
                  <span className="text-xs font-medium text-gray-600">Theme Match</span>
                </div>
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
            <div className="animate-fadeIn">
              {/* Header with Category Dropdown */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Matched Products from eBay</h3>
                
                {/* Category Filter Dropdown - centered */}
                <div className="flex-1 flex justify-center">
                  <CategoryDropdown
                    products={productsData}
                    selectedCategories={selectedCategoryFilters}
                    onCategoryToggle={handleCategoryFilterToggle}
                    onClearCategories={handleClearCategoryFilters}
                  />
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
                {filteredProducts.map((product, index) => (
                    <a
                      key={`product-${product.id || index}`}
                      href={product.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 block"
                    >
                      {/* Product Image with Description Hover */}
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
                      
                      {/* Product Info */}
                      <div className="p-4">
                        {/* Product Name */}
                        <h4 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-purple-600 transition-colors mb-1">
                          {product.name || 'Untitled Product'}
                        </h4>
                        
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
                        <div className="flex items-center gap-1 mt-3 text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4" />
                          <span>View on eBay</span>
                        </div>
                      </div>
                    </a>
                ))}
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
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
              >
                Join The Waitlist
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
