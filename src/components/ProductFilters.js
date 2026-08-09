import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tag, X, ChevronDown, ChevronRight, Check, Filter } from 'lucide-react';

/**
 * ProductFilters Component
 * Handles keyword and category filtering for eBay products
 */

// ============================================================================
// KEYWORD FILTER BADGES
// ============================================================================
export function KeywordFilterBadges({ 
  keywords = [], 
  selectedKeywords = [], 
  onKeywordToggle, 
  onClearAll 
}) {
  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {keywords.map((keyword, idx) => {
        const isSelected = selectedKeywords.includes(keyword);
        return (
          <button
            key={`keyword-${idx}`}
            onClick={() => onKeywordToggle(keyword)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full 
              transition-all duration-200 cursor-pointer
              ${isSelected 
                ? 'bg-primary text-on-primary-strong border-2 border-dashed border-shadow-amber shadow-md' 
                : 'bg-primary/15 text-border-amber border-2 border-transparent hover:border-primary'
              }
            `}
          >
            {isSelected ? (
              <X className="w-3 h-3" />
            ) : (
              <Tag className="w-3 h-3" />
            )}
            {keyword}
          </button>
        );
      })}
      
      {/* Clear button - only show when there are selections */}
      {selectedKeywords.length > 0 && (
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full 
            bg-surface-section text-on-surface-variant border-2 border-transparent 
            hover:bg-surface-container-low hover:border-outline/20 transition-all duration-200"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CATEGORY TREE DROPDOWN
// ============================================================================

/**
 * Build a hierarchical tree from category paths
 * Categories are flat strings, so we count products per unique category
 * @param {Array} products - Array of products with categories
 * @returns {Object} Tree structure of categories with accurate counts
 */
export function buildCategoryTree(products) {
  const tree = {};
  
  // First, build the tree structure with product sets for accurate counting
  const categoryProductMap = new Map(); // Maps category name -> Set of product IDs
  
  products.forEach((product, productIndex) => {
    const categories = product.categories || [];
    const productId = product.id || `product-${productIndex}`;
    
    categories.forEach(categoryPath => {
      if (typeof categoryPath === 'string' && categoryPath.trim()) {
        const trimmedCategory = categoryPath.trim();
        
        // Track which products belong to each category
        if (!categoryProductMap.has(trimmedCategory)) {
          categoryProductMap.set(trimmedCategory, new Set());
        }
        categoryProductMap.get(trimmedCategory).add(productId);
        
        // Build tree structure (treat each category as a flat item, no hierarchy splitting)
        if (!tree[trimmedCategory]) {
          tree[trimmedCategory] = {
            name: trimmedCategory,
            fullPath: trimmedCategory,
            children: {},
            count: 0
          };
        }
      }
    });
  });
  
  // Now set counts based on unique products per category
  for (const [categoryName, productIds] of categoryProductMap) {
    if (tree[categoryName]) {
      tree[categoryName].count = productIds.size;
    }
  }
  
  return tree;
}

/**
 * Get all unique category paths from products
 * @param {Array} products - Array of products
 * @returns {Array} Array of unique category strings
 */
export function getUniqueCategoryPaths(products) {
  const paths = new Set();
  
  products.forEach(product => {
    const categories = product.categories || [];
    categories.forEach(cat => {
      if (typeof cat === 'string' && cat.trim()) {
        paths.add(cat.trim());
      }
    });
  });
  
  return Array.from(paths).sort();
}

/**
 * CategoryTreeItem - Recursive tree node component
 */
function CategoryTreeItem({ 
  node, 
  level = 0, 
  selectedCategories, 
  onCategoryToggle,
  expandedNodes,
  onToggleExpand
}) {
  const hasChildren = Object.keys(node.children).length > 0;
  const isSelected = selectedCategories.includes(node.fullPath);
  const isExpanded = expandedNodes.includes(node.fullPath);
  
  // Check if any child is selected
  const hasSelectedChild = Object.values(node.children).some(child => 
    selectedCategories.includes(child.fullPath) || 
    Object.values(child.children).some(grandChild => selectedCategories.includes(grandChild.fullPath))
  );
  
  return (
    <div className="w-full">
      <div 
        className={`
          flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-all duration-200
          ${isSelected ? 'bg-primary/15 text-border-amber' : 'hover:bg-surface-section'}
          ${level > 0 ? 'ml-4' : ''}
        `}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {/* Expand/Collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.fullPath);
            }}
            className="p-0.5 hover:bg-surface-navbar rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-on-surface-variant" />
            ) : (
              <ChevronRight className="w-4 h-4 text-on-surface-variant" />
            )}
          </button>
        ) : (
          <span className="w-5" /> // Spacer for alignment
        )}
        
        {/* Checkbox */}
        <button
          onClick={() => onCategoryToggle(node.fullPath)}
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
            ${isSelected 
              ? 'bg-primary border-primary' 
              : 'bg-white border-[#C5BFAE] hover:border-primary dark:bg-transparent dark:border-outline/20'
            }
          `}
        >
          {isSelected && <Check className="w-3 h-3 text-on-primary-strong" />}
        </button>
        
        {/* Category name and count */}
        <span 
          onClick={() => onCategoryToggle(node.fullPath)}
          className={`flex-1 text-sm break-words min-w-0 ${isSelected ? 'font-medium' : ''}`}
        >
          {node.name}
        </span>
        <span className="text-xs text-on-surface-variant bg-surface-section px-2 py-0.5 rounded-full flex-shrink-0">
          {node.count}
        </span>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-surface-section ml-6">
          {Object.values(node.children).map((child, idx) => (
            <CategoryTreeItem
              key={`${child.fullPath}-${idx}`}
              node={child}
              level={level + 1}
              selectedCategories={selectedCategories}
              onCategoryToggle={onCategoryToggle}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * useDropdownPosition - Hook to dynamically calculate dropdown position
 * Returns { alignment: 'left' | 'center' | 'right', direction: 'down' | 'up' }
 *
 * The hook measures the trigger button and viewport on open / resize / scroll
 * and picks the alignment that keeps the dropdown fully on-screen.
 */
function useDropdownPosition(isOpen, triggerRef, dropdownRef) {
  const [position, setPosition] = useState({ alignment: 'left', direction: 'down' });
  
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    
    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Measure the actual dropdown panel width if it exists, else estimate
      const dropdownEl = dropdownRef?.current;
      const dropdownWidth = dropdownEl ? dropdownEl.scrollWidth : 320;
      const dropdownHeight = 384; // max-h-96
      
      // --- Horizontal alignment ---
      const spaceOnRight = viewportWidth - rect.left;    // space from trigger left edge
      const spaceOnLeft  = rect.right;                   // space from trigger right edge
      const triggerCenter = rect.left + rect.width / 2;
      const halfDd = dropdownWidth / 2;

      let alignment;
      if (spaceOnRight >= dropdownWidth) {
        // Enough room to open left-aligned (dropdown extends right)
        alignment = 'left';
      } else if (spaceOnLeft >= dropdownWidth) {
        // Enough room to open right-aligned (dropdown extends left)
        alignment = 'right';
      } else if (triggerCenter - halfDd >= 8 && triggerCenter + halfDd <= viewportWidth - 8) {
        // Center-aligned fits
        alignment = 'center';
      } else {
        // Fallback: pick whichever side has more room
        alignment = spaceOnRight >= spaceOnLeft ? 'left' : 'right';
      }
      
      // --- Vertical direction ---
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const direction = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'down' : 'up';
      
      setPosition({ alignment, direction });
    };
    
    // Run once immediately, then again on next frame so the dropdown element
    // has rendered and we can measure its real width.
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef, dropdownRef]);
  
  return position;
}

/**
 * CategoryDropdown - Main category filter dropdown component
 */
export function CategoryDropdown({ 
  products = [], 
  selectedCategories = [], 
  onCategoryToggle, 
  onClearCategories 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const dropdownRef = useRef(null); // wrapper
  const position = useDropdownPosition(isOpen, triggerRef, panelRef);
  
  // Build category tree from products
  const categoryTree = useMemo(() => buildCategoryTree(products), [products]);
  const hasCategories = Object.keys(categoryTree).length > 0;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const handleToggleExpand = (path) => {
    setExpandedNodes(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };
  
  const handleCategorySelect = (categoryPath) => {
    if (categoryPath === 'default') {
      onClearCategories();
    } else {
      onCategoryToggle(categoryPath);
    }
  };
  
  // Expand all top-level nodes by default when opening
  useEffect(() => {
    if (isOpen && expandedNodes.length === 0) {
      setExpandedNodes(Object.values(categoryTree).map(node => node.fullPath));
    }
  }, [isOpen, categoryTree]);
  
  if (!hasCategories) return null;
  
  const isDefaultSelected = selectedCategories.length === 0;
  
  const alignmentClass =
    position.alignment === 'center' ? 'left-1/2 -translate-x-1/2' :
    position.alignment === 'right'  ? 'right-0' : 'left-0';

  const dropdownClasses = `
    absolute min-w-[20rem] max-w-[min(28rem,90vw)] max-h-96
    overflow-y-auto overflow-x-hidden
    bg-surface-container-low rounded-lg shadow-xl border border-outline/10 z-50
    ${position.direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'}
    ${alignmentClass}
  `;
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
          ${selectedCategories.length > 0 
            ? 'bg-primary/15 border-primary text-border-amber' 
            : 'bg-white border-[#C5BFAE] text-on-surface-variant hover:border-primary dark:bg-surface-elevated dark:border-outline/20'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedCategories.length > 0 
            ? `${selectedCategories.length} Categories`
            : 'All Categories'
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown panel */}
      {isOpen && (
        <div ref={panelRef} className={dropdownClasses}>
          {/* Header */}
          <div className="sticky top-0 bg-surface-container-low px-4 py-3 border-b border-outline/10">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-on-surface">Filter by Category</span>
              {selectedCategories.length > 0 && (
                <button
                  onClick={onClearCategories}
                  className="text-xs text-primary hover:text-shadow-amber font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          {/* Default option */}
          <div 
            onClick={() => handleCategorySelect('default')}
            className={`
              flex items-center gap-2 px-4 py-3 cursor-pointer border-b border-surface-section
              ${isDefaultSelected ? 'bg-primary/10' : 'hover:bg-surface-section'}
            `}
          >
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
              ${isDefaultSelected 
                ? 'bg-primary border-primary' 
                : 'bg-white border-[#C5BFAE] hover:border-primary dark:bg-transparent dark:border-outline/20'
              }
            `}>
              {isDefaultSelected && <Check className="w-3 h-3 text-on-primary-strong" />}
            </div>
            <span className={`text-sm ${isDefaultSelected ? 'font-medium text-border-amber' : 'text-on-surface-variant'}`}>
              All Categories (Default)
            </span>
          </div>
          
          {/* Category tree */}
          <div className="py-2">
            {Object.values(categoryTree).map((node, idx) => (
              <CategoryTreeItem
                key={`${node.fullPath}-${idx}`}
                node={node}
                level={0}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategorySelect}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILTER LOGIC HELPER
// ============================================================================

/**
 * Filter products based on selected keywords and categories
 * Uses AND logic: products must match ALL selected filters
 * @param {Array} products - All products
 * @param {Array} selectedKeywords - Selected keyword filters
 * @param {Array} selectedCategories - Selected category filters
 * @returns {Array} Filtered products
 */
export function filterProducts(products, selectedKeywords = [], selectedCategories = []) {
  if (!products || products.length === 0) return [];
  
  // If no filters selected, return all products
  if (selectedKeywords.length === 0 && selectedCategories.length === 0) {
    return products;
  }
  
  return products.filter(product => {
    // Keyword filter (AND within keywords - product must match at least one selected keyword)
    let matchesKeyword = true;
    if (selectedKeywords.length > 0) {
      const productKeyword = product.search_query || '';
      matchesKeyword = selectedKeywords.some(keyword => 
        productKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase() === productKeyword.toLowerCase()
      );
    }
    
    // Category filter (product must have at least one selected category - EXACT match)
    let matchesCategory = true;
    if (selectedCategories.length > 0) {
      const productCategories = product.categories || [];
      // Use case-insensitive EXACT matching for categories
      const productCategoriesLower = productCategories.map(cat => 
        typeof cat === 'string' ? cat.toLowerCase().trim() : ''
      );
      
      matchesCategory = selectedCategories.some(selectedCat => 
        productCategoriesLower.includes(selectedCat.toLowerCase().trim())
      );
    }
    
    // AND logic: must match both filters
    return matchesKeyword && matchesCategory;
  });
}

/**
 * Get unique keywords from products
 * @param {Array} products - Array of products
 * @returns {Array} Unique keywords
 */
export function getUniqueKeywords(products) {
  const keywords = new Set();
  products.forEach(product => {
    if (product.search_query) {
      keywords.add(product.search_query);
    }
  });
  return Array.from(keywords);
}

export default {
  KeywordFilterBadges,
  CategoryDropdown,
  filterProducts,
  getUniqueKeywords,
  buildCategoryTree,
  getUniqueCategoryPaths
};
