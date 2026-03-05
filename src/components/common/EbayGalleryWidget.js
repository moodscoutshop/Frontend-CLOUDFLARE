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

  // Get the best link (prefer affiliate URL)
  const getItemUrl = (item) => {
    return item.itemAffiliateWebUrl || item.itemWebUrl || '#';
  };

  const showingStart = offset + 1;
  const showingEnd = Math.min(offset + limit, total);

  return (
    <div className="bg-white rounded-lg border border-[#D4CFC0] overflow-hidden shadow-md">
      {/* Header with sort & pagination info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 bg-[#FDFDF8] border-b border-[#D4CFC0] gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E53238] rounded-md flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1D1F20]">eBay Results</h3>
            {total > 0 && (
              <p className="text-xs text-[#5D5F60]">
                Showing {showingStart}–{showingEnd} of {total.toLocaleString()} results
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          {!hideSortOptions && (
            <div className="relative flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5D5F60]" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-xs bg-white border border-[#D4CFC0] rounded-md px-2 py-1.5 text-[#3D3F40] focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/30 focus:border-[#EB9D2A]"
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
              className="p-1.5 rounded-md border border-[#D4CFC0] bg-white text-[#5D5F60] hover:bg-[#EEEFE9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextUrl && doSearch(nextUrl)}
              disabled={!nextUrl || loading}
              className="p-1.5 rounded-md border border-[#D4CFC0] bg-white text-[#5D5F60] hover:bg-[#EEEFE9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#EB9D2A] animate-spin" />
            <span className="ml-3 text-sm text-[#5D5F60]">Searching eBay...</span>
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
            <Grid3X3 className="w-10 h-10 text-[#D4CFC0] mx-auto mb-3" />
            <p className="text-sm text-[#5D5F60]">No eBay results found for "{searchKeyword}"</p>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {items.map((item) => (
              <a
                key={item.itemId}
                href={getItemUrl(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#FDFDF8] rounded-lg border border-[#EEEFE9] hover:border-[#EB9D2A] hover:shadow-md overflow-hidden transition-all"
                onClick={(e) => {
                  if (onItemClick) {
                    e.preventDefault();
                    onItemClick(getItemUrl(item), item.title);
                  }
                }}
              >
                {/* Image */}
                <div className="aspect-square bg-[#EEEFE9] overflow-hidden">
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
                  <h4 className="text-xs sm:text-sm font-medium text-[#1D1F20] line-clamp-2 leading-snug group-hover:text-[#0654BA] transition-colors">
                    {item.title}
                  </h4>
                  <div className="mt-1.5 flex items-center justify-between">
                    {formatPrice(item.price) ? (
                      <span className="text-sm font-bold text-[#1D4AFF]">{formatPrice(item.price)}</span>
                    ) : (
                      <span className="text-xs text-[#5D5F60]">See price</span>
                    )}
                    <ExternalLink className="w-3 h-3 text-[#D4CFC0] group-hover:text-[#EB9D2A] transition-colors" />
                  </div>
                  {item.condition && (
                    <span className="inline-block mt-1 text-[10px] text-[#5D5F60] bg-[#EEEFE9] px-1.5 py-0.5 rounded">
                      {item.condition}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer pagination */}
      {!loading && items.length > 0 && (prevUrl || nextUrl) && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#FDFDF8] border-t border-[#D4CFC0]">
          <p className="text-xs text-[#5D5F60]">
            Showing {showingStart}–{showingEnd} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevUrl && doSearch(prevUrl)}
              disabled={!prevUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-[#D4CFC0] rounded-md bg-white text-[#3D3F40] hover:bg-[#EEEFE9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Prev
            </button>
            <button
              onClick={() => nextUrl && doSearch(nextUrl)}
              disabled={!nextUrl}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-[#D4CFC0] rounded-md bg-white text-[#3D3F40] hover:bg-[#EEEFE9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
