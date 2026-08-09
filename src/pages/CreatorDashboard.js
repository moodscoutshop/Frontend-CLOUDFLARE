/**
 * CreatorDashboard — /creator/dashboard
 * 
 * Features:
 * - Earnings summary (total earned, available balance, active users)
 * - Monthly earnings breakdown
 * - Referral code display
 * - Withdrawal request form
 * - Withdrawal history table
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  DollarSign, Users, TrendingUp, Wallet, Download,
  RefreshCw, Copy, Check, ArrowLeft, Sparkles, AlertCircle,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { referralAPI } from '../lib/api';
import { Navbar } from '../components/layout';
import { WaitlistModal } from '../components/modals/WaitlistModal';
import { useChartTheme } from '../hooks/useChartTheme';


const cardClass =
  'bg-white border border-[#D4CFC0] rounded-xl p-5 dark:bg-surface-elevated dark:border-outline/10';
const inputClass =
  'flex-1 px-3 py-2.5 bg-[#FDFDF8] border border-[#C5BFAE] rounded-lg text-sm text-on-surface ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ' +
  'dark:bg-surface-container-low dark:border-outline/30';

function StatCard({ icon, label, value, subtext, color = 'amber' }) {
  const colors = {
    amber: 'bg-primary/10 text-primary',
    green: 'bg-success-green/10 text-success-green',
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
  };
  return (
    <div className={cardClass}>
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <div className="text-2xl font-bold text-on-surface">{value}</div>
      <div className="text-sm text-on-surface-variant mt-0.5">{label}</div>
      {subtext && <div className="text-xs text-on-surface-variant/70 mt-1">{subtext}</div>}
    </div>
  );
}

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded bg-outline/25 dark:bg-outline/20 ${className}`} />;
}

function LoadingState() {
  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6"
      style={{ paddingTop: 'calc(var(--ms-header-height, 5rem) + 1.5rem)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Bone className="h-8 w-56" />
        <div className="flex gap-2">
          <Bone className="h-9 w-20 rounded-lg" />
          <Bone className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      <Bone className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${cardClass} space-y-3`}>
            <Bone className="h-10 w-10 rounded-lg" />
            <Bone className="h-7 w-24" />
            <Bone className="h-4 w-32" />
          </div>
        ))}
      </div>
      <div className={`${cardClass} space-y-4`}>
        <div className="flex justify-between">
          <Bone className="h-5 w-40" />
          <Bone className="h-8 w-28 rounded-lg" />
        </div>
        <Bone className="h-64 w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardClass} space-y-3`}>
          <Bone className="h-5 w-36" />
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-4 w-48" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>
        <div className={`${cardClass} space-y-3`}>
          <Bone className="h-5 w-40" />
          <Bone className="h-12 w-full rounded-lg" />
          <Bone className="h-12 w-full rounded-lg" />
          <Bone className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CreatorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const chartTheme = useChartTheme();
  const [earnings, setEarnings] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [granularity, setGranularity] = useState('monthly');
  const [chartLoading, setChartLoading] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const loadChartData = useCallback(async (grain) => {
    setChartLoading(true);
    try {
      const res = await referralAPI.getChartData(grain);
      setChartData(res.data?.chartData || []);
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [earningsData, withdrawalData] = await Promise.all([
        referralAPI.getEarnings(),
        referralAPI.getWithdrawals(),
      ]);
      setEarnings(earningsData.data?.earnings || null);
      setWithdrawals(withdrawalData.data?.withdrawals || []);
    } catch (err) {
      console.error('Failed to load creator data:', err);
      if (err.response?.status === 403) {
        setError('You must be an approved influencer to access this page.');
      } else {
        setError('Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated) {
      loadData();
      loadChartData('monthly');
    }
  }, [isAuthenticated, authLoading, navigate, loadData, loadChartData]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChartData(granularity);
    }
  }, [granularity, isAuthenticated, loadChartData]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    const minAmount = Number(earnings?.min_withdrawal_amount || 50);
    if (!amount || amount <= 0) return;
    if (amount < minAmount) {
      setWithdrawResult({ type: 'error', text: `Minimum withdrawal amount is ${fmt(minAmount)}.` });
      return;
    }
    if (!earnings?.has_connect_account) {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: { initialTab: 'payment', initialMobilePane: 'detail' } }));
      return;
    }

    setWithdrawing(true);
    setWithdrawResult(null);

    try {
      await referralAPI.requestWithdrawal(amount);
      setWithdrawResult({ type: 'success', text: 'Withdrawal request submitted!' });
      setWithdrawAmount('');
      // Reload data
      await loadData();
    } catch (err) {
      if (err.response?.data?.code === 'payout_setup_required') {
        window.dispatchEvent(new CustomEvent('open-settings', { detail: { initialTab: 'payment', initialMobilePane: 'detail' } }));
        return;
      }
      setWithdrawResult({ type: 'error', text: err.response?.data?.error || 'Withdrawal failed.' });
    } finally {
      setWithdrawing(false);
    }
  };

  const copyCode = async () => {
    if (earnings?.referral_code) {
      await navigator.clipboard.writeText(earnings.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background">
      <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
      <LoadingState />
      <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background">
      <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
      <div className="flex items-center justify-center p-4" style={{ paddingTop: 'calc(var(--ms-header-height, 5rem) + 2rem)' }}>
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-on-surface-variant">{error}</p>
          <Link to="/" className="text-primary font-medium hover:underline">Go Home</Link>
        </div>
      </div>
      <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
      <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />

      <div
        className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6"
        style={{ paddingTop: 'calc(var(--ms-header-height, 5rem) + 1.5rem)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface truncate">Influencer Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4CFC0] bg-white text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-[#F8F7F2] transition-colors dark:border-outline/20 dark:bg-surface-elevated dark:hover:bg-surface-container-low"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4CFC0] bg-white text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-[#F8F7F2] transition-colors dark:border-outline/20 dark:bg-surface-elevated dark:hover:bg-surface-container-low"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Referral Code Card */}
        {earnings?.referral_code && (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm text-on-surface-variant mb-1">Your Referral Code</div>
              <div className="text-2xl font-bold text-on-surface tracking-wide">{earnings.referral_code}</div>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-medium text-sm hover:opacity-90 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign />}
            label="Total Earned"
            value={fmt(earnings?.total_earned)}
            subtext={`${earnings?.commission_rate ? (earnings.commission_rate * 100).toFixed(0) : 40}% commission rate`}
            color="amber"
          />
          <StatCard
            icon={<Wallet />}
            label="Available Balance"
            value={fmt(earnings?.available_balance)}
            subtext={`${fmt(earnings?.total_withdrawn)} withdrawn`}
            color="green"
          />
          <StatCard
            icon={<TrendingUp />}
            label="Total Sales"
            value={fmt(earnings?.total_sales)}
            subtext={`${earnings?.total_transactions || 0} transactions`}
            color="blue"
          />
          <StatCard
            icon={<Users />}
            label="Active Users"
            value={earnings?.active_referral_users ?? 0}
            subtext="Using your code"
            color="purple"
          />
        </div>

        {/* Earnings Chart */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wide flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Earnings Over Time
            </h3>
            <div className="flex items-center gap-1 bg-[#F0EAE0] rounded-lg p-1 dark:bg-surface-container-low">
              {['daily', 'monthly'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    granularity === g
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-64">
            {chartLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-lg dark:bg-surface-elevated/70">
                <RefreshCw className="w-5 h-5 text-on-surface-variant animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.length > 0 ? chartData : [
                  { period_label: granularity === 'daily' ? 'Today' : 'This Month', primary_earned: 0, secondary_earned: 0 }
                ]}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="period_label"
                  tick={{ fontSize: 11, fill: chartTheme.tick }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chartTheme.tick }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltipBg,
                    border: `1px solid ${chartTheme.tooltipBorder}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    color: chartTheme.tooltipText,
                  }}
                  formatter={(value, name) => [
                    `$${parseFloat(value).toFixed(2)}`,
                    name === 'primary_earned' ? 'Direct (40%)' : 'Secondary (10%)',
                  ]}
                  labelStyle={{ color: chartTheme.tooltipLabel, fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                  cursor={{ fill: chartTheme.cursor }}
                />
                <Legend
                  formatter={(value) =>
                    value === 'primary_earned' ? 'Direct Referrals' : 'Secondary Referrals'
                  }
                  wrapperStyle={{ fontSize: '12px', color: chartTheme.legend }}
                />
                <Bar dataKey="primary_earned" fill="#EB9D2A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="secondary_earned" fill="#36C46F" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {chartData.length === 0 && !chartLoading && (
            <p className="text-center text-xs text-on-surface-variant mt-2">
              No earnings yet — share your referral code to start seeing data here.
            </p>
          )}
        </div>

        {/* Withdraw Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Withdrawal */}
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wide mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Request Withdrawal
            </h3>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg text-on-surface-variant">$</span>
                <input
                  type="number"
                  min={earnings?.min_withdrawal_amount || 50}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-on-surface-variant">
                Available: {fmt(earnings?.available_balance)} &middot; Min withdrawal: {fmt(earnings?.min_withdrawal_amount || 50)}
              </p>

              {!earnings?.has_connect_account && <p className="text-xs text-amber-700 dark:text-amber-300">Set up a bank payout method before withdrawing. <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-settings', { detail: { initialTab: 'payment', initialMobilePane: 'detail' } }))} className="font-semibold underline">Open payment settings</button></p>}

              {withdrawResult && (
                <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                  withdrawResult.type === 'success' ? 'bg-success-green/10 text-success-green border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                }`}>
                  {withdrawResult.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {withdrawResult.text}
                </div>
              )}

              <button
                type="submit"
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="w-full px-4 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {withdrawing ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </form>
          </div>

          {/* Withdrawal History */}
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wide mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Withdrawal History
            </h3>
            {withdrawals.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between px-3 py-2 bg-[#FDFDF8] border border-[#E0DCCE] rounded-lg dark:bg-surface-container-low dark:border-outline/10">
                    <div>
                      <div className="text-sm font-medium text-on-surface">{fmt(w.amount)}</div>
                      <div className="text-xs text-on-surface-variant">
                        {new Date(w.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      w.status === 'completed' ? 'bg-success-green/15 text-success-green' :
                      w.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant py-4">No withdrawal requests yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatorDashboard;
