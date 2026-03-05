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
  Calendar, ExternalLink, BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { referralAPI } from '../lib/api';

function StatCard({ icon, label, value, subtext, color = 'amber' }) {
  const colors = {
    amber: 'bg-[#EB9D2A]/10 text-[#EB9D2A]',
    green: 'bg-green-500/10 text-green-600',
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
  };
  return (
    <div className="bg-white border border-[#D4CFC0] rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <div className="text-2xl font-bold text-[#1D1F20]">{value}</div>
      <div className="text-sm text-[#5D5F60] mt-0.5">{label}</div>
      {subtext && <div className="text-xs text-[#A0A2A3] mt-1">{subtext}</div>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-5 h-5 text-[#A0A2A3] animate-spin" />
    </div>
  );
}

export function CreatorDashboard() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
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

  const loadChartData = useCallback(async (grain) => {
    setChartLoading(true);
    try {
      const res = await referralAPI.getChartData(grain);
      setChartData(res.chartData || []);
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
      setEarnings(earningsData);
      setWithdrawals(withdrawalData.withdrawals || []);
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
    if (!amount || amount <= 0) return;

    setWithdrawing(true);
    setWithdrawResult(null);

    try {
      await referralAPI.requestWithdrawal(amount);
      setWithdrawResult({ type: 'success', text: 'Withdrawal request submitted!' });
      setWithdrawAmount('');
      // Reload data
      await loadData();
    } catch (err) {
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
    <div className="min-h-screen bg-[#FDFDF8]">
      <LoadingState />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#FDFDF8] flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-[#3D3F40]">{error}</p>
        <Link to="/" className="text-[#EB9D2A] font-medium hover:underline">Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDF8]">
      {/* Top Bar */}
      <div className="border-b border-[#D4CFC0] px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg hover:bg-[#EEEFE9] text-[#5D5F60] hover:text-[#1D1F20] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#EB9D2A]" />
              <span className="font-semibold text-[#1D1F20]">Influencer Dashboard</span>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg hover:bg-[#EEEFE9] text-[#5D5F60] hover:text-[#1D1F20] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Referral Code Card */}
        {earnings?.referral_code && (
          <div className="bg-gradient-to-r from-[#EB9D2A]/5 to-[#EB9D2A]/10 border border-[#EB9D2A]/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm text-[#5D5F60] mb-1">Your Referral Code</div>
              <div className="text-2xl font-bold text-[#1D1F20] tracking-wide">{earnings.referral_code}</div>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 bg-[#EB9D2A] text-[#1D1F20] rounded-lg font-medium text-sm hover:bg-[#CD8407] transition-colors"
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
        <div className="bg-white border border-[#D4CFC0] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-[#1D1F20] uppercase tracking-wide flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#EB9D2A]" />
              Earnings Over Time
            </h3>
            <div className="flex items-center gap-1 bg-[#EEEFE9] rounded-lg p-1">
              {['daily', 'monthly'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    granularity === g
                      ? 'bg-[#EB9D2A] text-[#1D1F20] shadow-sm'
                      : 'text-[#5D5F60] hover:text-[#1D1F20]'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-64">
            {chartLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-lg">
                <RefreshCw className="w-5 h-5 text-[#A0A2A3] animate-spin" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" vertical={false} />
                <XAxis
                  dataKey="period_label"
                  tick={{ fontSize: 11, fill: '#A0A2A3' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#A0A2A3' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #D4CFC0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value, name) => [
                    `$${parseFloat(value).toFixed(2)}`,
                    name === 'primary_earned' ? 'Direct (40%)' : 'Secondary (10%)',
                  ]}
                  labelStyle={{ color: '#1D1F20', fontWeight: 600, marginBottom: 4 }}
                  cursor={{ fill: '#EEEFE9' }}
                />
                <Legend
                  formatter={(value) =>
                    value === 'primary_earned' ? 'Direct Referrals' : 'Secondary Referrals'
                  }
                  wrapperStyle={{ fontSize: '12px', color: '#5D5F60' }}
                />
                <Bar dataKey="primary_earned" fill="#EB9D2A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="secondary_earned" fill="#36C46F" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {chartData.length === 0 && !chartLoading && (
            <p className="text-center text-xs text-[#A0A2A3] mt-2">
              No earnings yet — share your referral code to start seeing data here.
            </p>
          )}
        </div>

        {/* Withdraw Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Withdrawal */}
          <div className="bg-white border border-[#D4CFC0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#1D1F20] uppercase tracking-wide mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-[#EB9D2A]" />
              Request Withdrawal
            </h3>
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg text-[#5D5F60]">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2.5 bg-[#FDFDF8] border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                             focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A] transition-all"
                />
              </div>
              <p className="text-xs text-[#A0A2A3]">
                Available: {fmt(earnings?.available_balance)} &middot; Min withdrawal: $50.00
              </p>

              {withdrawResult && (
                <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                  withdrawResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {withdrawResult.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {withdrawResult.text}
                </div>
              )}

              <button
                type="submit"
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="w-full px-4 py-2.5 bg-[#EB9D2A] text-[#1D1F20] rounded-lg font-semibold text-sm
                           hover:bg-[#CD8407] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {withdrawing ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </form>
          </div>

          {/* Withdrawal History */}
          <div className="bg-white border border-[#D4CFC0] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#1D1F20] uppercase tracking-wide mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#EB9D2A]" />
              Withdrawal History
            </h3>
            {withdrawals.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between px-3 py-2 bg-[#FDFDF8] border border-[#E0DCCE] rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-[#1D1F20]">{fmt(w.amount)}</div>
                      <div className="text-xs text-[#A0A2A3]">
                        {new Date(w.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      w.status === 'completed' ? 'bg-green-100 text-green-700' :
                      w.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#A0A2A3] py-4">No withdrawal requests yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatorDashboard;
