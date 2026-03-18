import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, ExternalLink, ShoppingBag, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { referralAPI } from '../../lib/api';

/**
 * ReferralCodeModal
 *
 * A reusable modal that intercepts eBay product redirects and lets the user
 * enter a referral code before being sent to the product page.
 *
 * Props:
 *   isOpen           - boolean, controls visibility
 *   defaultCode      - string, the default referral code (shown as placeholder)
 *   onConfirm        - (referralCode: string) => void — called with the entered code
 *   onCancel         - () => void — user chose to skip; redirect with default code
 *   onDismiss        - () => void — user closed modal without any redirect
 *   productTitle     - optional string, for context in the modal header
 */
export function ReferralCodeModal({
  isOpen,
  defaultCode = 'moodscout',
  onConfirm,
  onCancel,
  onDismiss,
  productTitle,
}) {
  const [code, setCode] = useState('');
  const [verifyStatus, setVerifyStatus] = useState(null); // null | 'loading' | { valid, type, creator? }
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus the input when the modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Slight delay so the DOM is painted before focus
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = 'unset';
      setCode(''); // reset for next open
      setVerifyStatus(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debounced referral code verification
  useEffect(() => {
    const trimmed = code.trim();

    // Don't verify empty input or the default code
    if (!trimmed || trimmed.toLowerCase() === defaultCode.toLowerCase()) {
      setVerifyStatus(null);
      return;
    }

    setVerifyStatus('loading');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await referralAPI.verifyCode(trimmed);
        setVerifyStatus(res.data);
      } catch {
        setVerifyStatus(null);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, defaultCode]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Use whatever the user typed, or fall back to default
    onConfirm(code.trim() || defaultCode);
  };

  const handleSkip = () => {
    // User doesn't want to enter a code — redirect with default
    onCancel();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onDismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Referral code"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#FDFDF8] rounded-2xl shadow-2xl border border-[#D4CFC0] overflow-hidden animate-[fadeInScale_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#EB9D2A]/10 to-[#EB9D2A]/5 border-b border-[#E0DCCE]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EB9D2A] rounded-lg flex items-center justify-center flex-shrink-0">
              <Tag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1F20]">Referral Code</h3>
              <p className="text-xs text-[#5D5F60]">Support an influencer before you shop!</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-[#EEEFE9] transition-colors text-[#5D5F60] hover:text-[#1D1F20]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Product context (optional) */}
          {productTitle && (
            <div className="flex items-start gap-2 p-3 bg-[#EEEFE9]/60 rounded-lg border border-[#E0DCCE]">
              <ShoppingBag className="w-4 h-4 text-[#5D5F60] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#5D5F60] line-clamp-2">{productTitle}</p>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-[#3D3F40] leading-relaxed">
            Enter a referral code to support an influencer, or leave it blank to use the default.
            You'll be redirected to eBay after confirming.
          </p>

          {/* Input */}
          <div className="space-y-1.5">
            <label htmlFor="referral-code-input" className="block text-sm font-medium text-[#1D1F20]">
              Referral Code
            </label>
            <input
              ref={inputRef}
              id="referral-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={defaultCode}
              maxLength={256}
              className="w-full px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                         placeholder:text-[#A0A2A3]
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
            <p className="text-[11px] text-[#A0A2A3]">
              Default: <span className="font-mono text-[#5D5F60]">{defaultCode}</span>
            </p>

            {/* Referral code validation feedback */}
            {verifyStatus === 'loading' && (
              <div className="flex items-center gap-1.5 text-xs text-[#5D5F60]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking referral code…
              </div>
            )}
            {verifyStatus && verifyStatus !== 'loading' && verifyStatus.valid && verifyStatus.type === 'creator' && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle className="w-3.5 h-3.5" />
                Supporting <span className="font-semibold">{verifyStatus.creator}</span>
              </div>
            )}
            {verifyStatus && verifyStatus !== 'loading' && !verifyStatus.valid && (
              <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  This referral code does not belong to any active influencer.
                  You won't be supporting any creator with this code.
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         bg-[#EB9D2A] text-[#1D1F20] text-sm font-semibold
                         hover:bg-[#CD8407] active:scale-[0.98] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Continue to eBay
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2.5 rounded-lg border border-[#D4CFC0] bg-white text-sm font-medium text-[#5D5F60]
                         hover:bg-[#EEEFE9] hover:text-[#3D3F40] transition-all"
            >
              Skip
            </button>
          </div>
        </form>
      </div>

      {/* Keyframe animation (injected once) */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default ReferralCodeModal;
