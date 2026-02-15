import React, { createContext, useContext, useState } from 'react';

// Pattern imports
import morphingDiamonds from '../assets/morphing-diamonds.svg';
import endlessClouds from '../assets/endless-clouds.svg';
import curtain from '../assets/curtain.svg';
import bankNote from '../assets/bank-note.svg';
import intersectingCircles from '../assets/intersecting-circles.svg';

/**
 * Pattern configuration for background patterns from heropatterns.com
 */
export const PATTERNS = {
  'endless-clouds': {
    id: 'endless-clouds',
    name: 'Endless Clouds',
    src: endlessClouds,
    width: 56,
    height: 28,
  },
  'morphing-diamonds': {
    id: 'morphing-diamonds',
    name: 'Morphing Diamonds',
    src: morphingDiamonds,
    width: 60,
    height: 60,
  },
  'curtain': {
    id: 'curtain',
    name: 'Curtain',
    src: curtain,
    width: 44,
    height: 12,
  },
  'bank-note': {
    id: 'bank-note',
    name: 'Bank Note',
    src: bankNote,
    width: 100,
    height: 20,
  },
  'intersecting-circles': {
    id: 'intersecting-circles',
    name: 'Intersecting Circles',
    src: intersectingCircles,
    width: 15,
    height: 15,
  },
};

export const PATTERN_LIST = Object.values(PATTERNS);
export const DEFAULT_PATTERN = 'endless-clouds';

const PatternContext = createContext(null);

/**
 * PatternProvider - Provides pattern selection state to the app
 */
export function PatternProvider({ children }) {
  const [selectedPattern, setSelectedPattern] = useState(DEFAULT_PATTERN);

  const value = {
    selectedPattern,
    setSelectedPattern,
    currentPattern: PATTERNS[selectedPattern],
    patterns: PATTERN_LIST,
  };

  return (
    <PatternContext.Provider value={value}>
      {children}
    </PatternContext.Provider>
  );
}

/**
 * usePattern - Hook to access pattern context
 */
export function usePattern() {
  const context = useContext(PatternContext);
  if (!context) {
    throw new Error('usePattern must be used within a PatternProvider');
  }
  return context;
}
