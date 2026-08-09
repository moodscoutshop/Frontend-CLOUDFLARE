import React from 'react';
import { Sparkles, Tag } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
// import { TimingDisplay } from './TabNavigation';
import { GlassProgressBar, KeywordEditor, ReSearchButton } from '../common';

/**
 * AnalysisTab - Displays AI analysis results with editable keywords.
 * Users can edit, remove, add, and reset keywords, then trigger a
 * re-search to find products from the modified keyword set.
 */
export function AnalysisTab({ onReSearchFromKeywords }) {
  const { 
    analysisData, 
    tabStates, 
    segmentTimes,
    isSearching,
    progressData,
    // Keyword editing state
    editedKeywords,
    originalKeywords,
    keywordsModified,
    updateKeyword,
    removeKeyword,
    addKeyword,
    resetKeywords,
    reSearchSource,
  } = useSearch();
  
  const tabState = tabStates.analysis;
  const timing = segmentTimes.analysis;
  const isLoading = tabState?.loading || (isSearching && progressData.phase === 'analysis');
  const isComplete = tabState?.loaded || analysisData !== null;

  // Track if a re-search from keywords is in progress
  const isReSearching = isSearching && reSearchSource === 'keywords';
  
  return (
    <div className="py-6 animate-fade-in">
      {/* Header row: on desktop, title | progress bar | right info inline */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 lg:gap-8 mb-6">
        {/* Left: title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-blue rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">AI Analysis</h2>
            <p className="text-sm text-on-surface-variant">Understanding your aesthetic</p>
          </div>
        </div>
        
        {/* Center: progress bar (grows to fill) */}
        <div className="flex-1 min-w-0">
          <GlassProgressBar />
        </div>

        {/* Right: info */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {analysisData?.model_used && (
            <span className="text-xs text-on-surface-variant">Model: {analysisData.model_used}</span>
          )}
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && !analysisData && (
        <div className="bg-surface-elevated p-6 rounded-lg shadow-md border border-outline/10 animate-pulse">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-10 w-24 bg-surface-section rounded-full" />
                <div className="h-10 w-28 bg-surface-section rounded-full" />
              </div>
              <div className="h-24 bg-surface-section rounded-lg" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-32 bg-surface-section rounded" />
              <div className="flex flex-wrap gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-surface-section rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Analysis Content */}
      {analysisData && (
        <div className="bg-surface-elevated rounded-xl shadow-lg border border-outline/10 overflow-hidden">
          {/* Gradient Header Bar */}
          <div className="h-2 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-green"></div>
          
          <div className="p-5 sm:p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Category, Theme, Summary */}
              <div className="min-w-0">
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-accent-purple/15 text-accent-purple">
                    Category: {analysisData.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-accent-blue/15 text-accent-blue">
                    Theme: {analysisData.theme}
                  </span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {analysisData.summary}
                </p>
              </div>
              
              {/* Right: Editable Keywords & Colors */}
              <div className="bg-surface-container-low rounded-lg p-4 border border-outline/10 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <h4 className="font-semibold text-on-surface flex items-center gap-2">
                    <Tag className="w-4 h-4 text-accent-green" />
                    Keywords & Colors
                  </h4>
                  <p className="text-xs text-on-surface-variant/80 italic">
                    Click any keyword to edit
                  </p>
                </div>
              
              {/* Editable Keywords */}
              <div className="mb-4">
                <KeywordEditor
                  keywords={editedKeywords}
                  originalKeywords={originalKeywords}
                  isModified={keywordsModified}
                  onUpdate={updateKeyword}
                  onRemove={removeKeyword}
                  onAdd={addKeyword}
                  onReset={resetKeywords}
                />
              </div>
              
              {/* Color Palette */}
              {analysisData.color_palette && analysisData.color_palette.length > 0 && (
                <div className="pt-3 border-t border-outline-variant">
                  <h5 className="text-sm font-medium text-on-surface-variant mb-2">Color Palette</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.color_palette.map((color, idx) => (
                      <span
                        key={`color-${idx}`}
                        className="
                          inline-flex items-center gap-1 px-3 py-1
                          bg-accent-blue/12 text-accent-blue border border-accent-blue/30
                          text-sm rounded-full
                        "
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Re-search action bar — only visible after keywords are modified */}
            {keywordsModified && editedKeywords.length > 0 && (
              <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between gap-4">
                <p className="text-sm text-on-surface-variant">
                  <span className="font-medium text-on-surface">{editedKeywords.length}</span> keyword{editedKeywords.length !== 1 ? 's' : ''} (modified)
                </p>
                <ReSearchButton
                  label="Search Keywords"
                  count={editedKeywords.length}
                  onClick={() => onReSearchFromKeywords?.()}
                  loading={isReSearching}
                  disabled={isReSearching || editedKeywords.length === 0}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !analysisData && (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-surface-section rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-on-surface-variant" />
          </div>
          <h3 className="text-lg font-semibold text-on-surface-variant mb-2">Analysis Pending</h3>
          <p className="text-on-surface-variant">AI analysis will appear here once processing is complete.</p>
        </div>
      )}
    </div>
  );
}

export default AnalysisTab;
