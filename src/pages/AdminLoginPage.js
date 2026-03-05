/**
 * AdminLoginPage — /dev route
 * Separate credential-based login for admin (NOT Firebase).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Shield } from 'lucide-react';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/admin/verify`, {
        headers: { Authorization: `Admin ${token}` }
      })
        .then(res => { if (res.ok) navigate('/dev/dashboard'); else localStorage.removeItem('admin_token'); })
        .catch(() => localStorage.removeItem('admin_token'));
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try actual login
      const loginRes = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/admin/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );
      const data = await loginRes.json();

      if (!loginRes.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }

      localStorage.setItem('admin_token', data.token);
      navigate('/dev/dashboard');
    } catch (err) {
      setError('Login failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D1F20] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#EB9D2A]/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-[#EB9D2A]" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-400 mt-1 text-sm">MoodScout Developer Panel</p>
        </div>

        <div className="bg-[#2A2C2E] border border-[#3A3C3E] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1D1F20] border border-[#3A3C3E] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1D1F20] border border-[#3A3C3E] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A] transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#EB9D2A] text-[#1D1F20] font-semibold rounded-xl
                         hover:bg-[#CD8407] hover:shadow-md active:scale-[0.98]
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
