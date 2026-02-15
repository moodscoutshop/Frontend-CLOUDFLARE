import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar - Reusable search input component
 * Used in both landing page (centered) and results page (navbar)
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search...',
  size = 'lg', // 'sm', 'md', 'lg'
  variant = 'default', // 'default', 'navbar', 'minimal'
  disabled = false,
  loading = false,
  showSubmitButton = true,
  submitButtonText = 'Search',
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && value.trim()) {
      onSubmit(value);
    }
  };
  
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };
  
  // Size-specific styles
  const sizeStyles = {
    sm: {
      input: 'py-2 text-sm',
      icon: 'w-4 h-4',
      padding: 'pl-9 pr-8'
    },
    md: {
      input: 'py-3 text-base',
      icon: 'w-5 h-5',
      padding: 'pl-11 pr-10'
    },
    lg: {
      input: 'py-4 lg:py-5 text-base lg:text-lg',
      icon: 'w-5 h-5 lg:w-6 lg:h-6',
      padding: 'pl-5 pr-12'
    }
  };
  
  // Variant-specific styles
  const variantStyles = {
    default: `
      bg-gray-50 border-2 border-gray-200 rounded-full
      focus-within:border-purple-300 focus-within:shadow-xl focus-within:bg-white
      shadow-lg
    `,
    navbar: `
      bg-gray-100 border border-gray-200 rounded-full
      focus-within:border-purple-300 focus-within:bg-white focus-within:shadow-md
    `,
    minimal: `
      bg-transparent border-b-2 border-gray-200 rounded-none
      focus-within:border-purple-500
    `
  };
  
  const currentSize = sizeStyles[size];
  
  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className={`relative group ${variantStyles[variant]} transition-all duration-300`}>
        {/* Search Icon (left) - only for non-lg sizes */}
        {size !== 'lg' && (
          <Search
            className={`
              absolute left-3 top-1/2 -translate-y-1/2
              ${currentSize.icon} text-gray-400
              group-focus-within:text-purple-500 transition-colors
            `}
          />
        )}
        
        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full outline-none bg-transparent
            ${currentSize.input}
            ${size === 'lg' ? currentSize.padding : sizeStyles[size].padding}
            disabled:cursor-not-allowed disabled:opacity-50
            placeholder:text-gray-400
          `}
          {...props}
        />
        
        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className={`
              absolute ${size === 'lg' ? 'right-4' : 'right-3'} top-1/2 -translate-y-1/2
              p-1 rounded-full bg-gray-200 hover:bg-gray-300
              transition-colors z-10
            `}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Search Icon (right) - only for lg size when no value */}
        {size === 'lg' && !value && (
          <Search
            className={`
              absolute right-4 lg:right-5 top-1/2 -translate-y-1/2
              ${currentSize.icon} text-gray-400
            `}
          />
        )}
      </div>
      
      {/* Submit Button - external, shown only when specified */}
      {showSubmitButton && size === 'lg' && (
        <div className="flex gap-3 justify-center mt-6">
          <button
            type="submit"
            disabled={disabled || loading || !value.trim()}
            className="
              bg-gradient-to-r from-purple-600 to-pink-600 text-white
              px-6 lg:px-8 py-2.5 lg:py-3 rounded-full font-medium
              hover:shadow-lg hover:scale-105 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              flex items-center gap-2
            "
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                {submitButtonText}
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}

/**
 * NavbarSearchBar - Compact search bar for the results page navbar
 */
export function NavbarSearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search...',
  className = ''
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && value.trim()) {
      onSubmit(value);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={`relative flex-1 max-w-xl ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full py-2 pl-10 pr-8 text-sm
            bg-gray-100 border border-transparent rounded-full
            focus:bg-white focus:border-purple-300 focus:shadow-md
            outline-none transition-all duration-200
          "
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              p-1 rounded-full hover:bg-gray-200 transition-colors
            "
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>
    </form>
  );
}

export default SearchBar;
