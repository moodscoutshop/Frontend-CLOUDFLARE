import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Menu, ChevronDown, ExternalLink, Store, LogIn, Settings, Gift, BookOpen, LogOut } from 'lucide-react';
import logo from '../../assets/logo.svg';

import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../common/UserMenu';
import { SettingsModal } from '../modals/SettingsModal';
import { CreatorApplicationModal } from '../modals/CreatorApplicationModal';
import { DeveloperAffiliateApplicationModal } from '../modals/DeveloperAffiliateApplicationModal';

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
        className="flex items-center gap-1.5 text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
        aria-label="MoodScout on Shopify App Store – widget for Shopify store owners"
      >
        <Store className="w-4 h-4" />
        <span className="hidden lg:inline">Shopify App</span>
        <ExternalLink className="w-3 h-3 opacity-50" />
      </a>
      {/* Hover tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-[#1D1F20] text-white text-xs rounded-lg px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1D1F20] rotate-45 rounded-sm" />
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
  const navDropdownRef = useRef(null);
  const actionsDropdownRef = useRef(null);
  const location = useLocation();
  const { currentUser, isAuthenticated, logout, dbUser, isShopifyDeveloper } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreatorApp, setShowCreatorApp] = useState(false);
  const [showDeveloperApp, setShowDeveloperApp] = useState(false);

  // Close medium-screen dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target)) setNavDropdownOpen(false);
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target)) setActionsDropdownOpen(false);
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
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Don't show on results page (results page has its own navbar)
  if (location.pathname === '/results') {
    return null;
  }
  
  return (
    <nav className={`
      fixed top-0 w-full z-50 transition-all duration-300 glass
      border-b border-[#D4CFC0]/50
      ${scrollY > 50 ? 'shadow-sm' : ''}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="MoodScout Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              width="32"
              height="32"
            />
            <span className="text-lg sm:text-xl font-bold text-[#1D1F20]">
              MoodScout
            </span>
          </Link>
          
          {/* Desktop Navigation (lg+) */}
          <div className="hidden lg:flex items-center gap-6">
            <a 
              href="#how" 
              className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
            >
              How It Works
            </a>
            <a 
              href="#features" 
              className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
            >
              Features
            </a>
            <Link
              to="/blog"
              className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
            >
              Blog
            </Link>
            <ShopifyAppButton />
            {/* Reward who sent you */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-[#EB9D2A]/40 text-[#B17816] bg-[#EB9D2A]/5 hover:bg-[#EB9D2A]/15 transition-colors"
            >
              <Gift className="w-3.5 h-3.5" />
              Reward who sent you
            </button>
            {isAuthenticated ? (
              <UserMenu onSettingsClick={() => setShowSettings(true)} />
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
            <button
              onClick={onFeedbackClick}
              className="btn-secondary"
            >
              Share Feedback
            </button>
          </div>

          {/* Medium Navigation (md to lg) — two compact dropdowns */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            {/* Dropdown 1: Nav links */}
            <div className="relative" ref={navDropdownRef}>
              <button
                onClick={() => { setNavDropdownOpen(v => !v); setActionsDropdownOpen(false); }}
                className="flex items-center gap-1.5 text-sm text-[#3D3F40] hover:text-[#EB9D2A] font-medium px-2 py-1.5 rounded hover:bg-[#EEEFE9] transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Explore
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${navDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {navDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-[#D4CFC0] rounded-lg shadow-lg py-1 z-50">
                  <a href="#how" onClick={() => setNavDropdownOpen(false)}
                    className="block px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">How It Works</a>
                  <a href="#features" onClick={() => setNavDropdownOpen(false)}
                    className="block px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">Features</a>
                  <Link to="/blog" onClick={() => setNavDropdownOpen(false)}
                    className="block px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">Blog</Link>
                  <div className="border-t border-[#E0DCCE] my-1" />
                  <a
                    href="https://apps.shopify.com/moodscout"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setNavDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors"
                  >
                    <Store className="w-4 h-4" />
                    <span>Shopify App</span>
                    <ExternalLink className="w-3 h-3 opacity-50 ml-auto" />
                  </a>
                  <p className="px-3 pb-2 text-xs text-[#5D5F60] leading-snug">Widget for Shopify store owners</p>
                </div>
              )}
            </div>

            {/* Reward who sent you button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md border border-[#EB9D2A]/40 text-[#B17816] bg-[#EB9D2A]/5 hover:bg-[#EB9D2A]/15 transition-colors"
            >
              <Gift className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reward who sent you</span>
            </button>

            {/* Dropdown 2: User actions */}
            <div className="relative" ref={actionsDropdownRef}>
              <button
                onClick={() => { setActionsDropdownOpen(v => !v); setNavDropdownOpen(false); }}
                className="flex items-center gap-1.5 text-sm text-[#3D3F40] hover:text-[#EB9D2A] font-medium px-2 py-1.5 rounded hover:bg-[#EEEFE9] transition-colors"
              >
                {isAuthenticated && currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : isAuthenticated ? (
                  <div className="w-5 h-5 rounded-full bg-[#EB9D2A] flex items-center justify-center text-white text-[10px] font-bold">
                    {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
                  </div>
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${actionsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {actionsDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#D4CFC0] rounded-lg shadow-lg py-1 z-50">
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 border-b border-[#E0DCCE]">
                        <div className="text-xs font-semibold text-[#5D5F60] uppercase tracking-wide">Signed in as</div>
                        <div className="text-sm text-[#3D3F40] truncate font-medium">{currentUser?.email}</div>
                      </div>
                      <button onClick={() => { setActionsDropdownOpen(false); setShowSettings(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      {(dbUser?.role === 'creator' || dbUser?.role === 'admin') && (
                        <Link to="/creator/dashboard" onClick={() => setActionsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">
                          Influencer Dashboard
                        </Link>
                      )}
                      {(isShopifyDeveloper || dbUser?.role === 'admin') && (
                        <Link to="/developer/dashboard" onClick={() => setActionsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">
                          <Store className="w-4 h-4" /> Developer Dashboard
                        </Link>
                      )}
                      <div className="border-t border-[#E0DCCE] my-1" />
                      <button onClick={() => { setActionsDropdownOpen(false); onFeedbackClick?.(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">
                        Share Feedback
                      </button>
                      <button onClick={() => { setActionsDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[#EEEFE9] transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setActionsDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">
                        <LogIn className="w-4 h-4" /> Sign In
                      </Link>
                      <button onClick={() => { setActionsDropdownOpen(false); onFeedbackClick?.(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] transition-colors">
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
            className="md:hidden p-1.5 rounded hover:bg-[#D4CFC0] transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#1D1F20]" />
            ) : (
              <Menu className="w-5 h-5 text-[#1D1F20]" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-[#D4CFC0]/50 pt-3">
            <div className="flex flex-col gap-1">
              <a
                href="#how"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium"
              >
                Features
              </a>
              <Link
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium"
              >
                Blog
              </Link>
              
              {/* Shopify App link */}
              <div className="border-t border-[#D4CFC0]/50 mt-2 pt-2">
                <a
                  href="https://apps.shopify.com/moodscout"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium w-full"
                >
                  <Store className="w-4 h-4" />
                  <span>Shopify App</span>
                  <ExternalLink className="w-3 h-3 opacity-50 ml-auto" />
                </a>
                <p className="text-xs text-[#5D5F60] px-2 pb-1 leading-relaxed">
                  We built a widget for Shopify Store owners
                </p>
              </div>

              {/* Reward who sent you */}
              <button
                onClick={() => { setMobileMenuOpen(false); setShowSettings(true); }}
                className="flex items-center gap-2 text-sm text-[#B17816] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium border-t border-[#D4CFC0]/50 mt-2 pt-2"
              >
                <Gift className="w-4 h-4" />
                Reward who sent you
              </button>

              {/* Auth button */}
              {isAuthenticated ? (
                <div className="flex flex-col gap-1 border-t border-[#D4CFC0]/50 mt-2 pt-2">
                  <Link
                    to="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium flex items-center gap-2"
                  >
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#EB9D2A] flex items-center justify-center text-white text-[10px] font-bold">
                        {(currentUser?.displayName?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    My Searches
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShowSettings(true); }}
                    className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium text-left flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  {(isShopifyDeveloper || dbUser?.role === 'admin') && (
                    <Link
                      to="/developer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium text-left flex items-center gap-2"
                    >
                      <Store className="w-4 h-4" />
                      Developer Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="text-sm text-[#5D5F60] hover:text-red-500 hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium text-left"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium border-t border-[#D4CFC0]/50 mt-2 pt-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
              
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onFeedbackClick?.();
                }}
                className="btn-secondary w-full mt-2"
              >
                Share Feedback
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <CreatorApplicationModal isOpen={showCreatorApp} onClose={() => setShowCreatorApp(false)} />
      <DeveloperAffiliateApplicationModal isOpen={showDeveloperApp} onClose={() => setShowDeveloperApp(false)} />
    </nav>
  );
}

/**
 * Footer - Main footer component
 */
export function Footer() {
  return (
    <footer className="bg-[#EEEFE9] py-6 sm:py-8 px-4 sm:px-6 border-t border-[#E0DCCE]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="MoodScout Logo"
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              width="28"
              height="28"
            />
            <span className="text-base sm:text-lg font-bold text-[#1D1F20]">MoodScout</span>
          </Link>
          
          {/* Links */}
          <div className="flex gap-6 text-sm text-[#5D5F60]">
            <Link to="/privacy-policy" className="hover:text-[#EB9D2A] transition-colors">Privacy</Link>
            <a href="https://www.moodscout.shop/terms" className="hover:text-[#EB9D2A] transition-colors">Terms</a>
            <a href="mailto:moodscoutshop@gmail.com" className="hover:text-[#EB9D2A] transition-colors">Contact</a>
          </div>
          
          {/* Copyright */}
          <div className="text-xs text-[#5D5F60] text-center md:text-right">
            © 2025 MoodScout. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default { Navbar, Footer };
