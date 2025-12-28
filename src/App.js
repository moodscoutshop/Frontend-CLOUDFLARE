import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Search, ShoppingBag, Heart, TrendingUp, Zap, X, Mail, User, CheckCircle, Phone, MessageSquare, Tag, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import logo from './assets/logo.svg';

// Placeholder image for products without images
const NO_IMAGE_PLACEHOLDER = 'https://www.freeiconspng.com/uploads/no-image-icon-6.png';

export default function MoodScoutLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Progressive loading states
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(''); // 'pinterest', 'analysis', 'products'
  const [searchMessage, setSearchMessage] = useState('');
  const [searchType, setSearchType] = useState(null); // 'pinterest' or 'keyword'
  const [noResultsMessage, setNoResultsMessage] = useState(''); // For handling no results
  
  // Progressive data states
  const [pinterestImages, setPinterestImages] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [boardName, setBoardName] = useState('');
  
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

  const zartCategories = [
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
    setShowSearchResults(true);

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
      
      eventSource.addEventListener('products', (event) => {
        const data = JSON.parse(event.data);
        console.log('🛍️ Products received:', data);
        setProductsData(data.products);
        
        // Handle no results message
        if (data.message) {
          setNoResultsMessage(data.message);
        }
      });
      
      eventSource.addEventListener('complete', (event) => {
        const data = JSON.parse(event.data);
        console.log('✅ Search complete:', data);
        setProcessingTime(data.processing_time);
        setSearchType(data.searchType);
        setIsSearching(false);
        setSearchStep('');
        setSearchMessage('');
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
      description: "Sophisticated similarity scoring finds Zart products that perfectly match your aesthetic"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Curated Results",
      description: "Ranked by relevance, discover handmade treasures that align with your vision"
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
                      {zartCategories.map((category, index) => (
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
              Discover perfectly matched Zart products from your Pinterest boards. 
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
                    placeholder="Search Zart products"
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

                    Search Zart
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
            
            {/* Loading Indicator */}
            {isSearching && (
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg border border-purple-100">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  <div className="text-left">
                    <p className="text-gray-800 font-medium">{searchMessage}</p>
                    <p className="text-gray-500 text-sm">
                      {searchStep === 'pinterest' && 'Downloading images from your Pinterest board...'}
                      {searchStep === 'analysis' && 'Our AI is identifying products, colors, and themes...'}
                      {searchStep === 'products' && 'Finding the best matching products on ZART...'}
                    </p>
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
                  
                  {/* Right: Keywords (Contents + Colors) */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Keywords & Colors</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.contents && analysisData.contents.map((content, idx) => (
                        <span 
                          key={`content-${idx}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {content}
                        </span>
                      ))}
                      {analysisData.color_palette && analysisData.color_palette.map((color, idx) => (
                        <span 
                          key={`color-${idx}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-sm rounded-full"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Matched Products</h3>
                <span className="ml-auto text-gray-500 text-sm">
                  {productsData.length} products found
                </span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsData.map((product, index) => (
                    <a
                      key={`product-${index}`}
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
                        {product.match_score !== undefined && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
                            <TrendingUp className="w-3 h-3 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-600">{product.match_score.toFixed(1)}%</span>
                          </div>
                        )}
                        {/* Hover Popover for Description - Limited to image area only */}
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
                          <p className="text-lg font-bold text-purple-600 mb-2">{product.price}</p>
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
                        <div className="flex items-center gap-1 mt-3 text-purple-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4" />
                          <span>View on ZART</span>
                        </div>
                      </div>
                    </a>
                ))}
              </div>
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
              { step: "03", title: "Discover Products", desc: "Get ranked Zart results matching your exact taste", icon: <TrendingUp /> }
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
