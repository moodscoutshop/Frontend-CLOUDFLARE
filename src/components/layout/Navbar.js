import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Menu, ChevronDown, Palette, LogIn, Settings, Gift, BookOpen, LogOut } from 'lucide-react';
import logo from '../../assets/logo.svg';
import { usePattern } from '../../context/PatternContext';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../common/UserMenu';
import { SettingsModal } from '../modals/SettingsModal';
import { CreatorApplicationModal } from '../modals/CreatorApplicationModal';

/**
 * PatternSelector - Dropdown menu for selecting background patterns
 */
function PatternSelector() {
  const { selectedPattern, setSelectedPattern, patterns } = usePattern();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentPatternName = patterns.find(p => p.id === selectedPattern)?.name || 'Pattern';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden lg:inline">{currentPatternName}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-[#D4CFC0] rounded-lg shadow-lg py-1 z-50">
          <div className="px-3 py-1.5 text-xs font-semibold text-[#5D5F60] uppercase tracking-wide border-b border-[#E0DCCE]">
            Background Pattern
          </div>
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => {
                setSelectedPattern(pattern.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                selectedPattern === pattern.id
                  ? 'bg-[#EB9D2A]/10 text-[#EB9D2A] font-medium'
                  : 'text-[#3D3F40] hover:bg-[#EEEFE9]'
              }`}
            >
              {selectedPattern === pattern.id && (
                <span className="w-1.5 h-1.5 bg-[#EB9D2A] rounded-full" />
              )}
              <span className={selectedPattern === pattern.id ? '' : 'ml-3.5'}>
                {pattern.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MobilePatternSelector - Pattern selector for mobile menu (accordion style)
 */
function MobilePatternSelector() {
  const { selectedPattern, setSelectedPattern, patterns } = usePattern();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentPatternName = patterns.find(p => p.id === selectedPattern)?.name || 'Pattern';

  return (
    <div className="border-t border-[#D4CFC0]/50 mt-2 pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium"
      >
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <span>Pattern: {currentPatternName}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => {
                setSelectedPattern(pattern.id);
                setIsExpanded(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
                selectedPattern === pattern.id
                  ? 'bg-[#EB9D2A]/10 text-[#EB9D2A] font-medium'
                  : 'text-[#5D5F60] hover:bg-[#EEEFE9]'
              }`}
            >
              {selectedPattern === pattern.id && (
                <span className="w-1.5 h-1.5 bg-[#EB9D2A] rounded-full" />
              )}
              <span className={selectedPattern === pattern.id ? '' : 'ml-3.5'}>
                {pattern.name}
              </span>
            </button>
          ))}
        </div>
      )}
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
  const { currentUser, isAuthenticated, logout, dbUser } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreatorApp, setShowCreatorApp] = useState(false);

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
            <a 
              href="#blog" 
              className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
            >
              Blog
            </a>
            <PatternSelector />
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
                  <a href="#blog" onClick={() => setNavDropdownOpen(false)}
                    className="block px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors">Blog</a>
                  <div className="border-t border-[#E0DCCE] my-1" />
                  <div className="px-3 py-1"><PatternSelector /></div>
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
              <a
                href="#blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-[#3D3F40] hover:text-[#EB9D2A] hover:bg-[#EEEFE9] py-2 px-2 rounded transition-colors font-medium"
              >
                Blog
              </a>
              
              {/* Mobile Pattern Selector */}
              <MobilePatternSelector />

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
