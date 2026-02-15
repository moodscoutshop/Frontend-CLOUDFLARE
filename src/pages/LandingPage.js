import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Search, ShoppingBag, Heart, 
  TrendingUp, Zap, CheckCircle, Calendar, Clock, User, Camera, Plus, X, Paperclip 
} from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { usePattern } from '../context/PatternContext';
import { Navbar, Footer } from '../components/layout';
import { WaitlistModal, ArticleModal, VisualSearchModal } from '../components/modals';
import { SpotlightCard, GradientText, Stack, ScrollToTopButton } from '../components/common';
import { PrecisionSearchToggle } from '../components/common/PrecisionSearchToggle';

// Pattern imports
import morphingDiamonds from '../assets/morphing-diamonds.svg';
import endlessClouds from '../assets/endless-clouds.svg';
import curtain from '../assets/curtain.svg';
import bankNote from '../assets/bank-note.svg';
import intersectingCircles from '../assets/intersecting-circles.svg';

// Marketplace logos
import ebayLogo from '../assets/ebay.svg';
import targetLogo from '../assets/BullseyeRed.svg';
import walmartLogo from '../assets/spark-icon.svg';
import amazonLogo from '../assets/amazon-icon.svg';
import etsyLogo from '../assets/etsy-ar21.svg';

/**
 * LandingPage - Main landing page with hero section, search, features, etc.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, resetSearch, precisionSearch, setPrecisionSearch } = useSearch();
  
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showVisualSearchModal, setShowVisualSearchModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Desktop drag & drop visual search intake (UX-only enhancement layer)
  const [queuedImageFiles, setQueuedImageFiles] = useState([]);
  const [queuedImagePreviews, setQueuedImagePreviews] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  const isDesktop = useMemo(() => {
    // Keep mobile behavior unchanged. Prefer pointer/hover heuristics over width alone.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const filterImageFiles = (fileList) => {
    const list = Array.from(fileList || []);
    // Mirror VisualSearchModal accepted types for consistency.
    return list.filter(
      (f) => f?.type?.startsWith('image/') && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );
  };

  const rebuildPreviews = (files) => {
    // Revoke existing previews before rebuilding to avoid leaking blobs.
    setQueuedImagePreviews((prev) => {
      prev.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      });
      return files.map((f) => URL.createObjectURL(f));
    });
  };

  const enqueueImages = (fileList) => {
    const imageFiles = filterImageFiles(fileList);
    if (imageFiles.length === 0) return;

    // Clear any existing text/URL in the search bar when images are queued
    // (drag & drop, paste, or other desktop image intake).
    setSearchQuery('');

    setQueuedImageFiles((prev) => {
      const next = [...prev, ...imageFiles].slice(0, 16);
      // Previews must follow the same ordering.
      rebuildPreviews(next);
      return next;
    });
  };

  const removeQueuedImage = (index) => {
    setQueuedImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Rebuild previews from remaining files to keep indices aligned.
      rebuildPreviews(next);
      return next;
    });
  };

  useEffect(() => {
    if (!isDesktop) return;

    const onDragEnter = (e) => {
      // Only activate for file drags (not text/links).
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      dragDepthRef.current += 1;
      setIsDragActive(true);
    };

    const onDragOver = (e) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      // Required to allow drop.
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragActive(true);
    };

    const onDragLeave = (e) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragActive(false);
    };

    const onDrop = (e) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDragActive(false);
      enqueueImages(e.dataTransfer?.files);
    };

    // Capture phase to behave like a true "entire page" drop zone.
    window.addEventListener('dragenter', onDragEnter, true);
    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('dragleave', onDragLeave, true);
    window.addEventListener('drop', onDrop, true);

    return () => {
      window.removeEventListener('dragenter', onDragEnter, true);
      window.removeEventListener('dragover', onDragOver, true);
      window.removeEventListener('dragleave', onDragLeave, true);
      window.removeEventListener('drop', onDrop, true);
      dragDepthRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  // Desktop-only paste handler for image search on the landing page.
  // - If clipboard contains image data, enqueue it into the existing
  //   multi-image preview row above the search bar.
  // - Non-image clipboard data is ignored so normal paste works.
  useEffect(() => {
    if (!isDesktop) return;

    const handlePaste = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const filesFromClipboard = items
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter(Boolean);

      const imageFiles = filterImageFiles(filesFromClipboard);
      if (imageFiles.length === 0) {
        return;
      }

      // Prevent any associated text from being pasted into the search bar.
      e.preventDefault();

      enqueueImages(imageFiles);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      queuedImagePreviews.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      });
    };
  }, [queuedImagePreviews]);

  // Close plus menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle file input for photo upload from plus menu
  const handleFileInputChange = (e) => {
    enqueueImages(e.target.files);
    setPlusMenuOpen(false);
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  // Marketplace config
  const marketplaces = [
    { id: 'ebay', name: 'eBay', logo: ebayLogo, available: true },
    { id: 'target', name: 'Target', logo: targetLogo, available: false },
    { id: 'walmart', name: 'Walmart', logo: walmartLogo, available: false },
    { id: 'amazon', name: 'Amazon', logo: amazonLogo, available: false },
    { id: 'etsy', name: 'Etsy', logo: etsyLogo, available: false }
  ];
  
  // Articles data
  const articles = [
    {
      id: 1,
      title: "10 Hidden Gems on eBay You Need to Know About",
      excerpt: "Discover the secret categories and search techniques that reveal eBay's most unique treasures.",
      content: "eBay is home to millions of listings, but the real treasures are often hidden in plain sight. In this guide, we'll explore unconventional search strategies, lesser-known categories, and expert tips for finding one-of-a-kind items that match your aesthetic.",
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
      content: "Shopping for designer items on eBay can save you thousands, but it requires knowledge and strategy. This comprehensive guide covers authentication tips, timing your purchases for maximum savings, and understanding seller ratings.",
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
      content: "In the crowded world of online marketplaces, eBay stands out for several key reasons. This article breaks down the advantages of eBay's auction system, its vast selection of vintage and rare items, and buyer protection policies.",
      image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop",
      author: "Emily Rodriguez",
      date: "December 20, 2024",
      readTime: "6 min read",
      category: "Marketplace Comparison",
      tags: ["eBay", "Shopping", "Comparison"]
    }
  ];
  
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
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    // If images are queued, run the existing image-based pipeline.
    if (queuedImageFiles.length > 0) {
      resetSearch();
      navigate('/results', { state: { imageFiles: queuedImageFiles, precisionSearch } });
      return;
    }

    // Otherwise fall back to existing text/URL behavior (unchanged).
    if (!searchQuery.trim()) {
      alert('Please enter a search query or Pinterest URL.');
      return;
    }

    resetSearch();
    const encodedQuery = encodeURIComponent(searchQuery);
    navigate(`/results?q=${encodedQuery}${precisionSearch ? '&precision=1' : ''}`);
  };

  const handleSearchWithImages = (imageFiles) => {
    resetSearch();
    navigate('/results', { state: { imageFiles, precisionSearch } });
  };
  
  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  // Get current pattern from context
  const { currentPattern } = usePattern();

  // Pattern map for quick lookup
  const patternMap = {
    'endless-clouds': endlessClouds,
    'morphing-diamonds': morphingDiamonds,
    'curtain': curtain,
    'bank-note': bankNote,
    'intersecting-circles': intersectingCircles,
  };

  // Get pattern dimensions
  const patternWidth = currentPattern?.width || 60;
  const patternHeight = currentPattern?.height || 60;
  
  return (
    <div className="bg-[#FDFDF8] min-h-screen font-sans relative">
      {/* Pattern Background with Parallax Effect */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${patternMap[currentPattern?.id] || morphingDiamonds})`,
          backgroundRepeat: 'repeat',
          backgroundSize: `${patternWidth}px ${patternHeight}px`,
          opacity: 0.04,
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
      
      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">
      {/* Desktop-only global drag & drop overlay */}
      {isDesktop && (
        <div
          className={[
            'fixed inset-0 z-[60] pointer-events-none transition-all duration-200',
            isDragActive ? 'opacity-100' : 'opacity-0'
          ].join(' ')}
          aria-hidden={!isDragActive}
        >
          <div className="absolute inset-0 bg-[#EB9D2A]/10 backdrop-blur-[2px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 border border-[#D4CFC0] rounded-xl px-5 py-4 shadow-lg">
              <p className="text-sm font-medium text-[#1D1F20] text-center">
                Drop images to add them to your search
              </p>
              <p className="text-xs text-[#5D5F60] text-center mt-1">
                JPEG, PNG, WebP, GIF • multiple files supported
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Navigation */}
      <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
      
      {/* Waitlist Modal */}
      <WaitlistModal 
        isOpen={showWaitlistModal} 
        onClose={() => setShowWaitlistModal(false)} 
      />
      
      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isOpen={showArticleModal}
        onClose={() => {
          setShowArticleModal(false);
          setSelectedArticle(null);
        }}
      />
      
      <VisualSearchModal
        isOpen={showVisualSearchModal}
        onClose={() => setShowVisualSearchModal(false)}
        onSearchWithImages={handleSearchWithImages}
      />
      
      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-visible">
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white border border-[#D4CFC0] rounded-md px-4 sm:px-6 py-1.5 mb-6 sm:mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#EB9D2A]" />
              <span className="text-xs sm:text-sm font-medium text-[#1D1F20]">AI-Powered Product Discovery</span>
            </div>
            
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-[#1D1F20]">
              Transform Your
              <GradientText
                colors={['#1D4AFF', '#AE27FF', '#F54E00', '#F9BD2B', '#AE27FF', '#1D4AFF']}
                animationSpeed={6}
                showBorder={false}
                className="inline-flex ml-2 sm:ml-3"
              >
                Pinterest Dreams
              </GradientText>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>Into Reality
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-[#5D5F60] mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
              Discover perfectly matched eBay products from your Pinterest boards.
              Let AI understand your style and find the treasures you'll love.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              {/* Hidden file input for photo upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />

              <p className="text-xs sm:text-sm text-[#5D5F60] mb-3 sm:mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EB9D2A]" />
                Paste your Pinterest board URL to find products that match your board's aesthetic.
              </p>

              {/* Queued image previews with Stack effect */}
              {queuedImagePreviews.length > 0 && (
                <div className="mb-10 sm:mb-6 flex items-center justify-center gap-6 sm:gap-8">
                  {queuedImagePreviews.length === 1 ? (
                    /* Single image - simple preview */
                    <div
                      className="
                        group/img relative w-24 h-24 rounded-lg overflow-hidden
                        border border-[#D4CFC0] bg-[#EEEFE9]
                        shadow-sm
                      "
                    >
                      <img
                        src={queuedImagePreviews[0]}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                      <button
                        type="button"
                        onClick={() => removeQueuedImage(0)}
                        className="
                          absolute top-1 right-1
                          w-6 h-6 rounded-md
                          bg-white/90 hover:bg-white
                          text-[#1D1F20]
                          flex items-center justify-center
                          shadow-sm border border-[#D4CFC0]
                          transition-all
                          opacity-0 group-hover/img:opacity-100
                        "
                        aria-label="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Multiple images - Stack effect */
                    <>
                      <div className="relative" style={{ width: 120, height: 120 }}>
                        <Stack
                          randomRotation={false}
                          sensitivity={180}
                          sendToBackOnClick={true}
                          autoplay={false}
                          cards={queuedImagePreviews.map((src, i) => (
                            <div key={i} className="group/img relative w-full h-full">
                              <img
                                src={src}
                                alt={`image-${i + 1}`}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeQueuedImage(i);
                                }}
                                className="
                                  absolute top-1 right-1
                                  w-6 h-6 rounded-md
                                  bg-white/90 hover:bg-white
                                  text-[#1D1F20]
                                  flex items-center justify-center
                                  shadow-sm border border-[#D4CFC0]
                                  transition-all
                                  opacity-0 group-hover/img:opacity-100
                                  pointer-events-auto
                                "
                                aria-label="Remove image"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        />
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#5D5F60] whitespace-nowrap">
                          {queuedImagePreviews.length} images · click or drag to browse
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setQueuedImageFiles([]);
                          setQueuedImagePreviews((prev) => {
                            prev.forEach((url) => { try { URL.revokeObjectURL(url); } catch (_) {} });
                            return [];
                          });
                        }}
                        className="text-xs text-[#5D5F60] hover:text-[#1D1F20] underline transition-colors"
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
              )}

              <form onSubmit={handleSearch}>
                <div className="relative group flex items-center">
                  {/* Plus button (left) with dropdown */}
                  <div className="relative" ref={plusMenuRef}>
                    <button
                      type="button"
                      onClick={() => setPlusMenuOpen((v) => !v)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[#EEEFE9] hover:bg-[#E0DCCE] text-[#3D3F40] hover:text-[#1D1F20] transition-colors z-10"
                      aria-label="More options"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Plus dropdown menu */}
                    {plusMenuOpen && (
                      <div className="absolute left-0 top-full mt-6 w-72 bg-white rounded-lg shadow-xl border border-[#D4CFC0] z-50 py-2 animate-fade-in">
                        {/* Attach image option */}
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setPlusMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-md bg-[#EB9D2A]/15 flex items-center justify-center flex-shrink-0">
                            <Paperclip className="w-4 h-4 text-[#B17816]" />
                          </div>
                          <div>
                            <span className="font-medium text-[#1D1F20]">Attach Images</span>
                            <p className="text-xs text-[#5D5F60]">Upload images from your device</p>
                          </div>
                        </button>

                        {/* Take photo with camera option */}
                        <button
                          type="button"
                          onClick={() => {
                            // Create a temporary file input with capture attribute
                            const cameraInput = document.createElement('input');
                            cameraInput.type = 'file';
                            cameraInput.accept = 'image/*';
                            cameraInput.capture = 'environment';
                            cameraInput.onchange = (e) => {
                              enqueueImages(e.target.files);
                            };
                            cameraInput.click();
                            setPlusMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-md bg-[#36C46F]/15 flex items-center justify-center flex-shrink-0">
                            <Camera className="w-4 h-4 text-[#2A9D58]" />
                          </div>
                          <div>
                            <span className="font-medium text-[#1D1F20]">Take Photo</span>
                            <p className="text-xs text-[#5D5F60]">Use your camera to capture an image</p>
                          </div>
                        </button>

                        <div className="border-t border-[#EEEFE9] my-1" />

                        {/* Precision Search toggle */}
                        <div className="px-4 py-2.5">
                          <PrecisionSearchToggle
                            value={precisionSearch}
                            onChange={setPrecisionSearch}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clear button (right) - only when there's text */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[#EEEFE9] hover:bg-[#E0DCCE] transition-colors z-10"
                    >
                      <span className="sr-only">Clear</span>
                      <svg className="w-4 h-4 text-[#1D1F20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="https://www.pinterest.com/username/board-name/"
                    disabled={queuedImageFiles.length > 0}
                    className="w-full pl-11 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border border-[#D4CFC0] rounded-md outline-none transition-all shadow-sm bg-white focus:border-[#EB9D2A] focus:ring-2 focus:ring-[#EB9D2A]/20 text-[#1D1F20] placeholder-[#5D5F60]/40 disabled:bg-[#EEEFE9] disabled:cursor-not-allowed"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="btn-primary px-6 sm:px-8 py-3 flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    {queuedImageFiles.length > 0 ? 'Search with Images' : 'Search Marketplace(s)'}
                  </button>
                  
                  {/* Precision Search Toggle */}
                  <PrecisionSearchToggle
                    value={precisionSearch}
                    onChange={setPrecisionSearch}
                    variant="inline"
                  />
                </div>
              </form>
              
              {/* Marketplace Info */}
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-3 bg-white border border-[#EB9D2A] rounded-md px-4 sm:px-5 py-1.5 shadow-sm">
                  <img src={ebayLogo} alt="eBay" className="w-5 sm:w-6 h-5 sm:h-6 object-contain" />
                  <span className="text-xs sm:text-sm font-medium text-[#1D1F20]">Searching eBay</span>
                  <div className="w-4 sm:w-5 h-4 sm:h-5 bg-[#EB9D2A] rounded-md flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-[#EEEFE9] border border-[#D4CFC0] rounded-md px-4 sm:px-5 py-1.5">
                  <div className="flex -space-x-2">
                    <img src={amazonLogo} alt="Amazon" className="w-4 sm:w-5 h-4 sm:h-5 object-contain opacity-50" />
                    <img src={targetLogo} alt="Target" className="w-4 sm:w-5 h-4 sm:h-5 object-contain opacity-50" />
                    <img src={walmartLogo} alt="Walmart" className="w-4 sm:w-5 h-4 sm:h-5 object-contain opacity-50" />
                  </div>
                  <span className="text-xs sm:text-sm text-[#5D5F60]">More coming soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#EEEFE9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#1D1F20]">How It Works</h2>
            <p className="text-lg sm:text-xl text-[#5D5F60]">Simple, fast, and magical</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "01", title: "Share Your Board", desc: "Paste your Pinterest board URL and let us access your inspiration", icon: <Heart /> },
              { step: "02", title: "AI Analysis", desc: "Our vision models extract style, color, and aesthetic patterns", icon: <Zap /> },
              { step: "03", title: "Discover Products", desc: "Get ranked eBay results matching your exact taste", icon: <TrendingUp /> }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#E0DCCE] hover:border-[#EB9D2A] hover:-translate-y-1 hover:shadow-lg transition-all h-full">
                  <div className="w-14 sm:w-16 h-14 sm:h-16 bg-[#EEEFE9] border border-[#D4CFC0] rounded-lg flex items-center justify-center group-hover:bg-[#EB9D2A] group-hover:border-[#B17816] transition-colors mb-4 sm:mb-6">
                    <div className="text-[#EB9D2A] group-hover:text-white transition-colors">{item.icon}</div>
                  </div>
                  <div className="text-sm font-bold text-[#EB9D2A] mb-2 sm:mb-3">{item.step}</div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-[#1D1F20]">{item.title}</h3>
                  <p className="text-[#5D5F60] leading-relaxed text-sm sm:text-base">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-[#D4CFC0]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FDFDF8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#1D1F20]">Powerful Features</h2>
            <p className="text-lg sm:text-xl text-[#5D5F60]">Everything you need for perfect product discovery</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-6 sm:p-8 rounded-lg border border-[#E0DCCE] hover:border-[#EB9D2A] hover:-translate-y-1 hover:shadow-lg transition-all group">
                <div className="w-14 sm:w-16 h-14 sm:h-16 bg-[#EB9D2A] border border-[#B17816] rounded-lg flex items-center justify-center mb-4 sm:mb-6 text-[#1D1F20] shadow-[0_2px_0_0_#CD8407]">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-[#1D1F20]">{feature.title}</h3>
                <p className="text-[#5D5F60] leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Blog Section */}
      <section id="blog" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#EEEFE9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[#1D1F20]">Latest Articles</h2>
            <p className="text-lg sm:text-xl text-[#5D5F60]">Tips, tricks, and insights for smarter eBay shopping</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {articles.map((article) => (
              <article
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="group bg-white rounded-lg overflow-hidden border border-[#E0DCCE] hover:border-[#EB9D2A] hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="aspect-video relative overflow-hidden bg-[#EEEFE9]">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#EB9D2A] text-[#1D1F20] text-xs px-3 py-1 rounded-md font-medium border border-[#B17816]">
                      {article.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#5D5F60] mb-2 sm:mb-3">
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
                  
                  <h3 className="text-lg sm:text-xl font-bold text-[#1D1F20] mb-2 sm:mb-3 group-hover:text-[#EB9D2A] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-[#5D5F60] text-sm leading-relaxed mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[#E0DCCE]">
                    <div className="flex items-center gap-2 text-sm text-[#5D5F60]">
                      <User className="w-4 h-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#EB9D2A] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Read More</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          
          <div className="text-center">
            <button className="btn-primary inline-flex items-center gap-2">
              View All Articles
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FDFDF8]">
        <div className="max-w-4xl mx-auto">
          <SpotlightCard 
            className="bg-[#1D1F20] rounded-lg p-8 sm:p-12 text-center text-white border border-[#3D3F40]"
          >
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Ready to Find Your Perfect Match?</h2>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-300">Join thousands discovering their dream products every day</p>
              <button
                onClick={() => setShowWaitlistModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                Share Feedback
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </SpotlightCard>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
      </div>
    </div>
  );
}

export default LandingPage;
