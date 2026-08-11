import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, ArrowRight, Store } from 'lucide-react';
import Logo from '../common/Logo';
import etsyLogo from '../../assets/etsy-ar21.svg';
import temuLogo from '../../assets/Temu_Logo_0.svg';
import sheinLogo from '../../assets/icons8-shein.svg';
import amazonLogo from '../../assets/amazon-icon.svg';
import targetLogo from '../../assets/BullseyeRed.svg';
import ebayLogo from '../../assets/ebay.svg';
import shopifyLogo from '../../assets/shopify-icon.svg';
import aliexpressLogo from '../../assets/aliexpress-icon.svg';
import walmartLogo from '../../assets/spark-icon.svg';

const CLOSE_ANIM_MS = 320;

const inputClass =
  'w-full rounded-lg border border-[#B8B09A] bg-[#FDFDF8] px-3 py-2.5 text-sm text-on-surface ' +
  'placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ' +
  'dark:border-outline/35 dark:bg-surface-container-low';

const MARKETPLACES = [
  { id: 'Etsy', label: 'Etsy', logo: etsyLogo },
  { id: 'Temu', label: 'Temu', logo: temuLogo },
  { id: 'Shein', label: 'Shein', logo: sheinLogo },
  { id: 'Amazon', label: 'Amazon', logo: amazonLogo },
  { id: 'Target', label: 'Target', logo: targetLogo },
  { id: 'eBay', label: 'eBay', logo: ebayLogo },
  { id: 'Shopify Stores', label: 'Shopify stores', logo: shopifyLogo },
  { id: 'AliExpress', label: 'AliExpress', logo: aliexpressLogo },
  { id: 'Walmart', label: 'Walmart', logo: walmartLogo },
  { id: 'Other', label: 'Other', logo: null },
];

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
}

function MarketplaceChip({ marketplace, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(marketplace.id)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all ${
        selected
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-[#B8B09A] bg-[#FDFDF8] text-on-surface-variant hover:border-[#A8A090] hover:bg-[#F8F7F2] dark:border-outline/35 dark:bg-surface-container-low dark:hover:bg-surface-container'
      }`}
    >
      {marketplace.logo ? (
        <img src={marketplace.logo} alt="" className="h-4 w-4 object-contain" />
      ) : (
        <Store className="h-4 w-4" />
      )}
      <span>{marketplace.label}</span>
      {selected && <CheckCircle className="h-3.5 w-3.5" />}
    </button>
  );
}

export function WaitlistModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    categories: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [otherMarketplace, setOtherMarketplace] = useState('');
  const [mounted, setMounted] = useState(false);
  const [sheetIn, setSheetIn] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'https://backend-cloudflare.moodscoutshop.workers.dev';

  const resetFormState = useCallback(() => {
    setSubmitStatus(null);
    setSelectedCategories([]);
    setOtherMarketplace('');
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSheetIn(true));
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const mappedCategories = selectedCategories.map((cat) => {
      if (cat === 'Other' && otherMarketplace.trim()) {
        return `Other: ${otherMarketplace.trim()}`;
      }
      return cat;
    });
    setFormData((prev) => ({ ...prev, categories: mappedCategories }));
  }, [selectedCategories, otherMarketplace]);

  const finishClose = useCallback(() => {
    resetFormState();
    document.body.style.overflow = 'unset';
    setSheetIn(false);
    setMounted(false);
    onClose();
  }, [onClose, resetFormState]);

  const handleClose = useCallback(() => {
    if (isMobileViewport()) {
      setSheetIn(false);
      window.setTimeout(finishClose, CLOSE_ANIM_MS);
    } else {
      finishClose();
    }
  }, [finishClose]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        if (category === 'Other') setOtherMarketplace('');
        return prev.filter((cat) => cat !== category);
      }
      if (category === 'Other') setOtherMarketplace('');
      return [...prev, category];
    });
  };

  const saveToDatabase = async (data) => {
    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) return { success: false, duplicate: true };
        throw new Error(result.message || 'Database error');
      }
      return { success: true, duplicate: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const sendEmail = async (data) => {
    try {
      const serviceID = 'service_bu2wks4';
      const templateID = 'template_27up41k';
      const publicKey = 'RePsWz0YaYvq-ZsRU';

      const templateParams = {
        to_name: 'MoodScout Team',
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        reason: data.reason,
        category: Array.isArray(data.categories) ? data.categories.join(', ') : data.categories || 'None',
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceID,
          template_id: templateID,
          user_id: publicKey,
          template_params: templateParams,
        }),
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      alert('Please select at least one marketplace');
      return;
    }

    if (selectedCategories.includes('Other') && !otherMarketplace.trim()) {
      alert('Please add the marketplace name for "Other".');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const cleanedData = {
        ...formData,
        phone: formData.phone?.trim() || 'N/A',
      };

      const dbResult = await saveToDatabase(cleanedData);

      if (dbResult.duplicate) {
        setSubmitStatus('duplicate');
        setIsSubmitting(false);
        return;
      }

      if (!dbResult.success) {
        setSubmitStatus('error');
        setIsSubmitting(false);
        return;
      }

      await sendEmail(cleanedData);

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', reason: '', categories: [] });
      setSelectedCategories([]);
      setOtherMarketplace('');

      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const formBody = submitStatus === 'success' ? (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
        <CheckCircle className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-on-surface">Thanks for your feedback!</h3>
      <p className="text-on-surface-variant">We&apos;ll use it to make MoodScout better.</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:pb-6 sm:pt-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
              Your name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="Jordan Lee"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
              Email <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              placeholder="jordan@email.com"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
            Phone <span className="font-normal text-on-surface-variant/70">(optional)</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputClass}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-on-surface-variant">
            Marketplaces you&apos;d like to see <span className="text-primary">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {MARKETPLACES.map((marketplace) => (
              <MarketplaceChip
                key={marketplace.id}
                marketplace={marketplace}
                selected={selectedCategories.includes(marketplace.id)}
                onToggle={handleCategoryToggle}
              />
            ))}
          </div>
          {selectedCategories.includes('Other') && (
            <input
              type="text"
              value={otherMarketplace}
              onChange={(e) => setOtherMarketplace(e.target.value)}
              className={`${inputClass} mt-3`}
              placeholder="Enter marketplace name"
            />
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-on-surface-variant">
            Feedback, ideas, or issues <span className="text-primary">*</span>
          </label>
          <textarea
            required
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="What's working, what's missing, what to fix..."
          />
        </div>

        {submitStatus === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
            <strong>Something went wrong.</strong> Please try again.
          </div>
        )}

        {submitStatus === 'duplicate' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800/40 dark:bg-yellow-950/30 dark:text-yellow-300">
            <strong>This email is already on the waitlist!</strong>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#C5BFAE] bg-[#F8F7F2]/80 px-5 py-4 sm:flex-row sm:items-center sm:px-7 dark:border-outline/25 dark:bg-surface-container-low/40">
        <p className="max-w-xs text-center text-[11px] leading-relaxed text-on-surface-variant sm:text-left">
          Used only to improve MoodScout — never shared or sold.
        </p>
        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.email || selectedCategories.length === 0 || !formData.reason}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-on-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[11.5rem]"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
              Sending...
            </>
          ) : (
            <>
              Send feedback
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end justify-center p-0 backdrop-blur-sm sm:items-center sm:p-4 sm:pt-[calc(var(--ms-header-height,5rem)+0.75rem)] ${
        sheetIn ? 'bg-black/50' : 'bg-black/0'
      } transition-colors duration-300 ease-out`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={[
          'relative flex max-h-[92dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-2xl border-2 border-[#C5BFAE] bg-white shadow-2xl',
          'dark:border-outline/30 dark:bg-surface-elevated',
          'sm:max-h-[calc(100dvh-var(--ms-header-height,5rem)-1.5rem)] sm:rounded-2xl sm:translate-y-0',
          'max-sm:transition-transform max-sm:duration-300 max-sm:ease-out',
          sheetIn ? 'max-sm:translate-y-0' : 'max-sm:translate-y-full',
        ].join(' ')}
      >
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-[#C5BFAE] sm:hidden dark:bg-outline/40" />

        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-lg border border-[#C5BFAE] bg-[#FDFDF8] p-1.5 text-on-surface-variant transition-colors hover:bg-[#F8F7F2] hover:text-on-surface dark:border-outline/30 dark:bg-surface-container-low dark:hover:bg-surface-container sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Mobile header */}
        <div className="flex items-start gap-3 border-b border-[#C5BFAE] bg-[#F8F7F2] px-5 pb-4 pt-5 dark:border-outline/25 dark:bg-surface-container-low sm:hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Logo className="h-6 w-6" />
          </div>
          <div className="min-w-0 pr-8">
            <h2 className="font-headline-card text-base font-semibold text-on-surface">Help shape MoodScout</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
              Three minutes now saves us from guessing later.
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:grid sm:grid-cols-[220px_1fr]">
          <aside className="hidden flex-col border-r border-[#C5BFAE] bg-[#F0EAE0] p-7 dark:border-outline/25 dark:bg-surface-container-low sm:flex">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <Logo className="h-7 w-7" />
            </div>
            <h2 className="font-headline-card text-lg font-semibold leading-snug text-on-surface">
              Help shape MoodScout
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              You&apos;re one of the first to try it. Three minutes now saves us from guessing later.
            </p>
            <p className="mt-auto border-t border-[#C5BFAE] pt-4 text-[11px] leading-relaxed text-on-surface-variant/80 dark:border-outline/25">
              Beta feedback · Closes before public launch
            </p>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-surface-elevated">
            {formBody}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WaitlistModal;
