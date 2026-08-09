import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { reportAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

/**
 * Floating "Report a problem" button + modal.
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
      <button
        onClick={() => setOpen(true)}
        title="Report a problem"
        aria-label="Report a problem"
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-on-surface py-2.5 pl-3 pr-4 text-sm font-medium text-surface shadow-lg transition-colors hover:opacity-90"
      >
        <Bug className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">Report a problem</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-outline/20 bg-surface-bright shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline/10 px-5 py-4">
              <h3 className="flex items-center gap-2 font-bold text-on-surface">
                <Bug className="h-5 w-5 text-primary" /> Report a problem
              </h3>
              <button
                onClick={close}
                className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
                <p className="mb-1 font-medium text-on-surface">Thanks for the report!</p>
                <p className="mb-5 text-sm text-on-surface-variant">Our team will look into it.</p>
                <button onClick={close} className="btn-primary">Close</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 p-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-on-surface-variant">What went wrong?</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Describe what happened and what you expected…"
                    className="w-full resize-none rounded-lg border border-outline/20 bg-surface-bright px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
                {!currentUser && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-on-surface-variant">Email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="So we can follow up"
                      className="w-full rounded-lg border border-outline/20 bg-surface-bright px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
