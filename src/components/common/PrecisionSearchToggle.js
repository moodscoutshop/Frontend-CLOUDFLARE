import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * PrecisionSearchToggle
 * - Supports two variants: 'card' (full layout for dropdown) and 'inline' (compact button for main search)
 * - Card variant: Toggle on left, description text, help icon on right
 * - Inline variant: Compact button with toggle, label, and help icon
 * - Help icon tooltips:
 *   - Hover: Shows general description
 *   - Click: Shows detailed pros/cons breakdown
 */
export function PrecisionSearchToggle({
  value,
  onChange,
  disabled = false,
  variant = 'card', // 'card' or 'inline'
  className = '',
}) {
  const [clickTooltipOpen, setClickTooltipOpen] = useState(false);
  const [hoverTooltipOpen, setHoverTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  const shortDescription = 'Generate highly specific product descriptions.';
  
  // General info for hover tooltip
  const hoverDescription = 'Generates highly specific product descriptions (model, style, details) instead of general terms.';
  
  // Pros/cons for click tooltip
  const clickDescription = (
    <div>
      <div className="mb-1">
        <div className="mb-0.5"><span className="font-semibold text-green-700">Pro:</span> Finds more accurate results tailored to your style.</div>
        <div><span className="font-semibold text-red-600">Con:</span> May fetch fewer results because it narrows down the search.</div>
      </div>
    </div>
  );

  // Close click tooltip when clicking outside
  useEffect(() => {
    if (!clickTooltipOpen) return;
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setClickTooltipOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [clickTooltipOpen]);

  // Inline/Compact variant (for main search area)
  if (variant === 'inline') {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange && onChange(!value)}
          className={`
            w-full min-h-[36px] sm:min-h-[40px] px-4 sm:px-8 flex items-center justify-center gap-2 sm:gap-3 rounded-md border transition-all
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#EB9D2A]'}
            ${value 
              ? 'bg-[#EB9D2A]/15 border-[#EB9D2A] text-[#B17816]' 
              : 'bg-white border-[#D4CFC0] text-[#3D3F40]'}
          `}
        >
          {/* Toggle switch */}
          <span className={`
            relative inline-flex h-4 w-8 sm:h-5 sm:w-9 items-center rounded-full transition-colors
            ${value ? 'bg-[#EB9D2A]' : 'bg-[#D4CFC0]'}
          `}>
            <span className={`
              inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white shadow transition-transform
              ${value ? 'translate-x-4 sm:translate-x-4' : 'translate-x-0.5 sm:translate-x-0.5'}
            `} />
          </span>

          {/* Label */}
          <span className="font-medium text-sm sm:text-base">
            Precision Search {value && <span className="text-xs">(ON)</span>}
          </span>

          {/* Help icon - hover shows general info, click shows pros/cons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setClickTooltipOpen((v) => !v);
              setHoverTooltipOpen(false); // Hide hover tooltip when clicking
            }}
            onMouseEnter={() => {
              if (!clickTooltipOpen) setHoverTooltipOpen(true);
            }}
            onMouseLeave={() => {
              setHoverTooltipOpen(false);
            }}
            ref={tooltipRef}
            className={`transition-colors ${clickTooltipOpen ? 'text-[#EB9D2A]' : value ? 'text-[#B17816]' : 'text-[#A0A2A3]'}`}
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </button>

        {/* Hover Tooltip - General info */}
        {hoverTooltipOpen && !clickTooltipOpen && (
          <div
            className="
              absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2
              w-[240px] sm:w-[280px]
              rounded-lg border border-[#D4CFC0] bg-white
              px-3 py-2 text-xs text-[#5D5F60] leading-relaxed
              shadow-lg pointer-events-none
            "
          >
            {hoverDescription}
            {/* Arrow pointing up */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[-1px]">
              <div className="w-3 h-3 bg-white border-l border-t border-[#D4CFC0] rotate-45 transform" />
            </div>
          </div>
        )}

        {/* Click Tooltip - Pros/Cons */}
        {clickTooltipOpen && (
          <div
            className="
              absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2
              w-[280px] sm:w-[320px]
              rounded-lg border border-[#F5E9C8] bg-[#FDFDF8] 
              px-3 py-2.5 text-xs text-[#5D5F60] leading-relaxed
              shadow-xl
            "
          >
            {clickDescription}
            {/* Arrow pointing up */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[-1px]">
              <div className="w-3 h-3 bg-[#FDFDF8] border-l border-t border-[#F5E9C8] rotate-45 transform" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Card variant (for dropdown/modal)
  return (
    <div className={className}>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange && onChange(!value)}
          className={`
            w-full flex items-start gap-3 p-3 rounded-lg border text-left
            transition-all duration-200
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#EB9D2A] hover:bg-[#FDFDF8]'}
            ${value
              ? 'bg-[#EB9D2A]/10 border-[#EB9D2A]'
              : 'bg-white border-[#D4CFC0]'}
          `}
        >
          {/* Toggle/Checkbox on left */}
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={`
                w-10 h-10 rounded-md flex items-center justify-center transition-colors
                ${value ? 'bg-[#EB9D2A]/20' : 'bg-[#EEEFE9]'}
              `}
            >
              <span
                className={`
                  relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                  ${value ? 'bg-[#EB9D2A]' : 'bg-[#D4CFC0]'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${value ? 'translate-x-4' : 'translate-x-0.5'}
                  `}
                />
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-sm font-semibold ${value ? 'text-[#B17816]' : 'text-[#1D1F20]'}`}>
                Precision Search
              </span>
              {value && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EB9D2A]/20 text-[#B17816]">
                  ON
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#5D5F60] leading-snug">
              {shortDescription}
            </p>
          </div>

          {/* Help icon on right - hover shows general info, click shows pros/cons */}
          <div className="flex-shrink-0" ref={tooltipRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setClickTooltipOpen((v) => !v);
                setHoverTooltipOpen(false); // Hide hover tooltip when clicking
              }}
              onMouseEnter={() => {
                if (!clickTooltipOpen) setHoverTooltipOpen(true);
              }}
              onMouseLeave={() => {
                setHoverTooltipOpen(false);
              }}
              className={`w-5 h-5 transition-colors ${clickTooltipOpen ? 'text-[#EB9D2A]' : value ? 'text-[#EB9D2A]' : 'text-[#D4CFC0]'}`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </button>

        {/* Hover Tooltip - General info */}
        {hoverTooltipOpen && !clickTooltipOpen && (
          <div
            className="
              absolute z-50 right-0 top-full mt-2
              w-[240px] sm:w-[280px]
              rounded-lg border border-[#D4CFC0] bg-white
              px-3 py-2 text-xs text-[#5D5F60] leading-relaxed
              shadow-lg pointer-events-none
            "
          >
            {hoverDescription}
          </div>
        )}

        {/* Click Tooltip - Pros/Cons */}
        {clickTooltipOpen && (
          <div
            className="
              absolute z-50 right-0 top-full mt-2
              w-[280px] sm:w-[320px]
              rounded-lg border border-[#F5E9C8] bg-[#FDFDF8] 
              px-3 py-2.5 text-xs text-[#5D5F60] leading-relaxed
              shadow-xl
            "
          >
            {clickDescription}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrecisionSearchToggle;