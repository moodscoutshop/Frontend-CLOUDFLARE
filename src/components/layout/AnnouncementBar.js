import React, { useState } from 'react';
import { X, Store } from 'lucide-react';

/**
 * AnnouncementBar — thin promo bar shown directly below the navbar on all
 * screen sizes. Frosted glass + golden accent. Reappears on every page load
 * (no persistence); dismissible for the current page view.
 */
export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="animate-banner-slide-down relative z-[1] w-full border-b border-primary/25 bg-primary/20 backdrop-blur-xl supports-[backdrop-filter]:bg-primary/15">
      <div className="mx-auto flex max-w-max-width items-center gap-3 px-margin-mobile py-2.5 md:px-margin-desktop">
        <Store className="hidden h-4 w-4 shrink-0 text-primary sm:block" />
        <p className="flex-1 text-center font-body-ui text-[12.5px] leading-snug text-on-surface sm:text-left sm:text-body-ui">
          We now have a Shopify app!{' '}
          <a
            href="https://apps.shopify.com/moodscout"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
          >
            Check out our Shopify app
          </a>{' '}
          to bring MoodScout's discovery widget to your store.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-black/5 hover:text-on-surface dark:hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default AnnouncementBar;
