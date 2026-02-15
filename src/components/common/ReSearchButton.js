import React from 'react';
import { Search, Loader2 } from 'lucide-react';

/**
 * ReSearchButton - Action button for triggering a re-search from modified data.
 *
 * Uses the site's global `btn-primary` class (amber raised button with
 * hover lift animation) so it matches the "View All Articles" button on
 * the landing page and every other primary CTA on the site.
 *
 * Props:
 *   label       - Button text (e.g., "Search Selected Images")
 *   onClick     - Click handler
 *   disabled    - Disable the button
 *   loading     - Show loading spinner
 *   count       - Optional count to display (e.g., number of selected images)
 *   className   - Additional CSS classes
 */
export function ReSearchButton({
  label = 'Search',
  onClick,
  disabled = false,
  loading = false,
  count,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        btn-primary inline-flex items-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Search className="w-4 h-4" />
      )}
      <span>{label}</span>
      {count != null && (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold rounded-full bg-[#1D1F20]/15">
          {count}
        </span>
      )}
    </button>
  );
}

export default ReSearchButton;
