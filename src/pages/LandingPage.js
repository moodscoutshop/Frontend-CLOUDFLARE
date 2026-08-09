import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Search,
  ShoppingBag,
  Heart,
  TrendingUp,
  Zap,
  CheckCircle,
  Calendar,
  Clock,
  User,
  Camera,
  Plus,
  X,
  Paperclip,
} from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { usePattern } from '../context/PatternContext';
import { Navbar, Footer } from '../components/layout';
import { WaitlistModal, VisualSearchModal, PrecisionSearchAuthModal, UnsupportedUrlModal } from '../components/modals';
import { isUnsupportedUrl } from '../lib/urlValidation';
import HeroPhoneMockup from '../components/common/HeroPhoneMockup';
import { SpotlightCard, Stack, ScrollToTopButton } from '../components/common';
import { PrecisionSearchToggle } from '../components/common/PrecisionSearchToggle';
import { blogAPI } from '../lib/api';
import debug from '../lib/debug';

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

const boardPreviewImages = [
  'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=600',
];

const matchedProducts = [
  { name: 'Boho Vase', price: '$28', score: '97%', image: boardPreviewImages[0] },
  { name: 'Linen Throw', price: '$44', score: '93%', image: boardPreviewImages[1] },
  { name: 'Oak Tables', price: '$120', score: '95%', image: boardPreviewImages[3] },
  { name: 'Minimal Pot', price: '$18', score: '91%', image: boardPreviewImages[2] },
  { name: 'Sage Ceramic', price: '$32', score: '98%', image: boardPreviewImages[4] },
  { name: 'Linen Blanket', price: '$55', score: '94%', image: boardPreviewImages[5] },
  { name: 'Terracotta', price: '$24', score: '96%', image: boardPreviewImages[6] },
  { name: 'Cozy Throw', price: '$48', score: '92%', image: boardPreviewImages[7] },
  { name: 'Wood Nest', price: '$115', score: '90%', image: boardPreviewImages[8] },
];

const marqueeKeywords = [
  'Cottagecore',
  'Scandinavian',
  'Dark Academia',
  'Coastal Calm',
  'Boho Chic',
  'Minimalist',
  'Vintage Edit',
  'Maximalist',
  'Japandi',
  'Industrial',
  'Art Deco',
  'Wabi-Sabi',
  'Romantic',
  'Moody Earth',
];

const testimonialCards = [
  {
    quote:
      `"I had a Japandi board saved for two years. MoodScout found the exact linen throw I'd been searching for — in under a minute."`,
    name: 'Sophie K.',
    role: '@sophiek.home',
    initials: 'SK',
    avatarBg: '#8DA9A4',
  },
  {
    quote:
      `"I'm a terrible googler. Now I just paste my wife's board before her birthday and MoodScout handles the rest. It genuinely gets her taste."`,
    name: 'Marcus T.',
    role: 'Gift-giver turned convert',
    initials: 'MT',
    avatarBg: '#C49264',
  },
  {
    quote:
      `"The results are eerily accurate. I showed my friend and she thought I'd curated for hours — it took me 20 seconds."`,
    name: 'Aria W.',
    role: '@aria.interiors',
    initials: 'AW',
    avatarBg: '#9B7FA6',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery, resetSearch, precisionSearch, setPrecisionSearch } = useSearch();
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showVisualSearchModal, setShowVisualSearchModal] = useState(false);
  const [showPrecisionAuthModal, setShowPrecisionAuthModal] = useState(false);
  const [unsupportedUrlValue, setUnsupportedUrlValue] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await blogAPI.list({ limit: 3 });
        if (active) setBlogPosts(res.data.posts || []);
      } catch (err) {
        debug.error('Failed to load blog preview:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Scroll to hash sections when arriving from another page (e.g. /blog → /#features)
  useEffect(() => {
    if (!location.hash) return undefined;
    const id = location.hash.replace(/^#/, '');
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (attempts < 20) {
        attempts += 1;
        window.setTimeout(tryScroll, 50);
      }
    };
    const t = window.setTimeout(tryScroll, 0);
    return () => window.clearTimeout(t);
  }, [location.hash, location.pathname]);

  const handlePrecisionChange = (newValue) => {
    setPrecisionSearch(newValue);
  };

  const [queuedImageFiles, setQueuedImageFiles] = useState([]);
  const [queuedImagePreviews, setQueuedImagePreviews] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchSectionRef = useRef(null);

  const isDesktop = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const filterImageFiles = useCallback((fileList) => {
    const list = Array.from(fileList || []);
    return list.filter(
      (f) => f?.type?.startsWith('image/') && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );
  }, []);

  const rebuildPreviews = useCallback((files) => {
    setQueuedImagePreviews((prev) => {
      prev.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      });
      return files.map((f) => URL.createObjectURL(f));
    });
  }, []);

  const enqueueImages = useCallback((fileList) => {
    const imageFiles = filterImageFiles(fileList);
    if (imageFiles.length === 0) return;

    setSearchQuery('');

    setQueuedImageFiles((prev) => {
      const next = [...prev, ...imageFiles].slice(0, 16);
      rebuildPreviews(next);
      return next;
    });
  }, [filterImageFiles, rebuildPreviews, setSearchQuery]);

  const removeQueuedImage = (index) => {
    setQueuedImageFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      rebuildPreviews(next);
      return next;
    });
  };

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
  }, [enqueueImages, isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;

    const handlePaste = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const filesFromClipboard = items
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter(Boolean);

      const imageFiles = filterImageFiles(filesFromClipboard);
      if (imageFiles.length === 0) return;

      e.preventDefault();
      enqueueImages(imageFiles);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [enqueueImages, filterImageFiles, isDesktop]);

  useEffect(() => {
    return () => {
      queuedImagePreviews.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      });
    };
  }, [queuedImagePreviews]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealNodes = document.querySelectorAll('.reveal');
    revealNodes.forEach((el) => revealObserver.observe(el));

    return () => revealObserver.disconnect();
  }, []);

  const handleFileInputChange = (e) => {
    enqueueImages(e.target.files);
    setPlusMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: 'AI-Powered Discovery',
      description: 'Advanced vision models analyze your Pinterest boards to understand your style and preferences',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Smart Matching',
      description: 'Sophisticated similarity scoring finds eBay products that perfectly match your aesthetic',
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: 'Curated Results',
      description: 'Ranked by relevance, discover amazing deals that align with your vision',
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (queuedImageFiles.length > 0) {
      resetSearch();
      navigate('/results', { state: { imageFiles: queuedImageFiles, precisionSearch } });
      return;
    }

    if (!searchQuery.trim()) {
      alert('Please enter a search query or Pinterest URL.');
      return;
    }

    if (isUnsupportedUrl(searchQuery)) {
      setUnsupportedUrlValue(searchQuery.trim());
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

  const handleArticleClick = (post) => {
    navigate(`/blog/${post.slug}`);
  };

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      const input = searchSectionRef.current?.querySelector('input[type="text"]');
      input?.focus();
    }, 500);
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const { currentPattern } = usePattern();
  const patternMap = {
    'endless-clouds': endlessClouds,
    'morphing-diamonds': morphingDiamonds,
    curtain,
    'bank-note': bankNote,
    'intersecting-circles': intersectingCircles,
  };
  const patternWidth = currentPattern?.width || 60;
  const patternHeight = currentPattern?.height || 60;

  return (
    <div className="landing-film-grain relative min-h-screen overflow-x-hidden bg-background font-body-ui text-on-background">
      {false && (
        <div
          className="pointer-events-none fixed inset-0 z-0"
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
      )}

      <div className="relative z-10">
        {isDesktop && (
          <div
            className={[
              'pointer-events-none fixed inset-0 z-[60] transition-all duration-200',
              isDragActive ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            aria-hidden={!isDragActive}
          >
            <div className="absolute inset-0 bg-glowing-orange/10 backdrop-blur-[2px]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-3xl border border-outline/20 bg-white/90 px-6 py-5 shadow-xl">
                <p className="text-center font-body-ui text-body-ui font-medium text-on-surface">
                  Drop images to add them to your search
                </p>
                <p className="mt-1 text-center text-xs text-on-surface-variant">
                  JPEG, PNG, WebP, GIF • multiple files supported
                </p>
              </div>
            </div>
          </div>
        )}

        <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />

        <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />

        <VisualSearchModal
          isOpen={showVisualSearchModal}
          onClose={() => setShowVisualSearchModal(false)}
          onSearchWithImages={handleSearchWithImages}
        />

        <PrecisionSearchAuthModal
          isOpen={showPrecisionAuthModal}
          onClose={() => setShowPrecisionAuthModal(false)}
        />

        <UnsupportedUrlModal
          isOpen={!!unsupportedUrlValue}
          onClose={() => setUnsupportedUrlValue(null)}
          submittedValue={unsupportedUrlValue}
        />

        <main>
          <section className="relative mx-auto max-w-max-width px-margin-mobile pb-section-v pt-40 max-sm:pt-[11rem] md:px-margin-desktop">
            <div className="bloom-orange pointer-events-none absolute -left-24 -top-24 h-[600px] w-[600px] opacity-60" />
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div className="relative z-40 overflow-visible">
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-purple/10 bg-electric-purple/5 px-4 py-1.5 font-label-eyebrow text-label-eyebrow text-electric-purple">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-POWERED AESTHETIC SEARCH
                </span>

                <h1 className="mb-6 font-display-hero text-display-hero-mobile text-on-background md:text-display-hero">
                  Shop Your <br />
                  <span className="text-primary italic">Aesthetic</span>
                </h1>

                <p className="hero-sub mb-6 text-[28px] font-light italic leading-[1.2] text-text-muted md:text-[34px]">
                  From mood board to cart.
                </p>

                <p className="mb-10 max-w-md font-body-large text-body-large text-on-surface-variant">
                  Paste your Pinterest board. MoodScout reads your vibe and finds real, buyable
                  products that match your exact aesthetic on eBay and Amazon, right now.
                </p>

                <div ref={searchSectionRef} className="max-w-xl">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  {queuedImagePreviews.length > 0 && (
                    <div className="mb-10 flex items-center gap-6">
                      {queuedImagePreviews.length === 1 ? (
                        <div className="group/img relative h-24 w-24 overflow-hidden rounded-2xl border border-outline/10 bg-surface-bright shadow-sm">
                          <img
                            src={queuedImagePreviews[0]}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            draggable={false}
                          />
                          <button
                            type="button"
                            onClick={() => removeQueuedImage(0)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-outline/10 bg-white/90 text-on-surface opacity-0 shadow-sm transition-all group-hover/img:opacity-100"
                            aria-label="Remove image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative" style={{ width: 120, height: 120 }}>
                            <Stack
                              randomRotation={false}
                              sensitivity={180}
                              sendToBackOnClick={true}
                              autoplay={false}
                              cards={queuedImagePreviews.map((src, i) => (
                                <div key={i} className="group/img relative h-full w-full">
                                  <img
                                    src={src}
                                    alt={`image-${i + 1}`}
                                    className="h-full w-full object-cover pointer-events-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      removeQueuedImage(i);
                                    }}
                                    className="pointer-events-auto absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-outline/10 bg-white/90 text-on-surface opacity-0 shadow-sm transition-all group-hover/img:opacity-100"
                                    aria-label="Remove image"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            />
                            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-on-surface-variant">
                              {queuedImagePreviews.length} images · click or drag to browse
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setQueuedImageFiles([]);
                              setQueuedImagePreviews((prev) => {
                                prev.forEach((url) => {
                                  try {
                                    URL.revokeObjectURL(url);
                                  } catch (_) {}
                                });
                                return [];
                              });
                            }}
                            className="text-xs text-on-surface-variant underline transition-colors hover:text-on-surface"
                          >
                            Clear all
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSearch} id="landing-search-form" className="relative">
                    <div className="relative z-40">
                      <div className="absolute left-2 top-2 z-[60]" ref={plusMenuRef}>
                        <button
                          type="button"
                          onClick={() => setPlusMenuOpen((prev) => !prev)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high"
                          aria-label="More options"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        {plusMenuOpen && (
                          <div className="solid-panel absolute left-0 top-full z-[60] mt-4 w-[320px] rounded-[1.5rem] p-2">
                            <button
                              type="button"
                              onClick={() => {
                                fileInputRef.current?.click();
                                setPlusMenuOpen(false);
                              }}
                              className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-glowing-orange/15 text-primary">
                                <Paperclip className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-body-ui text-sm font-medium text-on-surface">Attach Images</div>
                                <p className="text-xs text-on-surface-variant">Upload images from your device</p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const cameraInput = document.createElement('input');
                                cameraInput.type = 'file';
                                cameraInput.accept = 'image/*';
                                cameraInput.capture = 'environment';
                                cameraInput.onchange = (ev) => {
                                  enqueueImages(ev.target.files);
                                };
                                cameraInput.click();
                                setPlusMenuOpen(false);
                              }}
                              className="flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-surface-container-low"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7A9B72]/15 text-[#55704E]">
                                <Camera className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-body-ui text-sm font-medium text-on-surface">Take Photo</div>
                                <p className="text-xs text-on-surface-variant">Use your camera to capture an image</p>
                              </div>
                            </button>

                            {false && (
                              <>
                                <div className="my-2 border-t border-black/5" />
                                <div className="px-2 pb-1">
                                  <PrecisionSearchToggle
                                    value={precisionSearch}
                                    onChange={handlePrecisionChange}
                                    className="w-full"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex w-full flex-col gap-2 rounded-2xl border border-[#C5BFAE] bg-white p-2 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40 has-[:disabled]:bg-surface-container-low dark:border-outline/35 dark:bg-surface-bright sm:h-14 sm:flex-row sm:items-center sm:gap-2 sm:p-0 sm:pl-14 sm:pr-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2 pl-12 sm:pl-0">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Paste Pinterest Board URL..."
                            disabled={queuedImageFiles.length > 0}
                            className="min-w-0 flex-1 border-0 bg-transparent py-2 font-body-ui text-on-surface outline-none placeholder:text-on-surface-variant/50 disabled:cursor-not-allowed sm:py-0"
                          />

                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high"
                            >
                              <span className="sr-only">Clear</span>
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="glow-amber inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-glowing-orange px-5 font-label-button text-label-button text-on-primary shadow-lg shadow-glowing-orange/10 sm:w-auto sm:flex-none"
                        >
                          <Search className="h-4 w-4" />
                          {queuedImageFiles.length > 0 ? (
                            'Search with Images'
                          ) : (
                            <>
                              <span className="lg:hidden">Scout Board</span>
                              <span className="hidden lg:inline min-[1082px]:hidden">Scout</span>
                              <span className="hidden min-[1082px]:inline">Scout Board</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white" style={{ backgroundColor: '#8DA9A4' }}>EV</div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white" style={{ backgroundColor: '#C49264' }}>MC</div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white" style={{ backgroundColor: '#9B7FA6' }}>SK</div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-container text-[10px] font-bold text-on-surface">+</div>
                        </div>
                        <span className="font-body-ui text-[11px] font-medium text-on-surface-variant">
                          Loved by many aesthetic shoppers
                        </span>
                      </div>

                      <div className="hidden h-6 w-px bg-outline/10 sm:block" />

                      <div className="w-full sm:w-[280px]">
                        <PrecisionSearchToggle
                          value={precisionSearch}
                          onChange={handlePrecisionChange}
                          variant="inline"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {false && (
                      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {/* HIDDEN (rollback): previous marketplace chips */}
                        <div className="flex items-center gap-3 rounded-md border border-[#EB9D2A] bg-white px-4 py-1.5 shadow-sm">
                          <img src={ebayLogo} alt="eBay" className="h-5 w-5 object-contain sm:h-6 sm:w-6" width="24" height="24" />
                          <span className="text-xs font-medium text-[#1D1F20] sm:text-sm">Searching eBay</span>
                          <div className="flex h-4 w-4 items-center justify-center rounded-md bg-[#EB9D2A] sm:h-5 sm:w-5">
                            <CheckCircle className="w-3 text-white" />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-md border border-[#D4CFC0] bg-[#EEEFE9] px-4 py-1.5">
                          <div className="flex -space-x-2">
                            <img src={amazonLogo} alt="Amazon" className="h-4 w-4 object-contain opacity-50 sm:h-5 sm:w-5" width="20" height="20" />
                            <img src={targetLogo} alt="Target" className="h-4 w-4 object-contain opacity-50 sm:h-5 sm:w-5" width="20" height="20" />
                            <img src={walmartLogo} alt="Walmart" className="h-4 w-4 object-contain opacity-50 sm:h-5 sm:w-5" width="20" height="20" />
                          </div>
                          <span className="text-xs text-[#5D5F60] sm:text-sm">More coming soon</span>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              <div className="hidden sm:block">
                <HeroPhoneMockup />
              </div>
            </div>
          </section>

          <div className="relative z-10 overflow-hidden border-y border-outline/10 bg-surface-container-low py-3 sm:py-6">
            <div className="animate-landing-marquee flex whitespace-nowrap">
              {[...marqueeKeywords, ...marqueeKeywords].map((keyword, index) => (
                <div key={`${keyword}-${index}`} className="flex items-center gap-5 px-5 sm:gap-12 sm:px-6">
                  <span className="font-body-ui text-[11px] uppercase tracking-[0.08em] text-on-surface-variant sm:text-[12px] sm:tracking-[0.2em]">
                    {keyword}
                  </span>
                  <span className="text-glowing-orange">✦</span>
                </div>
              ))}
            </div>
          </div>

          <section id="how-it-works" className="scroll-mt-[var(--ms-header-height,6rem)] bg-surface-container-low px-margin-mobile py-16 md:px-margin-desktop md:py-section-v dark:bg-cosmic-void">
            <div className="mx-auto max-w-max-width">
              <div className="mb-8 md:mb-12">
                <div className="mb-4 font-label-eyebrow text-label-eyebrow uppercase tracking-widest text-amber">
                  See It In Action
                </div>
                <h2 className="mb-4 font-headline-section text-[30px] font-semibold leading-[1.14] text-on-background md:text-headline-section">
                  Your board becomes <br />
                  your <em className="text-amber italic">shopping feed</em>
                </h2>
                <p className="mt-4 max-w-xl font-body-large text-[14px] leading-[1.6] text-on-surface-variant md:text-body-large">
                  One URL. Thirty seconds. Products that look like they came from your board.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_60px_1fr] md:gap-0">
                <div className="reveal overflow-hidden rounded-[1.5rem] border border-outline/10 bg-surface-elevated shadow-sm">
                  <div className="flex items-center gap-2 border-b border-outline/10 p-4">
                    <div className="h-2 w-2 rounded-full bg-status-pin"></div>
                    <span className="font-label-eyebrow text-[12px] uppercase tracking-[0.2em] text-on-surface-variant">
                      Your Pinterest Board
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {boardPreviewImages.map((image, idx) => (
                      <div key={idx} className="h-[120px] overflow-hidden rounded-lg bg-surface-container">
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div aria-hidden="true" className="flex h-auto flex-row items-center justify-center gap-2 py-3 md:h-full md:flex-col md:gap-4 md:py-12">
                  <div className="h-px w-10 bg-gradient-to-r from-transparent to-glowing-orange md:h-12 md:w-0.5 md:bg-gradient-to-b"></div>
                  <div className="font-label-eyebrow text-[10px] uppercase tracking-[0.1em] text-glowing-orange md:[writing-mode:vertical-rl] md:rotate-180 md:tracking-[0.2em]">
                    AI Analysis
                  </div>
                  <div className="h-px w-10 bg-gradient-to-r from-glowing-orange to-transparent md:h-12 md:w-0.5 md:bg-gradient-to-b"></div>
                </div>

                <div className="reveal overflow-hidden rounded-[1.5rem] border border-outline/10 bg-surface-elevated shadow-sm" style={{ transitionDelay: '0.15s' }}>
                  <div className="flex items-center gap-2 border-b border-outline/10 p-4">
                    <div className="h-2 w-2 rounded-full bg-status-match"></div>
                    <span className="font-label-eyebrow text-[12px] uppercase tracking-[0.2em] text-on-surface-variant">
                      Matched Products
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {matchedProducts.map((product) => (
                      <div key={product.name} className="flex flex-col overflow-hidden rounded-lg border border-outline/10 bg-surface-container-lowest">
                        <div className="h-20 overflow-hidden">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-1.5">
                          <div className="truncate text-[10px] font-bold text-on-surface">{product.name}</div>
                          <div className="mt-0.5 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-electric-purple dark:text-primary">{product.price}</span>
                            <span className="text-[8px] font-bold text-electric-purple/70 dark:text-primary/70">{product.score}</span>
                          </div>
                          <div className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-electric-purple/10 dark:bg-primary/10">
                            <div className="h-full bg-electric-purple dark:bg-primary" style={{ width: product.score }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="relative overflow-hidden bg-[#F9F8F6] px-margin-mobile py-16 md:px-margin-desktop md:py-section-v dark:bg-surface-container-lowest">
            <div className="mx-auto max-w-max-width">
              <div className="grid auto-rows-auto grid-cols-1 gap-gutter md:grid-cols-12 md:grid-rows-2 md:[grid-auto-rows:1fr]">
                <div className="group relative overflow-hidden rounded-[1.375rem] border border-[#E0DCCE] bg-surface-elevated p-6 shadow-sm transition-shadow hover:shadow-editorial-card md:col-span-8 md:rounded-[2rem] md:p-10 dark:border-outline/10">
                  <div className="absolute right-0 top-0 p-8">
                    <span className="material-symbols-outlined text-[84px] text-on-surface/5 transition-transform duration-700 group-hover:scale-110 md:text-[120px]">
                      insights
                    </span>
                  </div>
                  <div className="relative z-10 flex h-full flex-col justify-end">
                    <h3 className="mb-3 font-headline-section text-[19px] font-semibold leading-[1.25] text-primary md:mb-4 md:text-headline-card">Aesthetic Intelligence</h3>
                    <p className="max-w-md font-body-ui text-[14px] leading-[1.6] text-on-surface-variant md:text-body-ui">
                      Our neural network is trained on millions of design compositions, allowing it
                      to feel the style of your inspiration boards rather than just matching
                      pixel-for-pixel.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-[1.375rem] bg-primary p-6 text-on-primary shadow-[0_16px_36px_rgb(var(--c-primary)/0.25)] md:col-span-4 md:rounded-[2rem] md:p-10">
                  <span className="material-symbols-outlined mb-6 text-[42px] md:mb-0 md:text-5xl">bolt</span>
                  <div>
                    <h3 className="mb-3 font-headline-card text-[19px] font-semibold leading-[1.25] md:mb-4 md:text-headline-card">
                      Real-Time Discovery
                    </h3>
                    <p className="font-body-ui text-[14px] leading-[1.6] opacity-80 md:text-body-ui">
                      Sync your Pinterest in real-time. As you pin, MoodScout finds. No waiting,
                      just curation.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.375rem] border border-[#E0DCCE] bg-surface-elevated p-6 shadow-sm md:col-span-4 md:rounded-[2rem] md:p-10 dark:border-outline/10">
                  <span className="material-symbols-outlined mb-4 text-[42px] text-electric-purple md:mb-6 md:text-5xl">target</span>
                  <h3 className="mb-3 font-headline-card text-[19px] font-semibold leading-[1.25] text-on-background md:mb-4 md:text-headline-card">Precision Matching</h3>
                  <p className="font-body-ui text-[14px] leading-[1.6] text-on-surface-variant md:text-body-ui">
                    Get filtered results by price, material, and store sustainability ratings.
                  </p>
                </div>

                <div className="overflow-hidden rounded-[1.375rem] border border-electric-purple/20 bg-[#F7F1FF] p-6 shadow-sm md:col-span-8 md:rounded-[2rem] md:p-10 dark:bg-electric-purple/10">
                  <div className="flex h-full flex-col gap-6 md:flex-row md:items-center md:gap-8">
                    <div className="md:w-1/2">
                      <h3 className="mb-3 font-headline-card text-[19px] font-semibold leading-[1.25] text-electric-purple md:mb-4 md:text-headline-card">The Vibe-Meter</h3>
                      <p className="font-body-ui text-[14px] leading-[1.6] text-on-surface-variant md:text-body-ui">
                        Every product gets a match score. 90% and above is considered an aesthetic soulmate.
                      </p>
                    </div>
                    <div className="md:w-1/2">
                      <div className="space-y-4">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white md:h-4 dark:bg-on-surface/5">
                          <div className="h-full w-[95%] bg-electric-purple"></div>
                        </div>
                        <div className="h-2 w-[80%] overflow-hidden rounded-full bg-white md:h-4 dark:bg-on-surface/5">
                          <div className="h-full w-[70%] bg-electric-purple"></div>
                        </div>
                        <div className="h-2 w-[60%] overflow-hidden rounded-full bg-white md:h-4 dark:bg-on-surface/5">
                          <div className="h-full w-[88%] bg-electric-purple"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {false && (
            <>
              {/* HIDDEN (rollback): previous How It Works section */}
              <section id="how" className="bg-[#EEEFE9] px-4 py-16 sm:px-6 sm:py-20">
                <div className="mx-auto max-w-7xl">
                  <div className="mb-12 text-center sm:mb-16">
                    <h2 className="mb-4 text-3xl font-bold text-[#1D1F20] sm:text-4xl md:text-5xl">How It Works</h2>
                    <p className="text-lg text-[#5D5F60] sm:text-xl">Simple, fast, and magical</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3 sm:gap-8">
                    {[
                      { step: '01', title: 'Share Your Board', desc: 'Paste your Pinterest board URL and let us access your inspiration', icon: <Heart /> },
                      { step: '02', title: 'AI Analysis', desc: 'Our vision models extract style, color, and aesthetic patterns', icon: <Zap /> },
                      { step: '03', title: 'Discover Products', desc: 'Get ranked eBay results matching your exact taste', icon: <TrendingUp /> },
                    ].map((item, i) => (
                      <div key={i} className="group relative">
                        <div className="h-full rounded-lg border border-[#E0DCCE] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#EB9D2A] hover:shadow-lg sm:p-8">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[#D4CFC0] bg-[#EEEFE9] transition-colors group-hover:border-[#B17816] group-hover:bg-[#EB9D2A] sm:mb-6 sm:h-16 sm:w-16">
                            <div className="text-[#EB9D2A] transition-colors group-hover:text-white">{item.icon}</div>
                          </div>
                          <div className="mb-2 text-sm font-bold text-[#EB9D2A] sm:mb-3">{item.step}</div>
                          <h3 className="mb-2 text-xl font-bold text-[#1D1F20] sm:mb-3 sm:text-2xl">{item.title}</h3>
                          <p className="text-sm leading-relaxed text-[#5D5F60] sm:text-base">{item.desc}</p>
                        </div>
                        {i < 2 && (
                          <div className="absolute right-[-1rem] top-1/2 z-10 hidden -translate-y-1/2 transform md:block">
                            <ArrowRight className="h-8 w-8 text-[#D4CFC0]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* HIDDEN (rollback): previous Features section */}
              <section className="bg-[#FDFDF8] px-4 py-16 sm:px-6 sm:py-20">
                <div className="mx-auto max-w-7xl">
                  <div className="mb-12 text-center sm:mb-16">
                    <h2 className="mb-4 text-3xl font-bold text-[#1D1F20] sm:text-4xl md:text-5xl">Powerful Features</h2>
                    <p className="text-lg text-[#5D5F60] sm:text-xl">Everything you need for perfect product discovery</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3 sm:gap-8">
                    {features.map((feature, i) => (
                      <div key={i} className="group rounded-lg border border-[#E0DCCE] bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#EB9D2A] hover:shadow-lg sm:p-8">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[#B17816] bg-[#EB9D2A] text-[#1D1F20] shadow-[0_2px_0_0_#CD8407] sm:mb-6 sm:h-16 sm:w-16">
                          {feature.icon}
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-[#1D1F20] sm:mb-3 sm:text-xl">{feature.title}</h3>
                        <p className="text-sm leading-relaxed text-[#5D5F60] sm:text-base">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {false && blogPosts.length > 0 && (
            /* HIDDEN (rollback): Latest Articles / blog preview section — flip `false` to re-enable */
            <section id="blog" className="border-y border-outline/10 bg-surface-container-low px-margin-mobile py-16 md:px-margin-desktop md:py-section-v">
              <div className="mx-auto max-w-max-width">
                <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
                  <div>
                    <div className="mb-4 font-label-eyebrow text-label-eyebrow uppercase tracking-[0.2em] text-glowing-orange">
                      Editorial
                    </div>
                    <h2 className="font-headline-section text-[30px] font-semibold leading-[1.14] text-on-background md:text-headline-section">
                      Latest Articles
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate('/blog')}
                    className="hidden items-center gap-2 font-label-button text-primary transition-all hover:gap-3 md:flex"
                  >
                    View All Posts <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3 md:gap-gutter">
                  {blogPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => handleArticleClick(post)}
                      className="group cursor-pointer overflow-hidden rounded-[18px] border border-outline/10 bg-surface-bright shadow-sm md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:shadow-none"
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-surface-container md:mb-6 md:aspect-[16/10] md:rounded-[1.5rem] md:border md:border-outline/10 md:bg-surface-bright md:shadow-sm">
                        {post.cover_image ? (
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            width="800"
                            height="450"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-outline">
                            <Sparkles className="h-10 w-10" />
                          </div>
                        )}
                      </div>

                      <div className="p-4 md:p-0">
                        <div className="mb-2 font-label-micro text-label-micro uppercase tracking-[0.08em] text-glowing-orange md:mb-3 md:tracking-[0.2em]">
                          {post.category || 'Editorial'}
                        </div>

                        <h3 className="mb-2 font-headline-card text-[17px] font-semibold leading-[1.3] text-on-background transition-colors group-hover:text-primary md:mb-3 md:text-headline-card">
                          {post.title}
                        </h3>

                        <p className="mb-4 line-clamp-3 font-body-ui text-[14px] leading-[1.6] text-on-surface-variant md:mb-5 md:text-body-ui">
                          {post.excerpt || post.caption}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant md:text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {post.published_at
                                ? new Date(post.published_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })
                                : ''}
                            </span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{post.read_time || 1} min read</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span>{post.author || 'MoodScout'}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-10 text-center md:hidden">
                  <button
                    onClick={() => navigate('/blog')}
                    className="inline-flex items-center gap-2 rounded-full border border-outline/20 bg-white px-6 py-3 font-label-button text-on-surface transition-colors hover:bg-surface-container"
                  >
                    View All Posts
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="mx-auto max-w-max-width px-margin-mobile py-16 md:px-margin-desktop md:py-section-v">
            <div className="mb-8 text-center md:mb-20">
              <div className="mb-3.5 font-label-eyebrow text-label-eyebrow uppercase tracking-[0.13em] text-primary">
                Real Shoppers
              </div>
              <h2 className="font-headline-section text-[30px] font-semibold leading-[1.14] text-on-background md:text-headline-section">
                They found their <em className="italic text-primary">aesthetic</em>
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] font-body-large text-[14px] leading-[1.6] text-on-surface-variant md:text-body-large">
                People who turned their Pinterest dreams into actual purchases with MoodScout.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {testimonialCards.map((item, index) => (
                <div
                  key={item.name}
                  className="reveal flex h-full flex-col gap-4 rounded-[1.25rem] border border-outline/10 bg-surface-container-low p-6 shadow-sm md:gap-5 md:rounded-[1.5rem] md:p-8"
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="flex gap-1 text-glowing-orange">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <span key={starIndex} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>

                  <p className="mb-4 flex-1 font-headline-card text-[16px] font-normal italic leading-[1.5] text-on-surface md:mb-10 md:text-[18px] md:leading-relaxed">
                    {item.quote}
                  </p>

                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white"
                      style={{ backgroundColor: item.avatarBg || '#9B7FA6' }}
                    >
                      {item.initials}
                    </div>
                    <div>
                      <p className="font-body-ui text-sm font-medium text-on-surface">{item.name}</p>
                      <p className="font-body-ui text-xs text-on-surface-variant">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative bg-[#F9F8F6] px-margin-mobile py-11 md:px-margin-desktop md:py-section-v dark:bg-transparent">
            <div className="pointer-events-none absolute inset-0 bloom-orange opacity-40" />
            <div className="relative mx-auto max-w-max-width overflow-hidden rounded-[1.75rem] border border-outline/10 bg-surface-container-low px-6 py-9 text-center shadow-xl md:rounded-[3rem] md:p-24">
              <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 bg-primary/5 blur-[80px]" />
              <div className="relative z-10">
                <div className="mb-4 font-label-eyebrow text-label-eyebrow uppercase tracking-[0.13em] text-primary">
                  Start Discovering
                </div>
                <h2 className="mx-auto mb-5 max-w-3xl font-display-hero text-[27px] font-bold leading-[1.18] md:text-[68px] md:font-bold md:leading-[1.04]">
                  Your aesthetic is already <br />
                  <span className="text-primary italic">decided.</span>
                </h2>
                <p className="mx-auto mb-6 max-w-md font-body-large text-[14px] leading-[1.6] text-on-surface-variant md:mb-11 md:text-body-large">
                  The products just haven&apos;t found you yet. Feel free to try, no account required. Just paste
                  your board and you are ready to go.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={scrollToSearch}
                    className="glow-amber inline-flex w-full items-center justify-center gap-2 rounded-xl bg-glowing-orange px-9 py-4 font-label-button text-base text-on-primary shadow-lg shadow-glowing-orange/20 sm:w-auto"
                  >
                    Start for Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={scrollToHowItWorks}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#C5BFAE] bg-white px-9 py-4 font-label-button text-base text-on-surface shadow-sm transition-colors hover:border-primary/50 hover:text-primary dark:border-outline/40 dark:bg-surface-bright dark:hover:border-primary/50 sm:w-auto"
                  >
                    See How It Works
                  </button>
                </div>
              </div>
            </div>
          </section>

          {false && (
            <section className="bg-[#FDFDF8] px-4 py-16 sm:px-6 sm:py-20">
              {/* HIDDEN (rollback): previous CTA section */}
              <div className="mx-auto max-w-4xl">
                <SpotlightCard className="rounded-lg border border-[#3D3F40] bg-[#1D1F20] p-8 text-center text-white sm:p-12">
                  <div className="relative z-10">
                    <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-5xl">Ready to Find Your Perfect Match?</h2>
                    <p className="mb-6 text-lg text-gray-300 sm:mb-8 sm:text-xl">Join thousands discovering their dream products every day</p>
                    <button
                      onClick={() => setShowWaitlistModal(true)}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      Share Feedback
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </SpotlightCard>
              </div>
            </section>
          )}
        </main>

        <Footer onFeedbackClick={() => setShowWaitlistModal(true)} />
        <ScrollToTopButton />
      </div>
    </div>
  );
}

export default LandingPage;
