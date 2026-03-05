/**
 * AdminDashboard — /dev/dashboard
 * 
 * Features:
 * - Overview stats (users, searches, today)
 * - Users list with search history drill-down
 * - Analytics (top keywords, search types)
 * - Tools (cache clear, logs viewer)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, BarChart3, Settings, LogOut, RefreshCw,
  TrendingUp, Trash2, ChevronRight, ChevronLeft,
  ArrowLeft, Shield, Activity, Menu,
  FileText, DollarSign, Download, Wallet, Sparkles,
  Check, X as XIcon, AlertCircle, Loader2, Copy, Clock,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function useAdminAPI() {
  const token = localStorage.getItem('admin_token');

  const fetchAdmin = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Admin ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/dev';
      throw new Error('Session expired');
    }
    return res.json();
  }, [token]);

  return { fetchAdmin, token };
}

// ─── Overview Tab ─────────────────────────────────────────────────
function OverviewTab() {
  const { fetchAdmin } = useAdminAPI();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmin('/api/admin/overview')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchAdmin]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users />} label="Total Users" value={stats?.total_users ?? '—'} color="blue" />
        <StatCard icon={<Search />} label="Total Searches" value={stats?.total_searches ?? '—'} color="amber" />
        <StatCard icon={<TrendingUp />} label="Searches Today" value={stats?.searches_today ?? '—'} color="green" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    amber: 'bg-amber-500/10 text-amber-400',
    green: 'bg-green-500/10 text-green-400',
  };
  return (
    <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────
function UsersTab() {
  const { fetchAdmin } = useAdminAPI();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchAdmin('/api/admin/users')
      .then(data => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchAdmin]);

  const viewHistory = async (user) => {
    setSelectedUser(user);
    setHistoryLoading(true);
    try {
      const data = await fetchAdmin(`/api/admin/users/${user.id}/history`);
      setUserHistory(data.searches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  if (selectedUser) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>
        <h2 className="text-lg font-semibold text-white">
          {selectedUser.display_name || selectedUser.email}
        </h2>
        <p className="text-sm text-gray-400">{selectedUser.email}</p>

        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Search History</h3>
          {historyLoading ? <LoadingState /> : userHistory.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No searches found.</p>
          ) : (
            <div className="space-y-1">
              {userHistory.map(s => (
                <div key={s.id} className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">{s.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{s.search_type} — {new Date(s.created_at).toLocaleString()}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#3A3C3E] text-gray-400">{s.search_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Users ({users.length})</h2>
      <div className="space-y-1">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => viewHistory(user)}
            className="w-full bg-[#2A2C2E] border border-[#3A3C3E] rounded-lg px-4 py-3 flex items-center justify-between hover:border-[#EB9D2A]/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              {user.photo_url ? (
                <img src={user.photo_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EB9D2A]/20 flex items-center justify-center text-[#EB9D2A] text-sm font-bold">
                  {(user.display_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm text-white">{user.display_name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{user.search_count} searches</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────
function AnalyticsTab() {
  const { fetchAdmin } = useAdminAPI();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmin('/api/admin/analytics')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fetchAdmin]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Analytics</h2>

      {/* Search Type Distribution */}
      <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Search Types</h3>
        {data?.search_types?.length ? (
          <div className="space-y-2">
            {data.search_types.map(t => (
              <div key={t.search_type} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{t.search_type || 'unknown'}</span>
                <span className="text-sm text-[#EB9D2A] font-semibold">{t.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No data yet.</p>
        )}
      </div>

      {/* Top Keywords */}
      <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Top Keywords</h3>
        {data?.top_keywords?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.top_keywords.map(k => (
              <span key={k.keyword} className="px-2.5 py-1 bg-[#3A3C3E] rounded-full text-xs text-gray-300">
                {k.keyword} <span className="text-[#EB9D2A] ml-1">({k.count})</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No keywords yet.</p>
        )}
      </div>

      {/* Daily Searches */}
      <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Daily Searches (Last 30 Days)</h3>
        {data?.daily_searches?.length ? (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {data.daily_searches.map(d => (
              <div key={d.date} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{new Date(d.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-[#EB9D2A]/30 rounded-full" style={{ width: `${Math.max(20, d.count * 10)}px` }}>
                    <div className="h-full bg-[#EB9D2A] rounded-full" style={{ width: '100%' }} />
                  </div>
                  <span className="text-white font-medium w-8 text-right">{d.count}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No data yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Tools Tab ────────────────────────────────────────────────────
function ToolsTab() {
  const { fetchAdmin } = useAdminAPI();
  const [logs, setLogs] = useState([]);
  const [cacheMsg, setCacheMsg] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLevel, setLogLevel] = useState('');

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const params = logLevel ? `?level=${logLevel}` : '';
      const data = await fetchAdmin(`/api/admin/logs${params}`);
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const data = await fetchAdmin('/api/admin/cache/clear', { method: 'POST' });
      setCacheMsg(data.message || 'Done');
      setTimeout(() => setCacheMsg(''), 3000);
    } catch (err) {
      setCacheMsg('Failed to clear cache');
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const levelColors = { info: 'text-blue-400', warn: 'text-yellow-400', error: 'text-red-400' };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Tools</h2>

      {/* Cache Clear */}
      <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Cache</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear Cache
          </button>
          {cacheMsg && <span className="text-green-400 text-sm">{cacheMsg}</span>}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Logs</h3>
          <div className="flex items-center gap-2">
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="bg-[#1D1F20] border border-[#3A3C3E] text-gray-300 text-xs rounded-lg px-2 py-1"
            >
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <button
              onClick={loadLogs}
              className="p-1.5 rounded-lg hover:bg-[#3A3C3E] text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-[#1D1F20] rounded-lg p-3 max-h-96 overflow-y-auto font-mono text-xs space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-gray-600">No logs available.</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={`flex-shrink-0 w-12 ${levelColors[log.level] || 'text-gray-400'}`}>[{log.level}]</span>
                <span className="text-gray-300 break-all">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────
function ApplicationsTab() {
  const { fetchAdmin } = useAdminAPI();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdmin('/api/admin/applications');
      setApps(data.applications || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [fetchAdmin]);

  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    setActionLoading(id);
    try {
      await fetchAdmin(`/api/admin/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes: '' }),
      });
      load();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Influencer Applications ({apps.length})</h2>
      {apps.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No applications yet.</p>
      ) : (
        <div className="space-y-2">
          {apps.map(app => (
            <div key={app.id} className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{app.full_name}</div>
                  <div className="text-xs text-gray-400">{app.email}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  app.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {app.status}
                </span>
              </div>
              {app.social_links && <div className="text-xs text-gray-500">Links: {app.social_links}</div>}
              {app.audience_size && <div className="text-xs text-gray-500">Audience: {app.audience_size}</div>}
              <div className="text-sm text-gray-300">{app.reason}</div>
              <div className="text-xs text-gray-600">{new Date(app.created_at).toLocaleString()}</div>

              {app.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => review(app.id, 'approved')}
                    disabled={actionLoading === app.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 text-xs font-medium disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => review(app.id, 'rejected')}
                    disabled={actionLoading === app.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs font-medium disabled:opacity-50"
                  >
                    <XIcon className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Transactions Tab (ePN Performance by Custom ID) ──────────────
function TransactionsTab() {
  const { fetchAdmin } = useAdminAPI();
  const [txns, setTxns] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' | 'raw'

  // Date range for import (default last 30 days)
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txData, sumData] = await Promise.all([
        fetchAdmin('/api/admin/transactions'),
        fetchAdmin('/api/admin/transactions/summary'),
      ]);
      setTxns(txData.transactions || []);
      setSummary(sumData.summary || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [fetchAdmin]);

  useEffect(() => { load(); }, [load]);

  const runImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const data = await fetchAdmin('/api/admin/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate }),
      });
      setImportResult({
        type: 'success',
        text: `Imported ${data.imported || 0} rows (${data.skipped || 0} skipped, ${data.total_fetched || 0} fetched from ePN)`,
      });
      load();
    } catch (err) {
      setImportResult({ type: 'error', text: 'Import failed: ' + (err.message || 'Unknown error') });
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white">ePN Performance by Custom ID</h2>
        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="bg-[#1D1F20] border border-[#3A3C3E] text-gray-300 text-xs rounded-lg px-2 py-1.5"
          >
            <option value="summary">Summary</option>
            <option value="raw">Raw Data</option>
          </select>
        </div>
      </div>

      {/* Date range + import */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-[#2A2C2E] border border-[#3A3C3E] rounded-lg">
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#1D1F20] border border-[#3A3C3E] text-gray-300 text-xs rounded-lg px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#1D1F20] border border-[#3A3C3E] text-gray-300 px-2 py-1.5 text-xs rounded-lg"
          />
        </div>
        <button
          onClick={runImport}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EB9D2A]/10 text-[#EB9D2A] rounded-lg hover:bg-[#EB9D2A]/20 text-xs font-medium disabled:opacity-50"
        >
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {importing ? 'Importing...' : 'Import from ePN'}
        </button>
      </div>

      {importResult && (
        <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
          importResult.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {importResult.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {importResult.text}
        </div>
      )}

      {view === 'summary' ? (
        <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">By Custom ID</h3>
          {summary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-[#3A3C3E]">
                    <th className="text-left py-2 pr-3">Custom ID</th>
                    <th className="text-right py-2 pr-3">Clicks</th>
                    <th className="text-right py-2 pr-3">Sale $</th>
                    <th className="text-right py-2 pr-3">Items</th>
                    <th className="text-right py-2 pr-3">Txns</th>
                    <th className="text-right py-2 pr-3">Action $</th>
                    <th className="text-right py-2 pr-3">Other $</th>
                    <th className="text-right py-2">Total $</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s, i) => (
                    <tr key={i} className="border-b border-[#3A3C3E]/50 hover:bg-[#3A3C3E]/20">
                      <td className="py-1.5 pr-3 text-gray-300 font-mono">{s.custom_id || '(none)'}</td>
                      <td className="py-1.5 pr-3 text-right text-gray-400">{parseInt(s.total_clicks || 0).toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right text-gray-400">${parseFloat(s.total_sales || 0).toFixed(2)}</td>
                      <td className="py-1.5 pr-3 text-right text-gray-400">{parseInt(s.total_items_ordered || 0).toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right text-gray-400">{parseInt(s.total_transactions || 0).toLocaleString()}</td>
                      <td className="py-1.5 pr-3 text-right text-gray-300">${parseFloat(s.total_action_earnings || 0).toFixed(2)}</td>
                      <td className="py-1.5 pr-3 text-right text-gray-400">${parseFloat(s.total_other_earnings || 0).toFixed(2)}</td>
                      <td className="py-1.5 text-right text-[#EB9D2A] font-semibold">${parseFloat(s.total_earnings || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No performance data yet. Import from ePN to populate.</p>
          )}
        </div>
      ) : (
        <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Raw Performance Data ({txns.length})</h3>
          {txns.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-[#3A3C3E]">
                  <th className="text-left py-2 pr-3">Custom ID</th>
                  <th className="text-left py-2 pr-3">Period</th>
                  <th className="text-right py-2 pr-3">Clicks</th>
                  <th className="text-right py-2 pr-3">Sale $</th>
                  <th className="text-right py-2 pr-3">Items</th>
                  <th className="text-right py-2 pr-3">Txns</th>
                  <th className="text-right py-2">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {txns.slice(0, 100).map(t => (
                  <tr key={t.id} className="border-b border-[#3A3C3E]/50">
                    <td className="py-1.5 pr-3 text-gray-300 font-mono">{t.custom_id || '—'}</td>
                    <td className="py-1.5 pr-3 text-gray-400">
                      {t.report_start_date ? new Date(t.report_start_date).toLocaleDateString() : '—'}
                      {' – '}
                      {t.report_end_date ? new Date(t.report_end_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-1.5 pr-3 text-right text-gray-400">{t.clicks || 0}</td>
                    <td className="py-1.5 pr-3 text-right text-gray-400">${parseFloat(t.sales || 0).toFixed(2)}</td>
                    <td className="py-1.5 pr-3 text-right text-gray-400">{t.items_ordered || 0}</td>
                    <td className="py-1.5 pr-3 text-right text-gray-400">{t.transactions || 0}</td>
                    <td className="py-1.5 text-right text-[#EB9D2A]">${parseFloat(t.total_earnings || 0).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-sm">No raw data yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Withdrawals Tab ──────────────────────────────────────────────
function WithdrawalsTab() {
  const { fetchAdmin } = useAdminAPI();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdmin('/api/admin/withdrawals');
      setWithdrawals(data.withdrawals || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [fetchAdmin]);

  useEffect(() => { load(); }, [load]);

  const process = async (id, status) => {
    setActionLoading(id);
    try {
      await fetchAdmin(`/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes: '' }),
      });
      load();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Withdrawal Requests ({withdrawals.length})</h2>
      {withdrawals.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No withdrawal requests yet.</p>
      ) : (
        <div className="space-y-2">
          {withdrawals.map(w => (
            <div key={w.id} className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-white">${parseFloat(w.amount).toFixed(2)}</div>
                  <div className="text-xs text-gray-400">User ID: {w.creator_user_id}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  w.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  w.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                  w.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {w.status}
                </span>
              </div>
              <div className="text-xs text-gray-600">{new Date(w.created_at).toLocaleString()}</div>

              {w.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => process(w.id, 'approved')}
                    disabled={actionLoading === w.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 text-xs font-medium disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => process(w.id, 'completed')}
                    disabled={actionLoading === w.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-xs font-medium disabled:opacity-50"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Mark Paid
                  </button>
                  <button
                    onClick={() => process(w.id, 'rejected')}
                    disabled={actionLoading === w.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-xs font-medium disabled:opacity-50"
                  >
                    <XIcon className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cooldown badge helper ────────────────────────────────────────
function CooldownBadge({ daysLeft, totalDays }) {
  const pct = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 100;
  const active = daysLeft > 0;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-[#3A3C3E] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${active ? 'bg-amber-400' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono whitespace-nowrap ${active ? 'text-amber-400' : 'text-green-400'}`}>
        {active ? `${daysLeft}d left` : 'Ready'}
      </span>
    </div>
  );
}

// ─── Referral Overview Tab ────────────────────────────────────────
function ReferralOverviewTab() {
  const { fetchAdmin } = useAdminAPI();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [influencers, setInfluencers] = useState([]);
  const [infLoading, setInfLoading] = useState(true);

  useEffect(() => {
    fetchAdmin('/api/admin/referral-overview')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchAdmin('/api/admin/influencers')
      .then((res) => setInfluencers(res.influencers || []))
      .catch(console.error)
      .finally(() => setInfLoading(false));
  }, [fetchAdmin]);

  if (loading && infLoading) return <LoadingState />;

  const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Referral Overview</h2>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Users />} label="Total Influencers" value={data?.total_creators ?? '—'} color="blue" />
          <StatCard icon={<FileText />} label="Pending Applications" value={data?.pending_applications ?? '—'} color="amber" />
          <StatCard icon={<DollarSign />} label="Total Commissions" value={`$${parseFloat(data?.total_commissions || 0).toFixed(2)}`} color="green" />
        </div>
      )}

      {/* Top Referral Codes */}
      {data?.top_codes?.length > 0 && (
        <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Top Referral Codes</h3>
          <div className="space-y-2">
            {data.top_codes.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-mono">{c.referral_code}</span>
                <span className="text-gray-400">{c.user_count} users</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Influencers Table */}
      <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#3A3C3E] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#EB9D2A]" />
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Influencers</h3>
          <span className="ml-auto text-xs text-gray-500">{influencers.length} total</span>
        </div>
        {infLoading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
          </div>
        ) : influencers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">No influencers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3A3C3E]">
                  {['Influencer', 'Referral Code', 'Code Cooldown', 'Commission', 'Secondary Referrer', 'Earnings', 'Joined'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A3C3E]">
                {influencers.map((inf) => (
                  <tr key={inf.id} className="hover:bg-[#313436] transition-colors">
                    {/* Influencer */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-white whitespace-nowrap">{inf.display_name || 'Unnamed'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[160px]">{inf.email}</div>
                    </td>
                    {/* Referral Code */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[#EB9D2A] bg-[#EB9D2A]/10 px-2 py-0.5 rounded text-xs">
                        {inf.referral_code || '—'}
                      </span>
                    </td>
                    {/* Cooldown */}
                    <td className="px-4 py-3">
                      <CooldownBadge
                        daysLeft={parseInt(inf.cooldown_remaining_days) || 0}
                        totalDays={parseInt(inf.cooldown_days) || 30}
                      />
                    </td>
                    {/* Commission */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 font-semibold">{((inf.commission_rate || 0.4) * 100).toFixed(0)}%</span>
                        <span className="text-gray-500 text-xs">direct</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-green-400 font-semibold">{((inf.secondary_commission_rate || 0.1) * 100).toFixed(0)}%</span>
                        <span className="text-gray-500 text-xs">2nd-tier</span>
                      </div>
                    </td>
                    {/* Secondary Referrer */}
                    <td className="px-4 py-3">
                      {inf.secondary_referrer_name ? (
                        <div>
                          <div className="text-white text-xs whitespace-nowrap">{inf.secondary_referrer_name}</div>
                          <span className="font-mono text-gray-400 text-xs">{inf.secondary_referrer_code}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    {/* Earnings */}
                    <td className="px-4 py-3">
                      <div className="text-amber-400 font-semibold text-xs">{fmt(inf.total_primary_earned)} <span className="text-gray-500 font-normal">direct</span></div>
                      <div className="text-green-400 font-semibold text-xs">{fmt(inf.total_secondary_earned)} <span className="text-gray-500 font-normal">2nd</span></div>
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {inf.joined_at ? new Date(inf.joined_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── System Settings Tab ──────────────────────────────────────────
function SystemSettingsTab() {
  const { fetchAdmin } = useAdminAPI();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdmin('/api/admin/settings');
      const raw = data.settings || {};
      const normalized = Array.isArray(raw)
        ? raw
        : Object.entries(raw).map(([key, obj]) => ({
            key,
            value: typeof obj === 'object' && obj !== null ? obj.value : obj,
          }));
      setSettings(normalized);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [fetchAdmin]);

  useEffect(() => { load(); }, [load]);

  const update = async (key, value) => {
    setSaving(key);
    try {
      await fetchAdmin('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value }),
      });
      load();
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  };

  if (loading) return <LoadingState />;

  const friendlyNames = {
    commission_rate: 'Commission Rate',
    min_withdrawal_amount: 'Min Withdrawal ($)',
    referral_code_cooldown_days: 'Code Cooldown (days)',
    default_referral_code: 'Default Referral Code',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">System Settings</h2>
      <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-xl p-5 space-y-4">
        {settings.map(s => (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-white font-medium">{friendlyNames[s.key] || s.key}</div>
              <div className="text-xs text-gray-500">{s.key}</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                defaultValue={s.value}
                onBlur={(e) => {
                  if (e.target.value !== s.value) {
                    update(s.key, e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
                className="w-40 px-3 py-1.5 bg-[#1D1F20] border border-[#3A3C3E] rounded-lg text-sm text-white
                           focus:outline-none focus:ring-1 focus:ring-[#EB9D2A] focus:border-[#EB9D2A]"
              />
              {saving === s.key && <Loader2 className="w-4 h-4 text-[#EB9D2A] animate-spin" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
    </div>
  );
}

// ─── Main Dashboard Layout ────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  // Default collapsed on narrow screens
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/dev');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/dev');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity /> },
    { id: 'users', label: 'Users', icon: <Users /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 /> },
    { id: 'applications', label: 'Applications', icon: <FileText /> },
    { id: 'transactions', label: 'Transactions', icon: <DollarSign /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <Download /> },
    { id: 'referral', label: 'Referral', icon: <Sparkles /> },
    { id: 'sys-settings', label: 'Settings', icon: <Settings /> },
    { id: 'tools', label: 'Tools', icon: <Settings /> },
  ];

  return (
    <div className="min-h-screen bg-[#1D1F20] text-white">
      {/* Top nav */}
      <div className="border-b border-[#3A3C3E] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#EB9D2A]" />
          <span className="font-semibold hidden sm:inline">MoodScout Admin</span>
          <span className="font-semibold sm:hidden">Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="flex">
        {/* Side nav — collapsible */}
        <div
          className={`
            flex-shrink-0 border-r border-[#3A3C3E] bg-[#1D1F20]
            min-h-[calc(100vh-52px)] py-3 transition-[width,padding] duration-200
            ${sidebarCollapsed ? 'w-12 px-1' : 'w-48 px-2'}
          `}
        >
          {/* Collapse / expand toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center p-1.5 mb-2 rounded-lg
                       hover:bg-[#2A2C2E] text-gray-500 hover:text-gray-300 transition-colors"
          >
            {sidebarCollapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />}
          </button>

          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={sidebarCollapsed ? tab.label : undefined}
              className={`
                w-full flex items-center gap-2.5 py-2 rounded-lg text-sm transition-colors mb-0.5
                ${sidebarCollapsed ? 'justify-center px-1' : 'px-3'}
                ${activeTab === tab.id
                  ? 'bg-[#EB9D2A]/10 text-[#EB9D2A]'
                  : 'text-gray-400 hover:text-white hover:bg-[#2A2C2E]'}
              `}
            >
              {React.cloneElement(tab.icon, { className: 'w-4 h-4 flex-shrink-0' })}
              {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
            </button>
          ))}
        </div>

        {/* Content — min-w-0 prevents flex overflow, overflow-x-auto handles wide tables */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-auto">
          <div className="max-w-4xl">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'applications' && <ApplicationsTab />}
            {activeTab === 'transactions' && <TransactionsTab />}
            {activeTab === 'withdrawals' && <WithdrawalsTab />}
            {activeTab === 'referral' && <ReferralOverviewTab />}
            {activeTab === 'sys-settings' && <SystemSettingsTab />}
            {activeTab === 'tools' && <ToolsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
