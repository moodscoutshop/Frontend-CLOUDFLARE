import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Menu, ArrowLeft, Plus, Camera, ChevronDown, Pencil, Search, Paperclip, Settings, LogIn, Gift, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.svg';
import { useSearch } from '../../context/SearchContext';
import { useAuth } from '../../context/AuthContext';
import { VisualSearchModal, SettingsModal, CreatorApplicationModal, PrecisionSearchAuthModal } from '../modals';
import { PrecisionSearchToggle } from '../common/PrecisionSearchToggle';
import Stack from '../common/Stack';
import ImageGrid from '../common/ImageGrid';
import { UserMenu } from '../common/UserMenu';

/**
 * ResultsNavbar - Navigation bar for the results page
 * Features search bar with + button, image stack, drag & drop support
 */
export function ResultsNavbar({ onNewSearch }) {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, isSearching, precisionSearch, setPrecisionSearch } = useSearch();
  const { isAuthenticated, dbUser, currentUser, logout } = useAuth();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showVisualSearchModal, setShowVisualSearchModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreatorApp, setShowCreatorApp] = useState(false);
  const [showPrecisionAuthModal, setShowPrecisionAuthModal] = useState(false);
  const inputRef = useRef(null);
  const visualSearchRef = useRef(null);
  
  // Image queue state (like landing page)
  const [queuedImageFiles, setQueuedImageFiles] = useState([]);
  const [queuedImagePreviews, setQueuedImagePreviews] = useState([]);
  
  // Plus menu state
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Stack viewer state
  const [stackExpanded, setStackExpanded] = useState(false);
  const stackViewerRef = useRef(null);
  
  // Drag & drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  
  // Desktop detection
  const isDesktop = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  // Gate: only allow enabling precision search when logged in
  const handlePrecisionChange = (newValue) => {
    if (newValue && !isAuthenticated) {
      setShowPrecisionAuthModal(true);
      return;
    }
    setPrecisionSearch(newValue);
  };
  
  // Sync local query with context
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Listen for creator application open event from SettingsModal
  useEffect(() => {
    const handler = () => setShowCreatorApp(true);
    window.addEventListener('open-creator-application', handler);
    return () => window.removeEventListener('open-creator-application', handler);
  }, []);

  // Filter valid image files
  const filterImageFiles = useCallback((fileList) => {
    const list = Array.from(fileList || []);
    return list.filter(
      (f) => f?.type?.startsWith('image/') && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );
  }, []);

  // Rebuild previews
  const rebuildPreviews = useCallback((files) => {
    setQueuedImagePreviews((prev) => {
      prev.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      });
      return files.map((f) => URL.createObjectURL(f));
    });
  }, []);

  // Enqueue images
  const enqueueImages = useCallback((fileList) => {
    const imageFiles = filterImageFiles(fileList);
    if (imageFiles.length === 0) return;

    setSearchQuery('');
    setLocalQuery('');

    setQueuedImageFiles((prev) => {
      const next = [...prev, ...imageFiles].slice(0, 16);
      rebuildPreviews(next);
      return next;
    });
  }, [filterImageFiles, rebuildPreviews, setSearchQuery]);

  // Remove image from queue
  const removeQueuedImage = useCallback((index) => {
    setQueuedImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      rebuildPreviews(next);
      return next;
    });
  }, [rebuildPreviews]);

  // Clear all images
  const clearAllImages = useCallback(() => {
    setQueuedImageFiles([]);
    setQueuedImagePreviews((prev) => {
      prev.forEach((url) => { try { URL.revokeObjectURL(url); } catch (_) {} });
      return [];
    });
    setStackExpanded(false);
  }, []);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const fileItems = items
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter(Boolean);

      if (!fileItems.length) return;

      e.preventDefault();
      enqueueImages(fileItems);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [enqueueImages]);

  // Global drag & drop handler
  useEffect(() => {
    if (!isDesktop) return;

    const onDragEnter = (e) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      dragDepthRef.current += 1;
      setIsDragActive(true);
    };

    const onDragOver = (e) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
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
  }, [isDesktop, enqueueImages]);

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

  // Close stack viewer on scroll or outside click
  useEffect(() => {
    if (!stackExpanded) return;

    const handleScroll = () => {
      setStackExpanded(false);
    };

    const handleClickOutside = (e) => {
      if (stackViewerRef.current && !stackViewerRef.current.contains(e.target)) {
        setStackExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [stackExpanded]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      queuedImagePreviews.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      });
    };
  }, [queuedImagePreviews]);

  // Handle file input for photo upload
  const handleFileInputChange = (e) => {
    enqueueImages(e.target.files);
    setPlusMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If images are queued, search with images
    if (queuedImageFiles.length > 0) {
      if (onNewSearch) {
        onNewSearch(queuedImageFiles);
      }
      clearAllImages();
      return;
    }
    
    // Text/URL search
    if (localQuery.trim()) {
      setSearchQuery(localQuery);
      if (onNewSearch) {
        onNewSearch(localQuery);
      }
    }
  };
  
  const handleClear = () => {
    setLocalQuery('');
    inputRef.current?.focus();
  };
  
  const handleBackToHome = () => {
    navigate('/');
  };

  const handleSearchWithImages = (imageFiles) => {
    if (onNewSearch && imageFiles?.length) {
      onNewSearch(imageFiles);
    }
    setShowVisualSearchModal(false);
    clearAllImages();
  };

  const hasQueuedImages = queuedImagePreviews.length > 0;
  
  return (
    <>
      {/* Drag & drop overlay */}
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

      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Back Button - Mobile */}
            <button
              onClick={handleBackToHome}
              className="sm:hidden p-1.5 rounded hover:bg-[#D4CFC0] transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4 text-[#1D1F20]" />
            </button>
            
            {/* Logo - Hidden on mobile, shown on tablet+ */}
            <Link to="/" className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <img
                src={logo}
                alt="MoodScout"
                className="w-6 h-6 object-contain"
              />
              <span className="hidden lg:block text-base font-bold text-[#1D1F20]">
                MoodScout
              </span>
            </Link>
            
            {/* Image Stack (between logo and search bar) */}
            {hasQueuedImages && (
              <div 
                className="relative flex-shrink-0 cursor-pointer group"
                onClick={() => setStackExpanded(!stackExpanded)}
              >
                {queuedImagePreviews.length === 1 ? (
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded overflow-hidden border border-[#D4CFC0] bg-[#EEEFE9] shadow-sm">
                    <img
                      src={queuedImagePreviews[0]}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11">
                    <Stack
                      randomRotation={false}
                      sensitivity={9999}
                      sendToBackOnClick={false}
                      autoplay={false}
                      mobileClickOnly={true}
                      cards={queuedImagePreviews.slice(0, 4).map((src, i) => (
                        <div key={i} className="w-full h-full rounded overflow-hidden border border-[#D4CFC0]">
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        </div>
                      ))}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded pointer-events-none">
                      <Pencil className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-[#EB9D2A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {queuedImagePreviews.length}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* Search Bar Container */}
            <div className="flex-1 max-w-xl relative" ref={stackViewerRef}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />

              <form onSubmit={handleSubmit}>
                <div className="relative flex items-center">
                  {/* Plus button (left) with dropdown */}
                  <div className="relative" ref={plusMenuRef}>
                    <button
                      type="button"
                      onClick={() => setPlusMenuOpen((v) => !v)}
                      disabled={isSearching}
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-[#EEEFE9] hover:bg-[#E0DCCE] text-[#3D3F40] hover:text-[#1D1F20] transition-colors z-10 disabled:opacity-50"
                      aria-label="More options"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    {/* Plus dropdown menu - fixed positioning for proper display */}
                    {plusMenuOpen && (
                      <div className="fixed left-auto top-auto mt-1 w-72 bg-white rounded-lg shadow-xl border border-[#D4CFC0] z-[100] py-2 animate-fade-in"
                           style={{
                             position: 'absolute',
                             left: '0',
                             top: '100%',
                             marginTop: '8px'
                           }}>
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
                            onChange={handlePrecisionChange}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Minimize button (right) - shown when stack is expanded */}
                  {stackExpanded && hasQueuedImages && (
                    <button
                      type="button"
                      onClick={() => setStackExpanded(false)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-[#EEEFE9] hover:bg-[#E0DCCE] text-[#3D3F40] hover:text-[#1D1F20] transition-colors z-10"
                      aria-label="Minimize"
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}

                  {/* Clear button (right of input, before search button) - only when there's text and stack not expanded */}
                  {localQuery && !stackExpanded && !hasQueuedImages && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-8 sm:right-9 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-[#EEEFE9] hover:bg-[#E0DCCE] text-[#3D3F40] hover:text-[#1D1F20] transition-colors z-10"
                      aria-label="Clear"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}

                  {/* Search button (right) - always visible, clickable even with images */}
                  <button
                    type="submit"
                    disabled={isSearching || (!localQuery.trim() && !hasQueuedImages)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-[#EB9D2A] hover:bg-[#CD8407] disabled:bg-[#D4CFC0] disabled:cursor-not-allowed text-white transition-colors z-20"
                    aria-label="Search"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder={hasQueuedImages ? "Press search to find products..." : "Search Pinterest URL or keywords..."}
                    disabled={isSearching || hasQueuedImages}
                    className={`
                      w-full py-1.5 pl-9 sm:pl-10 text-sm
                      bg-white border border-[#D4CFC0] rounded
                      focus:border-[#EB9D2A] focus:ring-1 focus:ring-[#EB9D2A]
                      outline-none transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                      text-[#1D1F20] placeholder-[#5D5F60]
                      ${hasQueuedImages ? 'bg-[#EEEFE9]' : ''}
                      ${localQuery && !hasQueuedImages ? 'pr-[60px] sm:pr-[68px]' : 'pr-9 sm:pr-10'}
                    `}
                  />
                </div>
              </form>

              {/* Expanded Stack Viewer */}
              <AnimatePresence>
                {stackExpanded && hasQueuedImages && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#D4CFC0] rounded-lg shadow-xl z-[100] overflow-hidden"
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-[#1D1F20]">
                          {queuedImagePreviews.length} image{queuedImagePreviews.length > 1 ? 's' : ''} selected
                        </span>
                        <button
                          type="button"
                          onClick={clearAllImages}
                          className="text-xs text-[#5D5F60] hover:text-[#1D1F20] underline transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      
                      <ImageGrid
                        images={queuedImagePreviews}
                        maxColsMobile={2}
                        maxColsDesktop={5}
                        minImageSize={56}
                        gap={8}
                        renderImage={(item, index, size) => (
                          <div className="group/img relative w-full h-full rounded-lg overflow-hidden border border-[#D4CFC0] bg-[#EEEFE9]">
                            <img
                              src={item.src}
                              alt={item.alt || ''}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQueuedImage(index);
                              }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-md bg-white/90 hover:bg-white text-[#1D1F20] flex items-center justify-center shadow-sm border border-[#D4CFC0] transition-all opacity-0 group-hover/img:opacity-100"
                              aria-label="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      />
                      
                      <p className="text-xs text-[#5D5F60] text-center mt-3">
                        Press Enter to search
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <VisualSearchModal
              ref={visualSearchRef}
              isOpen={showVisualSearchModal}
              onClose={() => setShowVisualSearchModal(false)}
              onSearchWithImages={handleSearchWithImages}
            />
            
            {/* Desktop: Precision Search Toggle with tooltip */}
            <div className="hidden sm:block relative group">
              <button
                type="button"
                onClick={() => {
                  if (!precisionSearch && !isAuthenticated) {
                    setShowPrecisionAuthModal(true);
                    return;
                  }
                  setPrecisionSearch(!precisionSearch);
                }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                  ${precisionSearch 
                    ? 'bg-[#EB9D2A]/15 text-[#B17816] border border-[#EB9D2A]' 
                    : 'text-[#3D3F40] hover:text-[#1D1F20] hover:bg-[#EEEFE9] border border-transparent'}
                `}
              >
                <span className={`
                  relative inline-flex h-4 w-7 items-center rounded-full transition-colors
                  ${precisionSearch ? 'bg-[#EB9D2A]' : 'bg-[#D4CFC0]'}
                `}>
                  <span className={`
                    inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform
                    ${precisionSearch ? 'translate-x-3' : 'translate-x-0.5'}
                  `} />
                </span>
                <span className="hidden md:inline">Precision</span>
              </button>
              {/* Tooltip on hover */}
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white border border-[#D4CFC0] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="text-xs text-[#5D5F60] leading-relaxed">
                  <span className="font-semibold text-[#1D1F20]">Precision Search:</span> Generates highly specific product descriptions (model, style, details) instead of general terms. May return fewer results if exact products are unavailable.
                </p>
              </div>
            </div>
            
            {/* Desktop: Reward who sent you */}
            <button
              onClick={() => setShowSettings(true)}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-[#EB9D2A]/40 text-[#B17816] bg-[#EB9D2A]/5 hover:bg-[#EB9D2A]/15 transition-colors flex-shrink-0"
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reward who sent you</span>
            </button>

            {/* Desktop: Sign In (unauthenticated) or User Menu (authenticated) */}
            {isAuthenticated ? (
              <div className="hidden sm:block flex-shrink-0">
                <UserMenu onSettingsClick={() => setShowSettings(true)} />
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#3D3F40] hover:text-[#EB9D2A] transition-colors px-2 py-1.5 rounded hover:bg-[#EEEFE9] flex-shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden md:inline">Sign In</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-md hover:bg-[#D4CFC0] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#1D1F20]" />
              ) : (
                <Menu className="w-5 h-5 text-[#1D1F20]" />
              )}
            </button>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t border-[#D4CFC0]">
              {/* Mobile: Precision Search Toggle */}
              <button
                onClick={() => {
                  if (!precisionSearch && !isAuthenticated) {
                    setShowPrecisionAuthModal(true);
                    return;
                  }
                  setPrecisionSearch(!precisionSearch);
                }}
                className={`
                  flex items-center gap-2 w-full py-2 font-medium transition-colors
                  ${precisionSearch ? 'text-[#B17816]' : 'text-[#3D3F40] hover:text-[#1D1F20]'}
                `}
              >
                <span className={`
                  relative inline-flex h-4 w-7 items-center rounded-full transition-colors
                  ${precisionSearch ? 'bg-[#EB9D2A]' : 'bg-[#D4CFC0]'}
                `}>
                  <span className={`
                    inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform
                    ${precisionSearch ? 'translate-x-3' : 'translate-x-0.5'}
                  `} />
                </span>
                Precision Search {precisionSearch && '(ON)'}
              </button>
              <p className="text-xs text-[#5D5F60] mt-1 ml-9">
                Generate specific product descriptions
              </p>

              {/* Mobile: Reward who sent you (always visible) */}
              <button
                onClick={() => { setMobileMenuOpen(false); setShowSettings(true); }}
                className="flex items-center gap-2 w-full py-2 text-sm font-medium text-[#B17816] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] px-2 rounded transition-colors border-t border-[#D4CFC0]/50 mt-2 pt-2"
              >
                <Gift className="w-4 h-4" />
                Reward who sent you
              </button>

              {isAuthenticated ? (
                <>
                  {/* Profile row */}
                  <div className="flex items-center gap-2 px-2 py-2 border-t border-[#D4CFC0]/50 mt-2 pt-2">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#EB9D2A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1D1F20] truncate">
                        {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-[10px] text-[#5D5F60] truncate">{currentUser?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShowSettings(true); }}
                    className="flex items-center gap-2 w-full py-2 text-sm font-medium text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] px-2 rounded transition-colors mt-1"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  {(dbUser?.role === 'creator' || dbUser?.role === 'admin') && (
                    <Link
                      to="/creator/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 w-full py-2 text-sm font-medium text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] px-2 rounded transition-colors mt-1"
                    >
                      <Sparkles className="w-4 h-4" />
                      Influencer Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="flex items-center gap-2 w-full py-2 text-sm font-medium text-[#5D5F60] hover:text-red-500 hover:bg-[#EEEFE9] px-2 rounded transition-colors mt-1"
                  >
                    <LogIn className="w-4 h-4 rotate-180" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 w-full py-2 text-sm font-medium text-[#EB9D2A] hover:bg-[#EEEFE9] px-2 rounded transition-colors mt-1"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Modals — rendered outside nav to avoid stacking context issues */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <CreatorApplicationModal isOpen={showCreatorApp} onClose={() => setShowCreatorApp(false)} />
      <PrecisionSearchAuthModal
        isOpen={showPrecisionAuthModal}
        onClose={() => setShowPrecisionAuthModal(false)}
      />
    </>
  );
}

export default ResultsNavbar;
