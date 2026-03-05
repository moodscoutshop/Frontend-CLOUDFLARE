/**
 * PrecisionSearchAuthModal
 *
 * Lightweight gate modal shown when an anonymous user tries to enable
 * Precision Search.  Offers Sign In / Sign Up navigation.
 * Does NOT touch any search logic — purely a UI wrapper.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Zap } from 'lucide-react';

export function PrecisionSearchAuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose();
    navigate('/login');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/signup');
  };

  return createPortal(
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(29, 31, 32, 0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Precision Search requires an account"
    >
      {/* Card — stop clicks propagating to backdrop */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#E8E4D9] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F4EF] hover:bg-[#EEEDE6] text-[#5D5F60] hover:text-[#1D1F20] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#EB9D2A]/12 mb-4 mx-auto">
          <Zap className="w-6 h-6 text-[#EB9D2A]" />
        </div>

        {/* Heading */}
        <h2 className="text-center text-[#1D1F20] text-lg font-semibold mb-2">
          Precision Search requires an account
        </h2>
        <p className="text-center text-[#5D5F60] text-sm mb-6 leading-relaxed">
          Sign in or create a free account to unlock highly specific,
          AI-powered product searches.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleSignIn}
            className="flex-1 py-2.5 px-5 rounded-lg border border-[#D4CFC0] bg-white text-[#1D1F20] text-sm font-medium hover:bg-[#F5F4EF] transition-colors"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            className="flex-1 py-2.5 px-5 rounded-lg bg-[#EB9D2A] text-white text-sm font-medium hover:bg-[#D68E20] transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
