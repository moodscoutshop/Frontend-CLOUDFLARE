import React from 'react';
import { Image, Brain, ShoppingBag, Check, Loader2, Clock } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

/**
 * GlassProgressBar - Domino's-tracker-style 3-segment thick rounded progress bar
 * with glass surface overlay. Sits inline in content (not floating/fixed).
 * Shows for Pinterest URL / image upload searches only (not keyword).
 * Persists throughout the search and after completion (never auto-dismisses).
 */

// Developer toggle: set to false to disable the shimmer glimmer effect on active segments
const ENABLE_SHIMMER = false;

// Segment configuration
const SEGMENTS = [
  { id: 'pinterest', label: 'Scraping', shortLabel: 'Scrape', Icon: Image, number: 1, estimatedSeconds: 15 },
  { id: 'analysis', label: 'Analyzing', shortLabel: 'Analyze', Icon: Brain, number: 2, estimatedSeconds: 10 },
  { id: 'search', label: 'Searching', shortLabel: 'Search', Icon: ShoppingBag, number: 3, estimatedSeconds: 15 }
];

// Phase → segment mapping
const PHASE_TO_SEGMENT = {
  pinterest: 'pinterest',
  grid: 'pinterest',
  analysis: 'analysis',
  products: 'search',
  search: 'search',
  enriching: 'search',
  scoring: 'search',
  complete: 'complete'
};

// Returns the segment index (0-based) for a given phase
const getActiveSegmentIndex = (phase) => {
  const segId = PHASE_TO_SEGMENT[phase];
  if (segId === 'complete') return SEGMENTS.length; // past all
  return SEGMENTS.findIndex(s => s.id === segId);
};

const formatTime = (seconds) => {
  if (seconds == null || seconds < 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

export function GlassProgressBar() {
  const {
    searchType,
    isSearching,
    progressData,
    segmentTimes,
    elapsedTime,
    processingTime,
    reSearchSource,
  } = useSearch();

  // Only show for pinterest/image searches
  if (searchType !== 'pinterest') return null;

  const currentPhase = progressData?.phase || '';
  const isComplete = currentPhase === 'complete';
  const activeSegIdx = getActiveSegmentIndex(currentPhase);
  const totalElapsed = elapsedTime || 0;
  const totalEstimated = SEGMENTS.reduce((s, seg) => s + seg.estimatedSeconds, 0);

  return (
    <div className="w-full my-2 lg:my-0">
      {/* Single continuous progress bar with segments inside */}
      <div className="relative w-full h-6 sm:h-8">
        {/* Progress bar container */}
        <div className="absolute inset-0 rounded-full bg-[#EEEFE9] overflow-hidden">
          {/* Segments with dividers */}
          <div className="absolute inset-0 flex">
            {SEGMENTS.map((seg, idx) => {
              const segTime = segmentTimes?.[seg.id];

              // During a re-search, all segments BEFORE the first active
              // segment are implicitly complete (scraping already happened).
              const implicitlyDone = reSearchSource && idx < activeSegIdx;
              const segDone = !!(segTime?.endTime) || isComplete || implicitlyDone;
              const segActive = activeSegIdx === idx && !isComplete;
              const segPending = activeSegIdx < idx && !isComplete;
              
              const completedSecs = segTime?.endTime && segTime?.startTime
                ? Math.floor((segTime.endTime - segTime.startTime) / 1000)
                : null;

              // Determine segment colors
              let bgClass = '';
              let textClass = '';
              
              if (segDone) {
                // Completed segment - darker green
                bgClass = 'bg-gradient-to-r from-[#1B8A4A] to-[#22A55B]';
                textClass = 'text-white';
              } else if (segActive) {
                // Active segment - soft purple/pink moving gradient
                bgClass = 'animate-gradient-move';
                textClass = 'text-white';
              } else {
                // Pending segment - no color (transparent to show base)
                bgClass = 'bg-transparent';
                textClass = 'text-[#A0A2A3]';
              }

              return (
                <div
                  key={seg.id}
                  className={`
                    flex-1 relative flex items-center justify-center
                    ${bgClass}
                    ${idx < SEGMENTS.length - 1 ? 'border-r-2 border-[#F5E9C8]/90' : ''}
                    transition-all duration-500 ease-out
                  `}
                >
                  {/* Content inside segment */}
                  <div className={`
                    relative z-10 flex items-center justify-center gap-1 sm:gap-1.5
                    ${textClass} transition-colors duration-300
                  `}>
                      {/* Spinner for active segment only */}
                      {segActive && (
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                      )}
                      
                      {/* Segment label */}
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                        <span className="hidden sm:inline">{seg.label}</span>
                        <span className="sm:hidden">{seg.shortLabel}</span>
                      </span>
                    
                    {/* Timer — inline after name */}
                    <span className="text-[10px] sm:text-xs font-medium opacity-80">
                      {segDone && completedSecs != null ? (
                        <span>{formatTime(completedSecs)}</span>
                      ) : segActive && segTime?.elapsed > 0 ? (
                        <span className="font-mono">~{formatTime(segTime.elapsed)}</span>
                      ) : segPending ? (
                        <span>~{formatTime(seg.estimatedSeconds)}</span>
                      ) : null}
                    </span>
                  </div>

                  {/* Shimmer animation for active (loading) segments */}
                  {ENABLE_SHIMMER && segActive && (
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden"
                      style={{ zIndex: 5 }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
                          animation: 'shimmer 1.5s infinite',
                        }}
                      />
                    </div>
                  )}


                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Bottom status row */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <div className="flex items-center gap-1.5">
              {isComplete ? (
                <>
                  <Check className="w-3 h-3 text-[#1B8A4A]" />
                  <span className="text-[10px] sm:text-xs font-semibold text-[#1B8A4A]">
                    Search Complete
                  </span>
                </>
              ) : isSearching ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#EB9D2A]" />
                  <span className="text-[10px] sm:text-xs font-medium text-[#3D3F40]">
                    {currentPhase === 'pinterest' || currentPhase === 'grid'
                      ? 'Scraping images...'
                      : currentPhase === 'analysis'
                      ? 'Analyzing patterns...'
                      : 'Finding products...'}
                  </span>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3 h-3 ${isComplete ? 'text-[#1B8A4A]' : 'text-[#A0A2A3]'}`} />
              {isComplete && processingTime != null ? (
                <span className="text-[10px] sm:text-xs font-semibold text-[#1B8A4A]">
                  Total: {formatTime(Math.round(processingTime))}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs text-[#5D5F60] font-mono tabular-nums">
                  {formatTime(totalElapsed)}
                  <span className="text-[#A0A2A3]"> / ~{formatTime(Math.max(0, totalEstimated - totalElapsed))}</span>
                </span>
              )}
        </div>
      </div>
    </div>
  );
}

export default GlassProgressBar;
