/**
 * DeveloperAffiliateApplicationModal — Form to apply for the Shopify Developer Affiliate program
 *
 * Mirrors CreatorApplicationModal (eBay influencer) but targets the Shopify
 * subscription affiliate track. Requires the user to be logged in.
 * Collects: full name, email, company/brand, website, app/agency/audience, reason.
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Store, Send, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { shopifyAffiliateAPI } from '../../lib/api';

export function DeveloperAffiliateApplicationModal({ isOpen, onClose }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [appOrAudience, setAppOrAudience] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error', text }
  const nameRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFullName(currentUser?.displayName || '');
      setEmail(currentUser?.email || '');
      setResult(null);
      setTimeout(() => nameRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !reason.trim()) {
      setResult({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      await shopifyAffiliateAPI.submitApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        websiteUrl: websiteUrl.trim(),
        appOrAudience: appOrAudience.trim(),
        reason: reason.trim(),
      });
      setResult({ type: 'success', text: 'Application submitted! We\'ll review it and notify you.' });
      // Let listeners (navbar/settings) refresh developer status
      window.dispatchEvent(new CustomEvent('moodscout:developer-status-updated'));
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setResult({ type: 'error', text: err.response?.data?.error || 'Failed to submit application.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-[#FDFDF8] rounded-2xl shadow-2xl border border-[#D4CFC0] p-6 text-center">
          <p className="text-[#3D3F40] mb-4">You need to be signed in to apply for the Developer Affiliate Program.</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#EB9D2A] text-[#1D1F20] rounded-lg font-semibold
                       hover:bg-[#CD8407] hover:shadow-md active:scale-[0.98] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    , document.body);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Developer Affiliate Application"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-[#FDFDF8] rounded-2xl shadow-2xl border border-[#D4CFC0] overflow-hidden max-h-[90vh] flex flex-col animate-[fadeInScale_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#EB9D2A]/10 to-[#EB9D2A]/5 border-b border-[#E0DCCE]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EB9D2A] rounded-lg flex items-center justify-center">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1F20]">Developer Affiliate Application</h3>
              <p className="text-xs text-[#5D5F60]">Earn on Shopify subscription referrals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#EEEFE9] transition-colors text-[#5D5F60] hover:text-[#1D1F20]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-[#3D3F40] leading-relaxed">
            Refer Shopify merchants to the MoodScout app. Developer affiliates earn recurring
            commission when merchants subscribe with your developer referral code. This is separate
            from the eBay influencer program.
          </p>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#1D1F20]">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                         placeholder:text-[#A0A2A3]
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#1D1F20]">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                         placeholder:text-[#A0A2A3]
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
          </div>

          {/* Company / Brand */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#1D1F20]">
              Company or Brand
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company, agency, or brand"
              className="w-full px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                         placeholder:text-[#A0A2A3]
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
          </div>

          {/* Website / Profile */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#1D1F20]">
              Website or Profile URL
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://your-site.com"
              className="w-full px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                         placeholder:text-[#A0A2A3]
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
          </div>

          {/* App / Agency / Audience */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#1D1F20]">
              App, Agency, or Audience
            </label>
            <input
              type="text"
              value={appOrAudience}
              onChange={(e) => setAppOrAudience(e.target.value)}
              placeholder="e.g. Shopify app developer, agency, content creator"
              className="w-full px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                         placeholder:text-[#A0A2A3]
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#1D1F20]">
              How will you refer Shopify merchants? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              placeholder="Tell us how you plan to promote the MoodScout Shopify app and reach merchants..."
              className="w-full px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                         placeholder:text-[#A0A2A3] resize-none
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
          </div>

          {/* Result message */}
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {result.text}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || result?.type === 'success'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                       bg-[#EB9D2A] text-[#1D1F20] text-sm font-semibold
                       hover:bg-[#CD8407] disabled:opacity-50 disabled:cursor-not-allowed
                       active:scale-[0.98] transition-all"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : result?.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? 'Submitting...' : result?.type === 'success' ? 'Submitted!' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  , document.body);
}

export default DeveloperAffiliateApplicationModal;
