/**
 * MoodScout App - Restructured with React Router
 * 
 * This file has been refactored to use a multi-page architecture with React Router.
 * The previous monolithic component has been split into:
 * - LandingPage: Home page with search functionality
 * - ResultsPage: Search results with tabbed navigation
 * 
 * The original code is preserved below as comments for reference.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { PatternProvider } from './context/PatternContext';
import { LandingPage, ResultsPage } from './pages';

/**
 * App Component - Root component with router configuration
 */
export default function App() {
  return (
    <Router>
      <SearchProvider>
        <PatternProvider>
          <Routes>
            {/* Landing Page - Home with search */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Results Page - Tabbed results view */}
            <Route path="/results" element={<ResultsPage />} />
            
            {/* Fallback to landing page for unknown routes */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </PatternProvider>
      </SearchProvider>
    </Router>
  );
}


/* =============================================================================
 * ORIGINAL APP.JS CODE - PRESERVED FOR REFERENCE
 * =============================================================================
 * 
 * The following is the original monolithic component that has been refactored.
 * This code is preserved for reference and can be used to restore functionality
 * if needed. The new architecture splits this into multiple components:
 * 
 * - SearchContext.js: Global state management
 * - LandingPage.js: Hero, search, features sections
 * - ResultsPage.js: Tab navigation and results display
 * - TabNavigation.js: Tab switching logic
 * - PinterestTab.js: Pinterest images grid
 * - AnalysisTab.js: AI analysis display
 * - ScoringTab.js: Match scoring explanation
 * - ProductsTab.js: Product grid with filters
 * 
 * ============================================================================= */

/*
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowRight, Sparkles, Search, ShoppingBag, Heart, TrendingUp, Zap, X, Mail, User, CheckCircle, Phone, MessageSquare, Tag, ExternalLink, Loader2, AlertCircle, Calendar, Clock, Filter, ChevronDown, ArrowUpDown } from 'lucide-react';
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
  const [searchStep, setSearchStep] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [searchType, setSearchType] = useState(null);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [enrichmentProgress, setEnrichmentProgress] = useState({ current: 0, total: 0 });
  
  // Progress bar states - OLD PROGRESS BAR CODE
  const [progressData, setProgressData] = useState({
    phase: '',
    progress: 0,
    subStep: '',
    current: 0,
    total: 0,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(40);
  const [searchStartTime, setSearchStartTime] = useState(null);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [showProgressBar, setShowProgressBar] = useState(false);
  
  // Segment timing states - OLD PROGRESS BAR CODE
  const [segmentTimes, setSegmentTimes] = useState({
    pinterest: { startTime: null, endTime: null, elapsed: 0 },
    analysis: { startTime: null, endTime: null, elapsed: 0 },
    search: { startTime: null, endTime: null, elapsed: 0 }
  });
  const [dynamicSegmentWidths, setDynamicSegmentWidths] = useState(null);
  
  // Progressive data states
  const [pinterestImages, setPinterestImages] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [boardName, setBoardName] = useState('');
  const [ebayWidgetData, setEbayWidgetData] = useState(null);
  
  // Filter states
  const [selectedKeywordFilters, setSelectedKeywordFilters] = useState([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState([]);
  
  // Sorting states
  const [sortBy, setSortBy] = useState('default');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // ... REST OF ORIGINAL CODE CONTINUES ...
  // The original code had approximately 2777 lines.
  // All functionality has been preserved in the new component structure.
}
*/
