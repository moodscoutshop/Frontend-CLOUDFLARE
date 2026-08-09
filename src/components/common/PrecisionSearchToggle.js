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
  // Remodeled to match the editorial design system "Precision Search" pill
  // toggle (see stitch_moodscout_design_system code.html). Keeps the help
  // tooltip and all existing on/off + auth-gate logic intact.
  if (variant === 'inline') {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange(!value)}
            aria-pressed={value}
            className={`group flex items-center gap-3 transition-all ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:opacity-80'}`}
          >
            {/* Pill toggle track + knob */}
            <span
              className={`relative h-6 w-12 rounded-full border transition-colors ${
                value
                  ? 'border-glowing-orange/50 bg-glowing-orange/15'
                  : 'border-outline/20 bg-surface-container group-hover:border-glowing-orange/50'
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-glowing-orange shadow-[0_0_10px_rgb(var(--c-primary)/0.4)] transition-all duration-200 ${
                  value ? 'left-7' : 'left-1'
                }`}
              />
            </span>

            {/* Label */}
            <span
              className={`font-label-eyebrow text-[11px] uppercase tracking-widest transition-colors ${
                value ? 'text-glowing-orange' : 'text-on-surface-variant group-hover:text-glowing-orange'
              }`}
            >
              Precision Search{value ? ' (On)' : ''}
            </span>
          </button>

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
            className={`transition-colors ${clickTooltipOpen ? 'text-glowing-orange' : value ? 'text-glowing-orange' : 'text-on-surface-variant/60 hover:text-glowing-orange'}`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Hover Tooltip - General info */}
        {hoverTooltipOpen && !clickTooltipOpen && (
          <div
            className="
              pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-[240px] -translate-x-1/2
              rounded-lg border border-outline/20 bg-surface-elevated px-3 py-2 text-xs
              leading-relaxed text-on-surface-variant shadow-lg sm:w-[280px]
             
            "
          >
            {hoverDescription}
            <div className="absolute bottom-full left-1/2 mb-[-1px] -translate-x-1/2">
              <div className="h-3 w-3 rotate-45 border-l border-t border-outline/20 bg-surface-elevated" />
            </div>
          </div>
        )}

        {/* Click Tooltip - Pros/Cons */}
        {clickTooltipOpen && (
          <div
            className="
              absolute left-1/2 top-full z-50 mt-2 w-[280px] -translate-x-1/2 rounded-lg
              border border-outline/20 bg-surface-elevated px-3 py-2.5 text-xs
              leading-relaxed text-on-surface-variant shadow-xl sm:w-[320px]
            "
          >
            {clickDescription}
            <div className="absolute bottom-full left-1/2 mb-[-1px] -translate-x-1/2">
              <div className="h-3 w-3 rotate-45 border-l border-t border-outline/20 bg-surface-elevated" />
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
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary hover:bg-background'}
            ${value
              ? 'bg-primary/10 border-primary'
              : 'bg-surface-elevated border-outline'}
          `}
        >
          {/* Toggle/Checkbox on left */}
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={`
                w-10 h-10 rounded-md flex items-center justify-center transition-colors
                ${value ? 'bg-primary/20' : 'bg-surface-section'}
              `}
            >
              <span
                className={`
                  relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                  ${value ? 'bg-primary' : 'bg-outline'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-surface-elevated shadow transition-transform
                    ${value ? 'translate-x-4' : 'translate-x-0.5'}
                  `}
                />
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-sm font-semibold ${value ? 'text-border-amber' : 'text-on-surface'}`}>
                Precision Search
              </span>
              {value && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-border-amber">
                  ON
                </span>
              )}
            </div>
            <p className="text-[10px] text-on-surface-variant leading-snug">
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
              className={`w-5 h-5 transition-colors ${clickTooltipOpen ? 'text-primary' : value ? 'text-primary' : 'text-outline'}`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </button>

        {/* Hover Tooltip - General info */}
        {hoverTooltipOpen && !clickTooltipOpen && (
          <div
            className="
              pointer-events-none absolute right-0 top-full z-50 mt-2 w-[240px] rounded-lg
              border border-outline/20 bg-surface-elevated px-3 py-2 text-xs
              leading-relaxed text-on-surface-variant shadow-lg sm:w-[280px]
             
            "
          >
            {hoverDescription}
          </div>
        )}

        {/* Click Tooltip - Pros/Cons */}
        {clickTooltipOpen && (
          <div
            className="
              absolute right-0 top-full z-50 mt-2 w-[280px] rounded-lg border border-outline/20
              bg-surface-elevated px-3 py-2.5 text-xs leading-relaxed text-on-surface-variant
              shadow-xl sm:w-[320px]
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