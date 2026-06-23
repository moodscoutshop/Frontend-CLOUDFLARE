import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { reportAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

/**
 * Floating "Report a problem" button + modal.
 *
 * Submits a user bug report to /api/report (type=user). Auto-attaches the
 * current URL. Hidden on the admin dashboard routes to avoid clutter.
 */
export function BugReportButton() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Don't show on admin/dev surfaces
  if (location.pathname.startsWith('/dev')) return null;

  const reset = () => {
    setMessage('');
    setEmail('');
    setDone(false);
    setError(null);
  };

  const close = () => { setOpen(false); setTimeout(reset, 200); };

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please describe the problem.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await reportAPI.submit({
        type: 'user',
        source: 'frontend',
        severity: 'info',
        message: message.trim(),
        url: window.location.href,
        userEmail: email.trim() || currentUser?.email || null,
        context: { path: location.pathname },
      });
      setDone(true);
    } catch (err) {
      setError('Could not send your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="Report a problem"
        aria-label="Report a problem"
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 bg-[#1D1F20] text-white text-sm font-medium pl-3 pr-4 py-2.5 rounded-full shadow-lg hover:bg-[#3D3F40] transition-colors"
      >
        <Bug className="w-4 h-4 text-[#EB9D2A]" />
        <span className="hidden sm:inline">Report a problem</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" onClick={close}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DCCE]">
              <h3 className="font-bold text-[#1D1F20] flex items-center gap-2"><Bug className="w-5 h-5 text-[#EB9D2A]" /> Report a problem</h3>
              <button onClick={close} className="p-1.5 rounded-md text-[#5D5F60] hover:bg-[#EEEFE9]"><X className="w-5 h-5" /></button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-[#1D1F20] font-medium mb-1">Thanks for the report!</p>
                <p className="text-sm text-[#5D5F60] mb-5">Our team will look into it.</p>
                <button onClick={close} className="btn-primary">Close</button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3D3F40] mb-1">What went wrong?</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Describe what happened and what you expected…"
                    className="w-full border border-[#D4CFC0] rounded-lg px-3 py-2 text-sm text-[#1D1F20] focus:border-[#EB9D2A] focus:outline-none resize-none"
                  />
                </div>
                {!currentUser && (
                  <div>
                    <label className="block text-sm font-medium text-[#3D3F40] mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="So we can follow up"
                      className="w-full border border-[#D4CFC0] rounded-lg px-3 py-2 text-sm text-[#1D1F20] focus:border-[#EB9D2A] focus:outline-none"
                    />
                  </div>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default BugReportButton;
