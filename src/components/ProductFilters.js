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
                ? 'bg-purple-600 text-white border-2 border-dashed border-purple-300 shadow-md' 
                : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-transparent hover:border-purple-300'
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
            bg-gray-100 text-gray-600 border-2 border-transparent 
            hover:bg-gray-200 hover:border-gray-300 transition-all duration-200"
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
 * @param {Array} products - Array of products with categories
 * @returns {Object} Tree structure of categories
 */
export function buildCategoryTree(products) {
  const tree = {};
  
  products.forEach(product => {
    const categories = product.categories || [];
    // Each product may have multiple category paths
    categories.forEach(categoryPath => {
      if (typeof categoryPath === 'string') {
        // Split by common separators: " > ", " / ", " | "
        const parts = categoryPath.split(/\s*[>\/|]\s*/).filter(Boolean);
        let currentLevel = tree;
        
        parts.forEach((part, index) => {
          const trimmedPart = part.trim();
          if (!currentLevel[trimmedPart]) {
            currentLevel[trimmedPart] = {
              name: trimmedPart,
              fullPath: parts.slice(0, index + 1).join(' > '),
              children: {},
              count: 0
            };
          }
          currentLevel[trimmedPart].count++;
          currentLevel = currentLevel[trimmedPart].children;
        });
      }
    });
  });
  
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
          ${isSelected ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'}
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
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
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
              ? 'bg-purple-600 border-purple-600' 
              : 'border-gray-300 hover:border-purple-400'
            }
          `}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </button>
        
        {/* Category name and count */}
        <span 
          onClick={() => onCategoryToggle(node.fullPath)}
          className={`flex-1 text-sm ${isSelected ? 'font-medium' : ''}`}
        >
          {node.name}
        </span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {node.count}
        </span>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l-2 border-gray-100 ml-6">
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
  const dropdownRef = useRef(null);
  
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
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200
          ${selectedCategories.length > 0 
            ? 'bg-purple-50 border-purple-300 text-purple-700' 
            : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
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
        <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
          {/* Header */}
          <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">Filter by Category</span>
              {selectedCategories.length > 0 && (
                <button
                  onClick={onClearCategories}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
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
              flex items-center gap-2 px-4 py-3 cursor-pointer border-b border-gray-50
              ${isDefaultSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}
            `}
          >
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
              ${isDefaultSelected 
                ? 'bg-purple-600 border-purple-600' 
                : 'border-gray-300 hover:border-purple-400'
              }
            `}>
              {isDefaultSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${isDefaultSelected ? 'font-medium text-purple-700' : 'text-gray-600'}`}>
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
    
    // Category filter (product must match at least one selected category path)
    let matchesCategory = true;
    if (selectedCategories.length > 0) {
      const productCategories = product.categories || [];
      matchesCategory = selectedCategories.some(selectedCat => 
        productCategories.some(prodCat => {
          if (typeof prodCat !== 'string') return false;
          // Check if product category matches or starts with selected category
          return prodCat.toLowerCase().includes(selectedCat.toLowerCase()) ||
                 selectedCat.toLowerCase().includes(prodCat.toLowerCase());
        })
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
