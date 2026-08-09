import React from 'react';

/**
 * Button - Reusable button component with multiple variants
 * Variants: primary, secondary, outline, ghost, danger
 * Sizes: sm, md, lg
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-medium
    transition-all duration-300 rounded
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;
  
  const variantStyles = {
    primary: `
      bg-[#EB9D2A] text-[#1D1F20]
      hover:bg-[#CD8407] hover:shadow-lg
      focus:ring-[#EB9D2A]
    `,
    secondary: `
      bg-white text-[#3D3F40] border border-[#D4CFC0]
      hover:bg-[#EEEFE9] hover:text-[#1D1F20]
      focus:ring-[#EB9D2A]
    `,
    outline: `
      bg-transparent border-2 border-[#EB9D2A] text-[#EB9D2A]
      hover:bg-[#EB9D2A]/10
      focus:ring-[#EB9D2A]
    `,
    ghost: `
      bg-transparent text-[#5D5F60]
      hover:bg-[#EEEFE9] hover:text-[#1D1F20]
      focus:ring-[#D4CFC0]
    `,
    danger: `
      bg-red-500 text-white
      hover:bg-red-600 hover:shadow-lg
      focus:ring-red-500
    `,
    glass: `
      bg-white/60 backdrop-blur-md border border-[#D4CFC0] text-[#3D3F40]
      hover:bg-[#EB9D2A]/10 hover:text-[#B17816] hover:shadow-md
      focus:ring-[#EB9D2A]
    `
  };
  
  const sizeStyles = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyles}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          {children && <span>Loading...</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
}

/**
 * LoadingSpinner - Animated loading spinner
 */
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };
  
  return (
    <div
      className={`
        ${sizeStyles[size]}
        border-current border-t-transparent
        rounded-full animate-spin
        ${className}
      `}
    />
  );
}

/**
 * Badge - Small label/tag component
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  icon,
  className = ''
}) {
  const variantStyles = {
    default: 'bg-[#EEEFE9] text-[#3D3F40]',
    primary: 'bg-[#EB9D2A]/20 text-[#B17816]',
    secondary: 'bg-[#EEEFE9] text-[#5D5F60]',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    gradient: 'bg-[#EB9D2A]/15 text-[#B17816]'
  };
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && icon}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity ml-0.5"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
}

/**
 * Tooltip - Tooltip component with auto-fade
 */
export function Tooltip({
  children,
  content,
  position = 'top',
  visible = false,
  autoHide = true,
  autoHideDelay = 3000,
  className = ''
}) {
  const [isVisible, setIsVisible] = React.useState(visible);
  
  React.useEffect(() => {
    setIsVisible(visible);
    
    if (visible && autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [visible, autoHide, autoHideDelay]);
  
  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  return (
    <div className="relative inline-block">
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 whitespace-nowrap rounded-lg border border-outline/20
            bg-surface-elevated px-3 py-2 text-sm text-on-surface shadow-lg
            animate-fade-in dark:border-white/15 dark:bg-[#1C1A28]
            ${positionStyles[position]}
            ${className}
          `}
        >
          {content}
          <div
            className={`
              absolute h-2 w-2 rotate-45 border-outline/20 bg-surface-elevated
              dark:border-white/15 dark:bg-[#1C1A28]
              ${position === 'top' ? 'top-full -mt-1 left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'bottom-full -mb-1 left-1/2 -translate-x-1/2' : ''}
              ${position === 'left' ? 'left-full -ml-1 top-1/2 -translate-y-1/2' : ''}
              ${position === 'right' ? 'right-full -mr-1 top-1/2 -translate-y-1/2' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Input - Reusable input component
 */
export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  iconPosition = 'left',
  error,
  disabled = false,
  fullWidth = false,
  size = 'md',
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'py-2 text-sm',
    md: 'py-3 text-base',
    lg: 'py-4 text-lg'
  };
  
  const paddingStyles = {
    left: icon && iconPosition === 'left' ? 'pl-10' : 'pl-4',
    right: icon && iconPosition === 'right' ? 'pr-10' : 'pr-4'
  };
  
  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      {icon && iconPosition === 'left' && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full ${paddingStyles.left} ${paddingStyles.right}
          ${sizeStyles[size]}
          border-2 rounded-xl outline-none transition-all
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-100'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {icon && iconPosition === 'right' && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Card - Reusable card container
 */
export function Card({
  children,
  padding = 'md',
  shadow = 'md',
  hover = false,
  className = '',
  onClick,
  ...props
}) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };
  
  const hoverStyles = hover
    ? 'hover:shadow-xl hover:border-purple-200 cursor-pointer transition-all duration-300'
    : '';
  
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-gray-100
        ${paddingStyles[padding]}
        ${shadowStyles[shadow]}
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default {
  Button,
  LoadingSpinner,
  Badge,
  Tooltip,
  Input,
  Card
};
