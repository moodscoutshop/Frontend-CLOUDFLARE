import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Menu,
  ChevronDown,
  ExternalLink,
  Store,
  LogIn,
  Settings,
  Gift,
  BookOpen,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import { UserMenu } from '../common/UserMenu';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import { SettingsModal } from '../modals/SettingsModal';
import { CreatorApplicationModal } from '../modals/CreatorApplicationModal';
import { DeveloperAffiliateApplicationModal } from '../modals/DeveloperAffiliateApplicationModal';
import { AnnouncementBar } from './AnnouncementBar';

/**
 * Measures the fixed header's rendered height (nav + optional announcement
 * bar) and publishes it as a CSS variable so pages can offset their content
 * without hard-coding a padding-top that would break when the banner shows.
 */
function useHeaderHeightVar(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const update = () => {
      document.documentElement.style.setProperty('--ms-header-height', `${el.offsetHeight}px`);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

/**
 * ShopifyAppButton - Link button to MoodScout Shopify App Store page
 */
function ShopifyAppButton() {
  return (
    <div className="relative group">
      <a
        href="https://apps.shopify.com/moodscout"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-secondary/5 hover:text-secondary"
        aria-label="MoodScout on Shopify App Store – widget for Shopify store owners"
      >
        <Store className="w-4 h-4" />
        <span className="hidden xl:inline">Shopify App</span>
        <ExternalLink className="w-3 h-3 opacity-50" />
      </a>
      {/* Hover tooltip — theme-aware */}
      <div className="pointer-events-none absolute left-1/2 top-full z-[110] mt-3 w-64 -translate-x-1/2 rounded-2xl border border-outline/15 bg-surface-elevated px-3 py-2.5 text-xs text-on-surface opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:border-white/15 dark:bg-[#1C1A28] dark:text-white">
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border-l border-t border-outline/15 bg-surface-elevated dark:border-white/15 dark:bg-[#1C1A28]" />
        Check out our Shopify Store page, we built a widget for Shopify Store owners
      </div>
    </div>
  );
}



/**
 * Navbar - Main navigation bar for landing page
 */
export function Navbar({ onFeedbackClick }) {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [exploreDropdownOpen, setExploreDropdownOpen] = useState(false);
  const navDropdownRef = useRef(null);
  const actionsDropdownRef = useRef(null);
  const exploreDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout, dbUser, isShopifyDeveloper } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsOpts, setSettingsOpts] = useState({
    initialTab: 'referral',
    initialMobilePane: 'menu',
  });
  const [showCreatorApp, setShowCreatorApp] = useState(false);
  const [showDeveloperApp, setShowDeveloperApp] = useState(false);
  const headerRef = useRef(null);
  useHeaderHeightVar(headerRef);

  const openSettings = (opts = {}) => {
    setSettingsOpts({
      initialTab: opts.initialTab || 'referral',
      initialMobilePane: opts.initialMobilePane || 'menu',
    });
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
    setSettingsOpts({ initialTab: 'referral', initialMobilePane: 'menu' });
  };

  /** Navigate to landing section hashes from any route */
  const goToSection = (hashId, after) => (e) => {
    e?.preventDefault?.();
    after?.();
    if (location.pathname === '/') {
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${hashId}`);
      }
    } else {
      navigate(`/#${hashId}`);
    }
  };

  // Close medium-screen dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target)) setNavDropdownOpen(false);
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target)) setActionsDropdownOpen(false);
      if (exploreDropdownRef.current && !exploreDropdownRef.current.contains(e.target)) setExploreDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Listen for CreatorApplicationModal open event from SettingsModal
  useEffect(() => {
    const handler = () => setShowCreatorApp(true);
    window.addEventListener('open-creator-application', handler);
    return () => window.removeEventListener('open-creator-application', handler);
  }, []);

  // Listen for DeveloperAffiliateApplicationModal open event from SettingsModal
  useEffect(() => {
    const handler = () => setShowDeveloperApp(true);
    window.addEventListener('open-developer-application', handler);
    return () => window.removeEventListener('open-developer-application', handler);
  }, []);

  useEffect(() => {
    const handler = (event) => openSettings(event.detail || {});
    window.addEventListener('open-settings', handler);
    return () => window.removeEventListener('open-settings', handler);
  }, []);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('settings') === 'payment') {
      openSettings({ initialTab: 'payment', initialMobilePane: 'detail' });
    }
  }, [location.search]);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Don't show on results page (results page has its own navbar)
  if (location.pathname === '/results') {
    return null;
  }

  const dropdownItem =
    'block rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary';

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-[100]">
    <nav
      className={[
        'relative z-[2] border-b border-black/5 backdrop-blur-xl transition-all duration-300',
        scrollY > 20 ? 'bg-background/95 shadow-sm' : 'bg-background/80',
      ].join(' ')}
    >
      <div className="mx-auto flex h-20 max-w-max-width items-center justify-between px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5">
            <Logo
              aria-label="MoodScout Logo"
              className="h-10 w-10 object-contain transition-transform group-hover:rotate-12"
            />
            <span className="font-display-hero-mobile text-headline-card tracking-tighter text-on-surface">
              Mood<span className="font-bold text-primary">Scout</span>
            </span>
          </Link>

          {/* Desktop Navigation (1082px+) */}
          <div className="hidden items-center gap-2 min-[1082px]:flex">
            <div className="relative" ref={exploreDropdownRef}>
              <button
                onClick={() => setExploreDropdownOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                Explore
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${exploreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {exploreDropdownOpen && (
                <div className="solid-panel absolute left-0 top-full z-[110] mt-2 w-52 rounded-3xl p-2">
                  <a href="/#how-it-works" onClick={goToSection('how-it-works', () => setExploreDropdownOpen(false))} className={dropdownItem}>How It Works</a>
                  <a href="/#features" onClick={goToSection('features', () => setExploreDropdownOpen(false))} className={dropdownItem}>Features</a>
                  <Link to="/blog" onClick={() => setExploreDropdownOpen(false)} className={dropdownItem}>Blog</Link>
                </div>
              )}
            </div>
            <ShopifyAppButton />
            {/* Reward who sent you */}
            <button
              onClick={() => openSettings()}
              className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-4 py-2 font-body-ui text-body-ui text-secondary transition-colors hover:bg-secondary/10"
            >
              <Gift className="h-3.5 w-3.5" />
              Reward who sent you
            </button>
            <ThemeToggleButton />
            {isAuthenticated ? (
              <UserMenu onSettingsClick={() => openSettings()} />
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
            <button
              onClick={onFeedbackClick}
              className="glow-amber rounded-full bg-glowing-orange px-6 py-2 text-on-primary"
            >
              Share Feedback
            </button>
          </div>
        </div>

        <div className="flex items-center">
          {/* Medium Navigation (md to 1081px) — icon-only sign in */}
          <div className="hidden items-center gap-2 md:flex min-[1082px]:hidden">
            {/* Dropdown 1: Nav links */}
            <div className="relative" ref={navDropdownRef}>
              <button
                onClick={() => { setNavDropdownOpen(v => !v); setActionsDropdownOpen(false); }}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                <BookOpen className="h-4 w-4" />
                Explore
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${navDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {navDropdownOpen && (
                <div className="solid-panel absolute left-0 top-full z-[110] mt-2 w-52 rounded-3xl p-2">
                  <a href="/#how-it-works" onClick={goToSection('how-it-works', () => setNavDropdownOpen(false))} className={dropdownItem}>How It Works</a>
                  <a href="/#features" onClick={goToSection('features', () => setNavDropdownOpen(false))} className={dropdownItem}>Features</a>
                  <Link to="/blog" onClick={() => setNavDropdownOpen(false)} className={dropdownItem}>Blog</Link>
                  <div className="my-1 border-t border-black/5" />
                  <a
                    href="https://apps.shopify.com/moodscout"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setNavDropdownOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                  >
                    <Store className="h-4 w-4" />
                    <span>Shopify App</span>
                    <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                  </a>
                  <p className="px-3 pb-2 text-xs leading-snug text-muted-text">Widget for Shopify store owners</p>
                </div>
              )}
            </div>

            {/* Reward who sent you button */}
            <button
              onClick={() => openSettings()}
              className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/5 px-4 py-2 font-body-ui text-body-ui text-secondary transition-colors hover:bg-secondary/10"
            >
              <Gift className="h-3.5 w-3.5" />
              <span>Reward who sent you</span>
            </button>
            <ThemeToggleButton />

            {/* Dropdown 2: User actions */}
            <div className="relative" ref={actionsDropdownRef}>
              <button
                onClick={() => { setActionsDropdownOpen(v => !v); setNavDropdownOpen(false); }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                {isAuthenticated && currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-outline/40 dark:ring-white/20" />
                ) : isAuthenticated ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-glowing-orange text-[10px] font-bold text-on-primary ring-2 ring-outline/40 dark:ring-white/20">
                    {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
                  </div>
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${actionsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {actionsDropdownOpen && (
                <div className="solid-panel absolute right-0 top-full z-[110] mt-2 w-56 rounded-3xl p-2">
                  {isAuthenticated ? (
                    <>
                      <div className="border-b border-black/5 px-3 py-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-text">Signed in as</div>
                        <div className="truncate text-sm font-medium text-on-surface">{currentUser?.email}</div>
                      </div>
                      <button onClick={() => { setActionsDropdownOpen(false); openSettings(); }}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
                        <Settings className="h-4 w-4" /> Settings
                      </button>
                      {(dbUser?.role === 'creator' || dbUser?.role === 'admin') && (
                        <Link to="/creator/dashboard" onClick={() => setActionsDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
                          Influencer Dashboard
                        </Link>
                      )}
                      {(isShopifyDeveloper || dbUser?.role === 'admin') && (
                        <Link to="/developer/dashboard" onClick={() => setActionsDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
                          <Store className="h-4 w-4" /> Developer Dashboard
                        </Link>
                      )}
                      <div className="my-1 border-t border-black/5" />
                      <button onClick={() => { setActionsDropdownOpen(false); onFeedbackClick?.(); }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
                        Share Feedback
                      </button>
                      <button onClick={() => { setActionsDropdownOpen(false); logout(); }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition-colors hover:bg-surface-container-low">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setActionsDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
                        <LogIn className="h-4 w-4" /> Sign In
                      </Link>
                      <button onClick={() => { setActionsDropdownOpen(false); onFeedbackClick?.(); }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low">
                        Share Feedback
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full p-2 transition-colors hover:bg-surface-container md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-on-surface" />
            ) : (
              <Menu className="h-5 w-5 text-on-surface" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Menu — light theme uses stronger borders so sections don't blend */}
      {mobileMenuOpen && (
        <div className="border-t border-[#D4CFC0] px-margin-mobile pb-4 pt-4 dark:border-white/10 md:hidden">
          <div className="mx-auto max-w-max-width rounded-[2rem] border border-[#C5BFAE] bg-white p-4 shadow-lg dark:border-white/10 dark:bg-surface-elevated/95 dark:backdrop-blur-xl">
            <div className="flex flex-col gap-1">
              <a
                href="/#how-it-works"
                onClick={goToSection('how-it-works', () => setMobileMenuOpen(false))}
                className="rounded-xl px-3 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                How It Works
              </a>
              <a
                href="/#features"
                onClick={goToSection('features', () => setMobileMenuOpen(false))}
                className="rounded-xl px-3 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                Features
              </a>
              <Link
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                Blog
              </Link>

              {/* Shopify App link */}
              <div className="mt-2 border-t border-[#D4CFC0] pt-2 dark:border-white/10">
                <a
                  href="https://apps.shopify.com/moodscout"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                >
                  <Store className="h-4 w-4" />
                  <span>Shopify App</span>
                  <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                </a>
                <p className="px-3 pb-1 text-xs leading-relaxed text-muted-text">
                  We built a widget for Shopify Store owners
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-2xl border border-[#C5BFAE] bg-[#F8F7F2] px-4 py-3 dark:border-outline/25 dark:bg-surface-container-low">
                <div>
                  <div className="font-label-eyebrow text-label-eyebrow text-muted-text">THEME</div>
                  <div className="font-body-ui text-body-ui text-on-surface">Light / Dark toggle</div>
                </div>
                <ThemeToggleButton />
              </div>

              {/* Reward who sent you — open referral detail directly on mobile */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openSettings({ initialTab: 'referral', initialMobilePane: 'detail' });
                }}
                className="mt-2 flex items-center gap-2 rounded-xl border border-secondary/40 bg-secondary/5 px-3 py-3 font-body-ui text-body-ui text-secondary transition-colors hover:bg-secondary/10 dark:border-secondary/30"
              >
                <Gift className="h-4 w-4" />
                Reward who sent you
              </button>

              {/* Auth button */}
              {isAuthenticated ? (
                <div className="mt-2 flex flex-col gap-1 border-t border-[#D4CFC0] pt-2 dark:border-white/10">
                  <Link
                    to="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                  >
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="h-5 w-5 rounded-full object-cover ring-2 ring-outline/40 dark:ring-white/20" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-glowing-orange text-[10px] font-bold text-on-primary ring-2 ring-outline/40 dark:ring-white/20">
                        {(currentUser?.displayName?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    My Searches
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); openSettings(); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-left font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  {(dbUser?.role === 'creator' || dbUser?.role === 'admin') && (
                    <Link
                      to="/creator/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-left font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                    >
                      <Sparkles className="h-4 w-4" />
                      Influencer Dashboard
                    </Link>
                  )}
                  {(isShopifyDeveloper || dbUser?.role === 'admin') && (
                    <Link
                      to="/developer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-left font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                    >
                      <Store className="h-4 w-4" />
                      Developer Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="rounded-xl px-3 py-2 text-left font-body-ui text-body-ui text-on-surface-variant transition-colors hover:bg-surface-container hover:text-red-500"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 flex items-center gap-2 border-t border-[#D4CFC0] px-3 pt-3 font-body-ui text-body-ui text-primary transition-colors hover:text-glowing-orange dark:border-white/10"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onFeedbackClick?.();
                }}
                className="glow-amber mt-3 w-full rounded-full bg-glowing-orange px-6 py-3 text-on-primary"
              >
                Share Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={closeSettings}
        initialTab={settingsOpts.initialTab}
        initialMobilePane={settingsOpts.initialMobilePane}
      />
      <CreatorApplicationModal isOpen={showCreatorApp} onClose={() => setShowCreatorApp(false)} />
      <DeveloperAffiliateApplicationModal isOpen={showDeveloperApp} onClose={() => setShowDeveloperApp(false)} />
    </nav>
    <AnnouncementBar />
    </header>
  );
}

/**
 * FooterAccordionSection — collapsible link column on mobile (≤767px);
 * always expanded from `md` up.
 */
function FooterAccordionSection({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-outline/10 last:border-b-0 md:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3.5 text-left md:pointer-events-none md:mb-4 md:py-0"
        aria-expanded={open}
      >
        <span className="font-label-micro text-label-micro uppercase tracking-widest text-text-muted">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-on-surface-variant transition-transform md:hidden ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <ul
        className={[
          'flex flex-col gap-2 overflow-hidden transition-[max-height,opacity,padding] duration-200',
          open ? 'max-h-64 pb-4 opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:pb-0 md:opacity-100',
        ].join(' ')}
      >
        {children}
      </ul>
    </div>
  );
}

/**
 * Footer - Main footer component
 */
export function Footer({ onFeedbackClick }) {
  const [openSection, setOpenSection] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const footerLink =
    'font-body-ui text-body-ui text-on-surface-variant transition-colors hover:text-primary';

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const goToSection = (hashId) => (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${hashId}`);
      }
    } else {
      navigate(`/#${hashId}`);
    }
  };

  return (
    <footer className="border-t border-outline/10 bg-surface-container-low px-margin-mobile py-10 md:px-margin-desktop md:py-16 dark:bg-surface-elevated">
      <div className="mx-auto max-w-max-width">
        <div className="grid grid-cols-1 gap-6 border-b border-outline/10 pb-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-4 md:gap-12 md:pb-12">
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <Link to="/" className="mb-3 flex items-center gap-2 text-lg font-bold text-on-surface md:mb-4">
              <Logo
                aria-label="MoodScout Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="font-body-ui">
                Mood<span className="text-primary">Scout</span>
              </span>
            </Link>
            <p className="max-w-[240px] font-body-ui text-body-ui leading-relaxed text-on-surface-variant">
              Turn your Pinterest boards into shopping reality. AI-powered product discovery for people with taste.
            </p>
          </div>

          <FooterAccordionSection
            title="Discover"
            open={openSection === 'discover'}
            onToggle={() => toggleSection('discover')}
          >
            <li><a href="/#how-it-works" onClick={goToSection('how-it-works')} className={footerLink}>How It Works</a></li>
            <li><a href="/#features" onClick={goToSection('features')} className={footerLink}>Features</a></li>
            <li><Link to="/blog" className={footerLink}>Blog</Link></li>
            <li>
              <a
                href="https://apps.shopify.com/moodscout"
                target="_blank"
                rel="noopener noreferrer"
                className={footerLink}
              >
                Shopify App
              </a>
            </li>
          </FooterAccordionSection>

          <FooterAccordionSection
            title="Account"
            open={openSection === 'account'}
            onToggle={() => toggleSection('account')}
          >
            <li><Link to="/login" className={footerLink}>Log In</Link></li>
            <li><Link to="/signup" className={footerLink}>Sign Up</Link></li>
            {/* HIDDEN (rollback): My Dashboard / Developer Dashboard footer links
            <li><Link to="/app" className={footerLink}>My Dashboard</Link></li>
            <li><Link to="/developer/dashboard" className={footerLink}>Developer Dashboard</Link></li>
            */}
          </FooterAccordionSection>

          <FooterAccordionSection
            title="Company"
            open={openSection === 'company'}
            onToggle={() => toggleSection('company')}
          >
            <li><Link to="/privacy-policy" className={footerLink}>Privacy</Link></li>
            <li><a href="https://www.moodscout.shop/terms" className={footerLink}>Terms</a></li>
            <li><a href="mailto:moodscoutshop@gmail.com" className={footerLink}>Contact</a></li>
            <li><a href="mailto:moodscoutshop@gmail.com?subject=Partnership" className={footerLink}>Partnerships</a></li>
            {onFeedbackClick && (
              <li>
                <button type="button" onClick={onFeedbackClick} className={`${footerLink} text-left`}>
                  Share Feedback
                </button>
              </li>
            )}
          </FooterAccordionSection>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
          <div className="font-label-micro text-label-micro text-text-muted">
            © 2025 MoodScout. <Link to="/privacy-policy" className="hover:text-on-surface">Privacy</Link> · <a className="hover:text-on-surface" href="https://www.moodscout.shop/terms">Terms</a>
          </div>
          <div className="flex gap-3">
            <a
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline/10 text-on-surface-variant transition-all hover:border-primary hover:text-primary"
              href="https://www.instagram.com/moodscout.shop/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18">
                <rect height="20" rx="5" width="20" x="2" y="2"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.5" cy="6.5" fill="currentColor" r="0.8" stroke="none"></circle>
              </svg>
            </a>
            <a
              aria-label="YouTube"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline/10 text-on-surface-variant transition-all hover:border-primary hover:text-primary"
              href="https://www.youtube.com/@MoodScout-Ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
                <path d="M23.5 6.19a2.99 2.99 0 0 0-2.11-2.12C19.62 3.5 12 3.5 12 3.5s-7.62 0-9.39.57A2.99 2.99 0 0 0 .5 6.19 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.81 2.99 2.99 0 0 0 2.11 2.12C4.38 20.5 12 20.5 12 20.5s7.62 0 9.39-.57a2.99 2.99 0 0 0 2.11-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.81ZM9.6 15.6V8.4l6.4 3.6-6.4 3.6Z" />
              </svg>
            </a>
            <a
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline/10 text-on-surface-variant transition-all hover:border-primary hover:text-primary"
              href="https://www.facebook.com/profile.php?id=61589035749923"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
                <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
              </svg>
            </a>
            <a
              aria-label="LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline/10 text-on-surface-variant transition-all hover:border-primary hover:text-primary"
              href="https://www.linkedin.com/company/moodscoutllc"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 382 382" width="18">
                <path d="M347.445 0H34.555C15.471 0 0 15.471 0 34.555v312.889C0 366.529 15.471 382 34.555 382h312.889C366.529 382 382 366.529 382 347.444V34.555C382 15.471 366.529 0 347.445 0zM118.207 329.844c0 5.554-4.502 10.056-10.056 10.056H65.345c-5.554 0-10.056-4.502-10.056-10.056V150.403c0-5.554 4.502-10.056 10.056-10.056h42.806c5.554 0 10.056 4.502 10.056 10.056V329.844zM86.748 123.432c-22.459 0-40.666-18.207-40.666-40.666S64.289 42.1 86.748 42.1s40.666 18.207 40.666 40.666-18.206 40.666-40.666 40.666zM341.91 330.654c0 5.106-4.14 9.246-9.246 9.246H286.73c-5.106 0-9.246-4.14-9.246-9.246v-84.168c0-12.556 3.683-55.021-32.813-55.021-28.309 0-34.051 29.066-35.204 42.11v97.079c0 5.106-4.139 9.246-9.246 9.246h-44.426c-5.106 0-9.246-4.14-9.246-9.246V149.593c0-5.106 4.14-9.246 9.246-9.246h44.426c5.106 0 9.246 4.14 9.246 9.246v15.655c10.497-15.753 26.097-27.912 59.312-27.912 73.552 0 73.131 68.716 73.131 106.472v86.846z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const layoutExports = { Navbar, Footer };

export default layoutExports;
