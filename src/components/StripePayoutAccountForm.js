import React, { useState } from 'react';
import { CreditCard, CheckCircle, ShieldCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { referralAPI } from '../lib/api';

export function StripePayoutAccountForm({ currentStripeAccountId, onSaved }) {
  const [stripeAccountId, setStripeAccountId] = useState(currentStripeAccountId || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!stripeAccountId.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await referralAPI.saveStripeAccount(stripeAccountId.trim());
      setMessage({ type: 'success', text: 'Stripe Payout Account successfully linked!' });
      if (onSaved) onSaved(stripeAccountId.trim());
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save Stripe account.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#D4CFC0] rounded-xl p-5 shadow-sm space-y-4 dark:bg-surface-elevated dark:border-outline/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center dark:bg-indigo-500/20 dark:text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
              Stripe Payout Setup
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                Test Mode Active
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              Enter your Stripe Account ID (e.g. <code className="text-xs bg-surface-container-low px-1 py-0.5 rounded">acct_test_12345</code>) to receive direct transfers.
            </p>
          </div>
        </div>
        {currentStripeAccountId && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            Linked
          </span>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40'
        }`}>
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={stripeAccountId}
            onChange={(e) => setStripeAccountId(e.target.value)}
            placeholder="acct_1... or test account ID"
            className="w-full px-3.5 py-2.5 bg-[#FDFDF8] border border-[#C5BFAE] rounded-lg text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary dark:bg-surface-container-low dark:border-outline/30"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {currentStripeAccountId ? 'Update Payout Account' : 'Link Stripe Account'}
        </button>
      </form>
    </div>
  );
}
