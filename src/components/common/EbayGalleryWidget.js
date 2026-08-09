import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, ExternalLink, ChevronLeft, ChevronRight,
  ArrowUpDown, Loader2, AlertCircle, Grid3X3
} from 'lucide-react';

/**
 * EbayGalleryWidget
 *
 * A gallery-view eBay product widget that communicates with the backend proxy
 * endpoints (/search, /search_by_image). It provides:
 *   - Responsive card grid (gallery view)
 *   - Built-in eBay sorting (Best Match, Price low/high, Newly Listed)
 *   - Prev/Next pagination
 *   - Affiliate tracking via itemAffiliateWebUrl
 *
 * Props:
 *   searchEndpoint  - POST URL for keyword search  (required)
 *   imageSearchEndpoint - POST URL for image search (optional)
 *   searchKeyword   - initial keyword to search     (required)
 *   limit           - items per page (default 50)
 *   hideSortOptions - hide sorting dropdown
 */

const SORT_OPTIONS = [
  { label: 'Best Match', value: '-' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Newly Listed', value: 'newlyListed' },
];

export function EbayGalleryWidget({
  searchEndpoint,
  imageSearchEndpoint,
  searchKeyword = '',
  limit = 50,
  hideSortOptions = false,
  onItemClick,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [prevUrl, setPrevUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [sort, setSort] = useState('-');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Perform keyword search
  const doSearch = useCallback(async (paginationUrl = null) => {
    if (!searchEndpoint) return;
    setLoading(true);
    setError('');

    try {
      const body = {
        searchTerm: searchKeyword,
        limit,
        sort,
        marketplaceId: 'EBAY_US',
        charityIds: '',
        searchURL: paginationUrl || null,
      };

      const res = await fetch(searchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.errors?.length > 0) {
        setError(data.errors?.[0]?.message || `Search failed (${res.status})`);
        setItems([]);
        return;
      }

      setItems(data.itemSummaries || []);
      setTotal(data.total || 0);
      setOffset(data.offset || 0);
      setPrevUrl(data.prev || null);
      setNextUrl(data.next || null);
    } catch (err) {
      setError(err.message || 'Network error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchEndpoint, searchKeyword, limit, sort]);

  // Search on mount and when sort changes
  useEffect(() => {
    if (searchKeyword) {
      doSearch();
    }
  }, [searchKeyword, sort, doSearch]);

  // Format price
  const formatPrice = (price) => {
    if (!price) return null;
    const val = parseFloat(price.value);
    if (isNaN(val)) return null;
    const currency = price.currency === 'USD' ? '$' : price.currency + ' ';
    return `${currency}${val.toFixed(2)}`;
  };

  // Show strikethrough "was" price when Browse marketingPrice indicates a discount
  const getStrikethroughOriginal = (item) => {
    const original = item.marketingPrice?.originalPrice;
    if (!original) return null;
    const originalVal = parseFloat(original.value);
    const currentVal = parseFloat(item.price?.value);
    if (isNaN(originalVal) || isNaN(currentVal) || originalVal <= currentVal) return null;
    // eBay uses STRIKE_THROUGH or MARKDOWN for promotional was/now pricing
    const treatment = item.marketingPrice?.priceTreatment;
    if (treatment && treatment !== 'STRIKE_THROUGH' && treatment !== 'MARKDOWN') return null;
    return formatPrice(original);
  };

  // Get the best link (prefer affiliate URL)
  const getItemUrl = (item) => {
    return item.itemAffiliateWebUrl || item.itemWebUrl || '#';
  };

  const showingStart = offset + 1;
  const showingEnd = Math.min(offset + limit, total);

  return (
    <div className="bg-surface-elevated rounded-lg border border-[#D4CFC0] overflow-hidden shadow-md dark:border-outline/25">
      {/* Header with sort & pagination info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 bg-surface-container-low border-b border-[#D4CFC0] gap-2 dark:border-outline/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pinterest rounded-md flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface">eBay Results</h3>
            {total > 0 && (
              <p className="text-xs text-on-surface-variant">
                Showing {showingStart}–{showingEnd} of {total.toLocaleString()} results
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          {!hideSortOptions && (
            <div className="relative flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-on-surface-variant" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs bg-white border border-[#C5BFAE] rounded-md px-2 py-1.5 text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-surface-bright dark:border-outline/30"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => prevUrl && doSearch(prevUrl)}
              disabled={!prevUrl || loading}
              className="p-1.5 rounded-md border border-[#C5BFAE] bg-white text-on-surface-variant hover:bg-[#F8F7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-outline/30 dark:bg-surface-elevated dark:hover:bg-surface-container-low"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextUrl && doSearch(nextUrl)}
              disabled={!nextUrl || loading}
              className="p-1.5 rounded-md border border-[#C5BFAE] bg-white text-on-surface-variant hover:bg-[#F8F7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-outline/30 dark:bg-surface-elevated dark:hover:bg-surface-container-low"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 bg-[#FDFDF8] dark:bg-surface-container-low">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 text-sm text-on-surface-variant">Searching eBay...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && searchKeyword && (
          <div className="text-center py-12">
            <Grid3X3 className="w-10 h-10 text-outline mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant">No eBay results found for "{searchKeyword}"</p>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {items.map((item) => {
              const currentPrice = formatPrice(item.price);
              const originalPrice = getStrikethroughOriginal(item);
              return (
              <a
                key={item.itemId}
                href={getItemUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-lg border border-[#C5BFAE] hover:border-primary hover:shadow-md overflow-hidden transition-all dark:bg-surface-bright dark:border-outline/35"
                onClick={(e) => {
                  if (onItemClick) {
                    e.preventDefault();
                    onItemClick(getItemUrl(item), item.title);
                  }
                }}
              >
                {/* Image */}
                <div className="aspect-square bg-surface-section overflow-hidden">
                  <img
                    src={item.image?.imageUrl || ''}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.freeiconspng.com/uploads/no-image-icon-6.png';
                    }}
                  />
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <h4 className="text-xs sm:text-sm font-medium text-on-surface line-clamp-2 leading-snug group-hover:text-accent-blue transition-colors">
                    {item.title}
                  </h4>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    {currentPrice ? (
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        {originalPrice && (
                          <span className="text-xs text-on-surface-variant line-through flex-shrink-0">
                            {originalPrice}
                          </span>
                        )}
                        <span className="text-sm font-bold text-accent-blue truncate">
                          {currentPrice}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant">See price</span>
                    )}
                    <ExternalLink className="w-3 h-3 text-outline group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                  {item.condition && (
                    <span className="inline-block mt-1 text-[10px] text-on-surface-variant bg-surface-section px-1.5 py-0.5 rounded">
                      {item.condition}
                    </span>
                  )}
                </div>
              </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer pagination */}
      {!loading && items.length > 0 && (prevUrl || nextUrl) && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-surface-container-low border-t border-[#D4CFC0] dark:border-outline/20">
          <p className="text-xs text-on-surface-variant">
            Showing {showingStart}–{showingEnd} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevUrl && doSearch(prevUrl)}
              disabled={!prevUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-[#C5BFAE] rounded-md bg-white text-on-surface-variant hover:bg-[#F8F7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-outline/30 dark:bg-surface-elevated dark:hover:bg-surface-container"
            >
              <ChevronLeft className="w-3 h-3" />
              Prev
            </button>
            <button
              onClick={() => nextUrl && doSearch(nextUrl)}
              disabled={!nextUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-[#C5BFAE] rounded-md bg-white text-on-surface-variant hover:bg-[#F8F7F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-outline/30 dark:bg-surface-elevated dark:hover:bg-surface-container"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EbayGalleryWidget;
