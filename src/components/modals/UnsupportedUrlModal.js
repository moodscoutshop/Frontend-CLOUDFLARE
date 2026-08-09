/**
 * UnsupportedUrlModal — error dialog shown when a user pastes a URL that
 * MoodScout can't process (anything other than a Pinterest board/pin URL).
 *
 * Mirrors the SettingsModal shell exactly: blurred backdrop + centered
 * card, same color tokens, same entrance animation.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, Link2 } from 'lucide-react';

export function UnsupportedUrlModal({ isOpen, onClose, submittedValue = '' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Unsupported link"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-outline/20 bg-surface-bright shadow-2xl animate-[fadeInScale_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-outline/10 bg-gradient-to-r from-red-500/10 to-red-500/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500">
              <AlertTriangle className="h-4.5 w-4.5 text-white" />
            </div>
            <h3 className="text-base font-bold text-on-surface">Link Not Supported</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-on-surface-variant">
            MoodScout can only search using a <span className="font-semibold text-on-surface">Pinterest board or pin URL</span>{' '}
            (or text keywords or photos from your device). The link you entered isn't a Pinterest URL, so we can't scout it yet.
          </p>

          {submittedValue && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-all">You entered: <span className="font-mono">{submittedValue}</span></span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface">Try a Pinterest URL like:</label>
            <div className="space-y-2">
              <div className="rounded-lg border border-outline/20 bg-surface-container-low px-4 py-2.5 font-mono text-xs text-on-surface">
                https://www.pinterest.com/username/board-name/
              </div>
              <div className="rounded-lg border border-outline/20 bg-surface-container-low px-4 py-2.5 font-mono text-xs text-on-surface">
                https://pin.it/abc1234
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Or just type keywords describing what you're looking for — no link needed.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-glowing-orange px-4 py-2.5 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default UnsupportedUrlModal;
