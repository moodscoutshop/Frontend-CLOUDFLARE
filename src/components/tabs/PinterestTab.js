import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Heart, RotateCcw } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
// import { TimingDisplay } from './TabNavigation';
import { Masonry, GlassProgressBar, ImageSelectionOverlay, ReSearchButton } from '../common';

/**
 * Load image and get its natural dimensions
 */
const loadImageDimensions = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      // If image fails to load, use default aspect ratio
      resolve({ width: 400, height: 600 });
    };
    img.src = src;
  });
};

/**
 * PinterestTab - Displays Pinterest board images with selection overlay
 * Users can deselect images and trigger a re-search from the selected subset.
 */
export function PinterestTab({ onReSearchFromImages }) {
  const { 
    pinterestImages, 
    boardName, 
    tabStates, 
    segmentTimes,
    isSearching,
    progressData,
    API_URL,
    deselectedImages,
    toggleImageDeselection,
    selectedImages,
    clearImageDeselections,
    reSearchSource,
  } = useSearch();
  
  const tabState = tabStates.pinterest;
  const timing = segmentTimes.pinterest;
  const isLoading = tabState?.loading || (isSearching && progressData.phase === 'pinterest');
  const isComplete = tabState?.loaded || pinterestImages?.length > 0;

  // Determine if this is an image upload search
  const isImageUploadSearch = boardName === 'Your photos' || boardName === '';

  // Track if a re-search from images is in progress
  const isReSearching = isSearching && reSearchSource === 'images';

  const [masonryItems, setMasonryItems] = useState([]);

  // Load images and get their dimensions
  useEffect(() => {
    if (!pinterestImages || pinterestImages.length === 0) {
      setMasonryItems([]);
      return;
    }

    const loadAllImageDimensions = async () => {
      const itemsWithDimensions = await Promise.all(
        pinterestImages.map(async (image, index) => {
          const imgSrc = image.url || `${API_URL}${image.localUrl}` || `https://via.placeholder.com/300x300?text=Image+${index + 1}`;
          const dimensions = await loadImageDimensions(imgSrc);
          
          // Scale down dimensions while preserving aspect ratio
          // Target width is around 400px, height scales proportionally
          const targetWidth = 400;
          const aspectRatio = dimensions.height / dimensions.width;
          const scaledHeight = targetWidth * aspectRatio;
          
          return {
            id: String(index + 1),
            img: imgSrc,
            url: image.originalUrl || null,
            height: scaledHeight,
            width: targetWidth,
            index: image.index || index + 1,
            _originalIndex: index  // Track original array index for deselection
          };
        })
      );
      
      setMasonryItems(itemsWithDimensions);
    };

    loadAllImageDimensions();
  }, [pinterestImages, API_URL]);

  // Selection counts
  const totalImages = pinterestImages?.length || 0;
  const selectedCount = totalImages - deselectedImages.size;
  const hasDeselections = deselectedImages.size > 0;

  // Render the overlay for each masonry item
  const renderSelectionOverlay = useCallback((item) => {
    const originalIndex = item._originalIndex;
    const isDeselected = deselectedImages.has(originalIndex);
    // Disable the X button if this is the last selected image
    const isLastSelected = selectedCount <= 1 && !isDeselected;
    
    return (
      <ImageSelectionOverlay
        isDeselected={isDeselected}
        onToggle={() => toggleImageDeselection(originalIndex)}
        disabled={isLastSelected}
      />
    );
  }, [deselectedImages, selectedCount, toggleImageDeselection]);
  
  return (
    <div className="py-6 animate-fade-in">
      {/* Header row: on desktop, title | progress bar | right info inline */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 lg:gap-8 mb-6">
        {/* Left: title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-[#E60023] rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1D1F20]">
              {isImageUploadSearch ? 'Your Images' : 'Pinterest Board Images'}
            </h2>
            {boardName && !isImageUploadSearch && (
              <p className="text-sm text-[#5D5F60]">Board: {boardName}</p>
            )}
          </div>
        </div>

        {/* Center: progress bar (grows to fill) */}
        <div className="flex-1 min-w-0">
          <GlassProgressBar />
        </div>

        {/* Right: info + re-search button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {pinterestImages && (
            <span className="text-sm text-[#5D5F60]">
              {hasDeselections
                ? `${selectedCount} of ${totalImages} selected`
                : `${totalImages} images`
              }
            </span>
          )}
        </div>
      </div>

      {/* Re-search action bar - shows when images have been deselected */}
      {hasDeselections && pinterestImages && (
        <div className="flex items-center justify-between gap-4 mb-6 p-3 rounded-xl bg-[#EB9D2A]/5 border border-[#EB9D2A]/20">
          <p className="text-sm text-[#5D5F60]">
            <span className="font-medium text-[#1D1F20]">{selectedCount}</span> image{selectedCount !== 1 ? 's' : ''} selected for re-analysis
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearImageDeselections}
              disabled={isReSearching}
              className="btn-secondary inline-flex items-center gap-1.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              title="Reset — undo all deselections"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <ReSearchButton
              label="Search Selected"
              onClick={() => onReSearchFromImages?.()}
              loading={isReSearching}
              disabled={isReSearching || selectedCount === 0}
            />
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && !pinterestImages && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square rounded-lg bg-[#EEEFE9] animate-pulse"
            />
          ))}
        </div>
      )}
      
      {/* Image Grid - Masonry Layout */}
      {masonryItems.length > 0 && (
        <div className="min-h-[500px]">
          <Masonry
            items={masonryItems}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={false}
            blurToFocus
            colorShiftOnHover={false}
            renderOverlay={renderSelectionOverlay}
          />
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && (!pinterestImages || pinterestImages.length === 0) && (
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-[#EEEFE9] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-[#5D5F60]" />
          </div>
          <h3 className="text-lg font-semibold text-[#3D3F40] mb-2">No Images Yet</h3>
          <p className="text-[#5D5F60]">Pinterest images will appear here once loaded.</p>
        </div>
      )}
    </div>
  );
}

export default PinterestTab;
