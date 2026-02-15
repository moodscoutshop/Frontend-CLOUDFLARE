import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

/**
 * ScrollToTopButton - A floating button that appears after scrolling
 * and allows users to quickly scroll back to the top of the page.
 * 
 * Appears after scrolling 3 viewport heights.
 * Responsive positioning and sizing for all screen sizes.
 */
export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 3 viewport heights
      const scrollThreshold = window.innerHeight * 3;
      setIsVisible(window.scrollY > scrollThreshold);
    };

    // Add scroll listener with passive flag for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="
        fixed z-50
        bottom-4 right-4
        sm:bottom-6 sm:right-6
        md:bottom-8 md:right-8
        w-10 h-10
        sm:w-12 sm:h-12
        bg-[#EB9D2A] hover:bg-[#B17816]
        text-white
        rounded-full
        shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-300 ease-out
        transform hover:scale-110
        focus:outline-none focus:ring-2 focus:ring-[#EB9D2A] focus:ring-offset-2
      "
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
}

export default ScrollToTopButton;
