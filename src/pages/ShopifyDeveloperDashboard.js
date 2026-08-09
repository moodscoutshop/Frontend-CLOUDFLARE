import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  DollarSign,
  RefreshCw,
  Save,
  ShoppingBag,
  Store,
  Download,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { shopifyAffiliateAPI } from '../lib/api';
import { Navbar } from '../components/layout';
import { WaitlistModal } from '../components/modals/WaitlistModal';
import { useChartTheme } from '../hooks/useChartTheme';


const cardClass =
  'bg-white border border-[#D4CFC0] rounded-xl p-5 dark:bg-surface-elevated dark:border-outline/10';
const inputClass =
  'px-3 py-2 bg-[#FDFDF8] border border-[#C5BFAE] rounded-lg font-normal text-on-surface ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ' +
  'dark:bg-surface-container-low dark:border-outline/30';

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded bg-outline/25 dark:bg-outline/20 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6"
      style={{ paddingTop: 'calc(var(--ms-header-height, 5rem) + 1.5rem)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-72" />
          <Bone className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-9 w-20 rounded-lg" />
          <Bone className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${cardClass} space-y-3`}>
            <Bone className="h-10 w-10 rounded-lg" />
            <Bone className="h-7 w-20" />
            <Bone className="h-4 w-36" />
          </div>
        ))}
      </div>
      <div className={`${cardClass} space-y-4`}>
        <Bone className="h-6 w-52" />
        <Bone className="h-4 w-80 max-w-full" />
        <div className="flex flex-col sm:flex-row gap-3">
          <Bone className="h-10 flex-1 rounded-lg" />
          <Bone className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <div className={`${cardClass} space-y-4`}>
        <Bone className="h-6 w-44" />
        <Bone className="h-64 w-full rounded-lg" />
      </div>
      <div className="bg-white border border-[#D4CFC0] rounded-xl overflow-hidden dark:bg-surface-elevated dark:border-outline/10">
        <div className="px-5 py-4 border-b border-[#E0DCCE] dark:border-outline/10">
          <Bone className="h-6 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function StatCard({ icon, label, value }) {
  return (
    <div className={cardClass}>
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-on-surface">{value}</div>
      <div className="text-sm text-on-surface-variant mt-0.5">{label}</div>
    </div>
  );
}

function ApplicationForm({ onSubmitted, currentUser }) {
  const [form, setForm] = useState({
    fullName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    companyName: '',
    websiteUrl: '',
    appOrAudience: '',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await shopifyAffiliateAPI.submitApplication(form);
      setMessage({ type: 'success', text: 'Application submitted for review.' });
      onSubmitted();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to submit application.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${cardClass} space-y-4`}>
      <div>
        <h2 className="text-lg font-semibold text-on-surface">Apply for Shopify Developer Affiliate Access</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          This program tracks Shopify app subscription referrals, separate from eBay influencer referrals.
        </p>
      </div>
      {[
        ['fullName', 'Full name'],
        ['email', 'Email'],
        ['companyName', 'Company or brand'],
        ['websiteUrl', 'Website or profile URL'],
        ['appOrAudience', 'App, agency, or audience'],
      ].map(([key, label]) => (
        <label key={key} className="grid gap-1 text-sm font-medium text-on-surface">
          {label}
          <input
            value={form[key]}
            onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
            className={inputClass}
            required={key === 'fullName' || key === 'email'}
          />
        </label>
      ))}
      <label className="grid gap-1 text-sm font-medium text-on-surface">
        Why do you want to refer Shopify merchants?
        <textarea
          value={form.reason}
          onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
          rows={4}
          className={inputClass}
          required
        />
      </label>
      {message && (
        <div className={`text-sm rounded-lg p-3 ${message.type === 'success' ? 'bg-success-green/10 text-success-green border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}
      <button
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-semibold disabled:opacity-60"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}

export function ShopifyDeveloperDashboard() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const chartTheme = useChartTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState('');
  const [codeMessage, setCodeMessage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [response, withdrawalsResponse] = await Promise.all([
        shopifyAffiliateAPI.getDashboard(),
        shopifyAffiliateAPI.getWithdrawals(),
      ]);
      const nextDashboard = response.data.dashboard;
      setDashboard(nextDashboard);
      setWithdrawals(withdrawalsResponse.data.withdrawals || []);
      setNewCode(nextDashboard?.code?.referral_code || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load Shopify developer affiliate dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated) load();
  }, [authLoading, isAuthenticated, load, navigate]);

  async function saveCode(event) {
    event.preventDefault();
    setCodeMessage(null);
    try {
      await shopifyAffiliateAPI.setCode(newCode);
      setCodeMessage({ type: 'success', text: 'Referral code saved.' });
      await load();
    } catch (err) {
      setCodeMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save code.' });
    }
  }

  async function copyCode() {
    if (!dashboard?.code?.referral_code) return;
    await navigator.clipboard.writeText(dashboard.code.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function requestWithdrawal(event) {
    event.preventDefault();
    const amount = Number.parseFloat(withdrawAmount);
    const summary = dashboard?.withdrawal;
    const minAmount = Number(summary?.min_withdrawal_amount || 50);
    if (!amount || amount <= 0) return;
    if (amount < minAmount) {
      setWithdrawMessage({ type: 'error', text: `Minimum withdrawal amount is ${money(minAmount)}.` });
      return;
    }
    if (!summary?.has_connect_account) {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: { initialTab: 'payment', initialMobilePane: 'detail' } }));
      return;
    }
    setWithdrawing(true);
    setWithdrawMessage(null);
    try {
      await shopifyAffiliateAPI.requestWithdrawal(amount);
      setWithdrawAmount('');
      setWithdrawMessage({ type: 'success', text: 'Shopify developer withdrawal request submitted.' });
      await load();
    } catch (err) {
      if (err.response?.data?.code === 'payout_setup_required') {
        window.dispatchEvent(new CustomEvent('open-settings', { detail: { initialTab: 'payment', initialMobilePane: 'detail' } }));
      } else {
        setWithdrawMessage({ type: 'error', text: err.response?.data?.error || 'Withdrawal failed.' });
      }
    } finally {
      setWithdrawing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
        <DashboardSkeleton />
        <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
        <div className="flex items-center justify-center p-4" style={{ paddingTop: 'calc(var(--ms-header-height, 5rem) + 2rem)' }}>
          <div className="text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-on-surface-variant">{error}</p>
            <Link className="text-primary font-medium" to="/">Go home</Link>
          </div>
        </div>
        <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />
      </div>
    );
  }

  const approved = dashboard?.applications?.some((app) => app.status === 'approved');
  const pending = dashboard?.applications?.some((app) => app.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
      <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />

      <main
        className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6"
        style={{ paddingTop: 'calc(var(--ms-header-height, 5rem) + 1.5rem)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Shopify Developer Affiliate Dashboard</h1>
            <p className="text-sm text-on-surface-variant mt-1">Subscription referrals for the MoodScout Shopify app.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4CFC0] bg-white text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-[#F8F7F2] transition-colors dark:border-outline/20 dark:bg-surface-elevated dark:hover:bg-surface-container-low"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4CFC0] bg-white text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-[#F8F7F2] transition-colors dark:border-outline/20 dark:bg-surface-elevated dark:hover:bg-surface-container-low"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {!approved ? (
          <>
            {pending && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800/40 dark:text-yellow-300 rounded-xl p-4 text-sm">
                Your Shopify developer affiliate application is pending review.
              </div>
            )}
            <ApplicationForm currentUser={currentUser} onSubmitted={load} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={<Store className="w-5 h-5" />} label="Active attributed shops" value={dashboard?.stats?.active_shops || 0} />
              <StatCard icon={<ShoppingBag className="w-5 h-5" />} label="Pending shops" value={dashboard?.stats?.pending_shops || 0} />
              <StatCard icon={<DollarSign className="w-5 h-5" />} label="Estimated commission" value={money(dashboard?.stats?.total_commission)} />
            </div>

            <div className={`${cardClass} space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-on-surface">Your Shopify Referral Code</h2>
                  <p className="text-sm text-on-surface-variant">Merchants can enter this code before upgrading in the Shopify app.</p>
                </div>
                {dashboard?.code?.referral_code && (
                  <button onClick={copyCode} className="inline-flex items-center gap-2 px-3 py-2 bg-[#F0EAE0] rounded-lg text-sm font-medium text-on-surface dark:bg-surface-container-low">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : dashboard.code.referral_code}
                  </button>
                )}
              </div>
              <form onSubmit={saveCode} className="flex flex-col sm:flex-row gap-3">
                <input
                  value={newCode}
                  onChange={(event) => setNewCode(event.target.value)}
                  placeholder="your-code"
                  className={`flex-1 ${inputClass}`}
                />
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold">
                  <Save className="w-4 h-4" /> Save Code
                </button>
              </form>
              {codeMessage && (
                <div className={`text-sm rounded-lg p-3 ${codeMessage.type === 'success' ? 'bg-success-green/10 text-success-green border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'}`}>
                  {codeMessage.text}
                </div>
              )}
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-on-surface">Payment Method</h2>
              <p className="text-sm text-on-surface-variant mt-1">Set up the bank account where future Shopify affiliate payouts should be sent.</p>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-settings', { detail: { initialTab: 'payment', initialMobilePane: 'detail' } }))} className="inline-flex mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm">Set up bank payout</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> Request Developer Withdrawal</h2>
                <p className="text-sm text-on-surface-variant mt-1">This uses only Shopify developer affiliate commission. It never includes influencer referral earnings.</p>
                <form onSubmit={requestWithdrawal} className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-on-surface-variant">$</span>
                    <input type="number" min={dashboard?.withdrawal?.min_withdrawal_amount || 50} step="0.01" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="0.00" className={`flex-1 ${inputClass}`} />
                  </div>
                  <p className="text-xs text-on-surface-variant">Available: {money(dashboard?.withdrawal?.available_balance)} · Min withdrawal: {money(dashboard?.withdrawal?.min_withdrawal_amount || 50)}</p>
                  {!dashboard?.withdrawal?.has_connect_account && <p className="text-xs text-amber-700 dark:text-amber-300">Set up a bank payout method first. <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-settings', { detail: { initialTab: 'payment', initialMobilePane: 'detail' } }))} className="font-semibold underline">Open payment settings</button></p>}
                  {withdrawMessage && <div className={`rounded-lg p-3 text-sm ${withdrawMessage.type === 'success' ? 'bg-success-green/10 text-success-green border border-success-green/30' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>{withdrawMessage.text}</div>}
                  <button disabled={withdrawing || !withdrawAmount || Number.parseFloat(withdrawAmount) <= 0} className="w-full px-4 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm disabled:opacity-50">{withdrawing ? 'Submitting…' : 'Request withdrawal'}</button>
                </form>
              </div>
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> Developer Withdrawal History</h2>
                {withdrawals.length ? <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">{withdrawals.map((withdrawal) => <div key={withdrawal.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FDFDF8] border border-[#E0DCCE] dark:bg-surface-container-low dark:border-outline/10"><div><div className="font-medium text-on-surface">{money(withdrawal.amount)}</div><div className="text-xs text-on-surface-variant">{new Date(withdrawal.created_at).toLocaleDateString()}</div></div><span className="capitalize text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{withdrawal.status}</span></div>)}</div> : <p className="text-sm text-on-surface-variant mt-4">No Shopify developer withdrawal requests yet.</p>}
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-on-surface mb-4">Commission Timeline</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard?.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: chartTheme.tick }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chartTheme.tick }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value) => money(value)}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      contentStyle={{
                        background: chartTheme.tooltipBg,
                        border: `1px solid ${chartTheme.tooltipBorder}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: chartTheme.tooltipText,
                      }}
                      labelStyle={{ color: chartTheme.tooltipLabel, fontWeight: 600 }}
                      itemStyle={{ color: chartTheme.tooltipText }}
                      cursor={{ fill: chartTheme.cursor }}
                    />
                    <Bar dataKey="commission" fill="#EB9D2A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#D4CFC0] rounded-xl overflow-hidden dark:bg-surface-elevated dark:border-outline/10">
              <div className="px-5 py-4 border-b border-[#E0DCCE] dark:border-outline/10">
                <h2 className="text-lg font-semibold text-on-surface">Attributed Shops</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F0EAE0] text-on-surface-variant dark:bg-surface-container-low">
                    <tr>
                      {['Shop', 'Current Code', 'Last Valid Code', 'Plan', 'Status'].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left font-semibold">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DCCE] dark:divide-outline/10">
                    {(dashboard?.shops || []).map((shop) => (
                      <tr key={shop.shop_domain} className="text-on-surface">
                        <td className="px-4 py-3 font-medium">{shop.shop_domain}</td>
                        <td className="px-4 py-3">{shop.referral_code || '-'}</td>
                        <td className="px-4 py-3">{shop.last_valid_referral_code || '-'}</td>
                        <td className="px-4 py-3">{shop.billing_cycle || shop.plan}</td>
                        <td className="px-4 py-3">{shop.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ShopifyDeveloperDashboard;
