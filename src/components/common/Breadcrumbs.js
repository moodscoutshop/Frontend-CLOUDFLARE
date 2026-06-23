import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

/**
 * Breadcrumbs + Back button.
 *
 * @param {Array<{label: string, to?: string}>} items
 *        Ordered crumbs. Items without `to` render as the current page.
 * @param {string} [backTo]  Optional explicit path for the Back button.
 *        If omitted, the Back button uses browser history (navigate(-1)),
 *        which returns the user to wherever they came from.
 * @param {string} [backLabel='Back']
 */
export function Breadcrumbs({ items = [], backTo, backLabel = 'Back', className = '' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5D5F60] hover:text-[#1D1F20] bg-white border border-[#D4CFC0] rounded-lg px-3 py-1.5 hover:bg-[#FDFDF8] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={`${item.label}-${idx}`}>
              {item.to && !isLast ? (
                <Link to={item.to} className="text-[#5D5F60] hover:text-[#EB9D2A] transition-colors whitespace-nowrap">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`whitespace-nowrap ${isLast ? 'text-[#1D1F20] font-medium truncate max-w-[200px] sm:max-w-xs' : 'text-[#5D5F60]'}`}
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-[#C5BFAE] flex-shrink-0" />}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}

export default Breadcrumbs;
