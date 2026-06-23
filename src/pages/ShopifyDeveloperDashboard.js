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

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white border border-[#D4CFC0] rounded-xl p-5">
      <div className="w-10 h-10 rounded-lg bg-[#EB9D2A]/10 text-[#EB9D2A] flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-[#1D1F20]">{value}</div>
      <div className="text-sm text-[#5D5F60] mt-0.5">{label}</div>
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
    <form onSubmit={submit} className="bg-white border border-[#D4CFC0] rounded-xl p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#1D1F20]">Apply for Shopify Developer Affiliate Access</h2>
        <p className="text-sm text-[#5D5F60] mt-1">
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
        <label key={key} className="grid gap-1 text-sm font-medium text-[#1D1F20]">
          {label}
          <input
            value={form[key]}
            onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
            className="px-3 py-2 bg-[#FDFDF8] border border-[#D4CFC0] rounded-lg font-normal"
            required={key === 'fullName' || key === 'email'}
          />
        </label>
      ))}
      <label className="grid gap-1 text-sm font-medium text-[#1D1F20]">
        Why do you want to refer Shopify merchants?
        <textarea
          value={form.reason}
          onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
          rows={4}
          className="px-3 py-2 bg-[#FDFDF8] border border-[#D4CFC0] rounded-lg font-normal"
          required
        />
      </label>
      {message && (
        <div className={`text-sm rounded-lg p-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <button
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EB9D2A] text-[#1D1F20] rounded-lg font-semibold disabled:opacity-60"
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
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCode, setNewCode] = useState('');
  const [codeMessage, setCodeMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await shopifyAffiliateAPI.getDashboard();
      const nextDashboard = response.data.dashboard;
      setDashboard(nextDashboard);
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

  if (authLoading || loading) {
    return <div className="min-h-screen bg-[#FDFDF8] flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin text-[#A0A2A3]" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFDF8] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-[#3D3F40]">{error}</p>
          <Link className="text-[#EB9D2A] font-medium" to="/">Go home</Link>
        </div>
      </div>
    );
  }

  const approved = dashboard?.applications?.some((app) => app.status === 'approved');
  const pending = dashboard?.applications?.some((app) => app.status === 'pending');

  return (
    <div className="min-h-screen bg-[#FDFDF8]">
      <div className="border-b border-[#D4CFC0] px-4 sm:px-6 py-3 bg-white/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-[#5D5F60] hover:text-[#1D1F20]">
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <button onClick={load} className="p-2 rounded-lg hover:bg-[#EEEFE9]" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1F20]">Shopify Developer Affiliate Dashboard</h1>
          <p className="text-sm text-[#5D5F60] mt-1">Subscription referrals for the MoodScout Shopify app.</p>
        </div>

        {!approved ? (
          <>
            {pending && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 text-sm">
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

            <div className="bg-white border border-[#D4CFC0] rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1D1F20]">Your Shopify Referral Code</h2>
                  <p className="text-sm text-[#5D5F60]">Merchants can enter this code before upgrading in the Shopify app.</p>
                </div>
                {dashboard?.code?.referral_code && (
                  <button onClick={copyCode} className="inline-flex items-center gap-2 px-3 py-2 bg-[#EEEFE9] rounded-lg text-sm font-medium">
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
                  className="flex-1 px-3 py-2 bg-[#FDFDF8] border border-[#D4CFC0] rounded-lg"
                />
                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#EB9D2A] text-[#1D1F20] rounded-lg font-semibold">
                  <Save className="w-4 h-4" /> Save Code
                </button>
              </form>
              {codeMessage && (
                <div className={`text-sm rounded-lg p-3 ${codeMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {codeMessage.text}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#D4CFC0] rounded-xl p-5">
              <h2 className="text-lg font-semibold text-[#1D1F20] mb-4">Commission Timeline</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard?.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" vertical={false} />
                    <XAxis dataKey="period" tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })} />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => money(value)} labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <Bar dataKey="commission" fill="#EB9D2A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#D4CFC0] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E0DCCE]">
                <h2 className="text-lg font-semibold text-[#1D1F20]">Attributed Shops</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F7F4EA] text-[#5D5F60]">
                    <tr>
                      {['Shop', 'Current Code', 'Last Valid Code', 'Plan', 'Status'].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left font-semibold">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DCCE]">
                    {(dashboard?.shops || []).map((shop) => (
                      <tr key={shop.shop_domain}>
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
