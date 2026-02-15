import React from 'react';
import { X, RotateCcw } from 'lucide-react';

/**
 * ImageSelectionOverlay - A cross/undo button overlay for masonry images.
 * 
 * When the image is selected (default), shows an X button in the top-right corner.
 * When the image is deselected, the image is greyed out and an undo button appears.
 * 
 * Props:
 *   isDeselected - Whether this image has been crossed out
 *   onToggle     - Callback to toggle selection state
 *   disabled     - If true, the button is hidden (e.g., last remaining image)
 */
export function ImageSelectionOverlay({ isDeselected, onToggle, disabled = false }) {
  if (disabled) return null;

  return (
    <>
      {/* Grey overlay when deselected */}
      {isDeselected && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 rounded-lg transition-all duration-300" />
      )}

      {/* Toggle button - always visible */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`
          absolute top-2 right-2 z-20
          w-7 h-7 rounded-full
          flex items-center justify-center
          transition-all duration-200
          shadow-md border
          ${isDeselected
            ? 'bg-[#EB9D2A] border-[#CD8407] text-white hover:bg-[#CD8407]'
            : 'bg-white/90 border-[#D4CFC0] text-[#5D5F60] hover:bg-red-50 hover:text-red-500 hover:border-red-300'
          }
        `}
        title={isDeselected ? 'Re-select image' : 'Deselect image'}
      >
        {isDeselected ? (
          <RotateCcw className="w-3.5 h-3.5" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Deselected label */}
      {isDeselected && (
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#5D5F60] bg-white/80 rounded-full border border-[#D4CFC0]">
            <X className="w-3 h-3" />
            Excluded
          </span>
        </div>
      )}
    </>
  );
}

export default ImageSelectionOverlay;
