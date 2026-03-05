/**
 * useReferralCode - Custom hook for referral code management
 *
 * Manages referral code state with persistence:
 *   - Logged-in users: saved in database via API
 *   - Guest users: saved in localStorage + cookie
 *
 * First-time purchase flow:
 *   - Shows referral modal on first product click
 *   - After first confirmation, modal is suppressed
 *   - Users can change code in Settings modal anytime
 *
 * Cookie ID is generated once and persists until cleared.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { referralAPI } from '../lib/api';
import { auth } from '../lib/firebase';

export const DEFAULT_REFERRAL_CODE = 'moodscout';
const COOKIE_USER_ID_KEY = 'moodscout_cookie_uid';
const LOCAL_REFERRAL_KEY = 'moodscout_referral_code';
const LOCAL_MODAL_SEEN_KEY = 'moodscout_referral_modal_seen';

/**
 * Generate or retrieve a persistent anonymous user ID.
 */
function getCookieUserId() {
  let id = localStorage.getItem(COOKIE_USER_ID_KEY);
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(COOKIE_USER_ID_KEY, id);
  }
  return id;
}

/**
 * Inject or replace the `customid` query-param in an eBay URL.
 *
 * @param {string} url - Original eBay product URL
 * @param {string} referralCode - Referral code to set as customid
 * @returns {string} URL with updated customid
 */
export function buildReferralUrl(url, referralCode) {
  if (!url || url === '#') return url;

  const code = (referralCode || '').trim() || DEFAULT_REFERRAL_CODE;

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('customid', code);
    return urlObj.toString();
  } catch {
    // Fallback: simple string replacement for non-parseable URLs
    if (url.includes('customid=')) {
      return url.replace(/customid=[^&]*/, `customid=${encodeURIComponent(code)}`);
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}customid=${encodeURIComponent(code)}`;
  }
}

/**
 * React hook that exposes referral-modal state + helpers.
 *
 * Persists referral code in DB (logged-in) or localStorage (guest).
 * Shows modal only on first product click; suppressed afterward.
 *
 * Returns:
 *   - isModalOpen        : boolean
 *   - pendingUrl         : the URL waiting for referral code confirmation
 *   - pendingProductTitle: the product title for context
 *   - shouldShowModal    : whether the first-time modal should be shown
 *   - referralCode       : currently active referral code
 *   - loading            : true while loading from DB/localStorage
 *   - openReferralModal  : (url, title?) => void — call this instead of opening the URL directly
 *   - confirmReferral    : (referralCode) => void — submit & redirect
 *   - cancelReferral     : () => void — close modal & redirect with stored code
 *   - dismissReferral    : () => void — close modal without redirecting
 *   - updateReferralCode : (code) => Promise — update the stored referral code
 *   - DEFAULT_REFERRAL_CODE
 *   - cookieUserId       : anonymous user ID for guest tracking
 */
export function useReferralCode() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState(DEFAULT_REFERRAL_CODE);
  const [hasSeenModal, setHasSeenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const pendingUrlRef = useRef(null);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [pendingProductTitle, setPendingProductTitle] = useState('');
  const cookieUserId = useRef(getCookieUserId()).current;
  const initializedRef = useRef(false);

  // Load referral settings on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function loadSettings() {
      try {
        const res = await referralAPI.getSettings(cookieUserId);
        const settings = res.data?.settings;
        if (settings) {
          const code = settings.referral_code || DEFAULT_REFERRAL_CODE;
          const seen = !!settings.has_seen_modal;
          setReferralCode(code);
          setHasSeenModal(seen);
          // Always sync DB values to localStorage — DB is the source of truth
          localStorage.setItem(LOCAL_REFERRAL_KEY, code);
          if (seen) localStorage.setItem(LOCAL_MODAL_SEEN_KEY, 'true');
        }
      } catch {
        // Fallback to localStorage
        const localCode = localStorage.getItem(LOCAL_REFERRAL_KEY);
        const localSeen = localStorage.getItem(LOCAL_MODAL_SEEN_KEY);
        if (localCode) setReferralCode(localCode);
        if (localSeen === 'true') setHasSeenModal(true);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [cookieUserId]);

  // Migrate guest settings when user logs in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && cookieUserId) {
        try {
          await referralAPI.migrateGuest(cookieUserId);
          // Reload settings after migration
          const res = await referralAPI.getSettings(cookieUserId);
          const settings = res.data?.settings;
          if (settings) {
            const code = settings.referral_code || DEFAULT_REFERRAL_CODE;
            const seen = !!settings.has_seen_modal;
            setReferralCode(code);
            setHasSeenModal(seen);
            // Always sync DB values to localStorage — DB is the source of truth
            localStorage.setItem(LOCAL_REFERRAL_KEY, code);
            if (seen) localStorage.setItem(LOCAL_MODAL_SEEN_KEY, 'true');
          }
        } catch {
          // Silent — migration is best-effort
        }
      }
    });
    return unsubscribe;
  }, [cookieUserId]);

  // Listen for code changes dispatched by SettingsModal for real-time sync
  useEffect(() => {
    const handler = (e) => {
      const code = (e.detail?.code || '').trim() || DEFAULT_REFERRAL_CODE;
      setReferralCode(code);
      localStorage.setItem(LOCAL_REFERRAL_KEY, code);
    };
    window.addEventListener('moodscout:referral-code-updated', handler);
    return () => window.removeEventListener('moodscout:referral-code-updated', handler);
  }, []);

  /**
   * Open the referral modal before navigating.
   * Only shows modal if user hasn't seen it before AND has no custom code set.
   * Otherwise, redirects immediately with the stored code.
   */
  const openReferralModal = useCallback((url, title) => {
    // Skip modal if user has already seen it OR already has a custom code set
    if (hasSeenModal || referralCode !== DEFAULT_REFERRAL_CODE) {
      // Skip modal — redirect immediately with stored code
      if (url && url !== '#') {
        const finalUrl = buildReferralUrl(url, referralCode);
        window.open(finalUrl, '_blank', 'noopener');
      }
      return;
    }

    // Show modal for first-time users
    pendingUrlRef.current = url;
    setPendingUrl(url);
    setPendingProductTitle(title || '');
    setIsModalOpen(true);
  }, [hasSeenModal, referralCode]);

  /**
   * Confirm: apply referral code and redirect.
   */
  const confirmReferral = useCallback(async (code) => {
    const finalCode = (code || '').trim() || DEFAULT_REFERRAL_CODE;
    const url = pendingUrlRef.current;

    // Save the code
    setReferralCode(finalCode);
    setHasSeenModal(true);
    localStorage.setItem(LOCAL_REFERRAL_KEY, finalCode);
    localStorage.setItem(LOCAL_MODAL_SEEN_KEY, 'true');

    // Persist to DB
    try {
      await referralAPI.updateCode(finalCode, cookieUserId);
      await referralAPI.markModalSeen(cookieUserId);
    } catch {
      // Silent — localStorage fallback already saved
    }

    // Redirect
    if (url && url !== '#') {
      const finalUrl = buildReferralUrl(url, finalCode);
      window.open(finalUrl, '_blank', 'noopener');
    }

    pendingUrlRef.current = null;
    setPendingUrl(null);
    setPendingProductTitle('');
    setIsModalOpen(false);
  }, [cookieUserId]);

  /**
   * Cancel: use current/default referral code and redirect anyway.
   */
  const cancelReferral = useCallback(async () => {
    const url = pendingUrlRef.current;
    const codeToUse = referralCode || DEFAULT_REFERRAL_CODE;

    setHasSeenModal(true);
    localStorage.setItem(LOCAL_MODAL_SEEN_KEY, 'true');

    try {
      await referralAPI.markModalSeen(cookieUserId);
    } catch { /* silent */ }

    if (url && url !== '#') {
      const finalUrl = buildReferralUrl(url, codeToUse);
      window.open(finalUrl, '_blank', 'noopener');
    }

    pendingUrlRef.current = null;
    setPendingUrl(null);
    setPendingProductTitle('');
    setIsModalOpen(false);
  }, [referralCode, cookieUserId]);

  /**
   * Dismiss: close modal without redirecting.
   */
  const dismissReferral = useCallback(() => {
    pendingUrlRef.current = null;
    setPendingUrl(null);
    setPendingProductTitle('');
    setIsModalOpen(false);
  }, []);

  /**
   * Update the stored referral code (from Settings modal).
   */
  const updateReferralCode = useCallback(async (newCode) => {
    const code = (newCode || '').trim() || DEFAULT_REFERRAL_CODE;
    setReferralCode(code);
    localStorage.setItem(LOCAL_REFERRAL_KEY, code);

    try {
      await referralAPI.updateCode(code, cookieUserId);
    } catch {
      // Silent — localStorage fallback already saved
    }

    return code;
  }, [cookieUserId]);

  return {
    isModalOpen,
    pendingUrl,
    pendingProductTitle,
    shouldShowModal: !hasSeenModal,
    referralCode,
    loading,
    openReferralModal,
    confirmReferral,
    cancelReferral,
    dismissReferral,
    updateReferralCode,
    DEFAULT_REFERRAL_CODE,
    cookieUserId,
  };
}

export default useReferralCode;
