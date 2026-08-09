import React, { useState, useEffect } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';

/**
 * ThemeToggleButton — toggles html.dark + persists moodscout_theme in localStorage.
 * Shared by landing Navbar and ResultsNavbar.
 */
export function ThemeToggleButton({ className = '' }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const savedTheme = localStorage.getItem('moodscout_theme');
      const nextIsDark =
        savedTheme === 'dark' ||
        (!savedTheme &&
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      setIsDark(nextIsDark);
      document.documentElement.classList.toggle('dark', nextIsDark);
    } catch (_) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('moodscout_theme', isDark ? 'dark' : 'light');
    } catch (_) {}
  }, [isDark, mounted]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'inline-flex h-10 w-10 items-center justify-center rounded-full',
        'border border-black/5 bg-surface-bright/70 text-on-surface-variant shadow-sm',
        'transition-all duration-200 hover:border-secondary/20 hover:bg-surface-container',
        className,
      ].join(' ')}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}

export default ThemeToggleButton;
