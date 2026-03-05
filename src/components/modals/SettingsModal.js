/**
 * SettingsModal — User settings dialog for referral code & creator features
 * 
 * Opens as a modal overlay so it doesn't disrupt the shopping flow.
 * 
 * Sections:
 * 1. Referral Code — view/change the active referral code
 * 2. Creator Program — apply or manage creator referral code
 * 3. Notifications — view unread notifications
 */
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Tag, Settings, Bell, Sparkles, Check, AlertCircle,
  ChevronRight, Loader2, Copy, Clock, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { referralAPI } from '../../lib/api';

export function SettingsModal({ isOpen, onClose, referralCode, onUpdateReferralCode = null }) {
  const { currentUser, dbUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('referral');
  const [codeInput, setCodeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Profile / role info
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Creator code
  const [creatorCode, setCreatorCode] = useState(null);
  const [cooldownDays, setCooldownDays] = useState(90);
  const [creatorCodeInput, setCreatorCodeInput] = useState('');
  const [creatorCodeSaving, setCreatorCodeSaving] = useState(false);
  const [creatorCodeMessage, setCreatorCodeMessage] = useState(null);

  // Applications
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set from prop immediately as placeholder, then refresh from DB
      setCodeInput(referralCode || 'moodscout');
      setSaveMessage(null);
      setCreatorCodeMessage(null);
      setActiveTab('referral');
      document.body.style.overflow = 'hidden';

      // Load fresh referral code from DB so the input is always accurate
      const cookieUserId = localStorage.getItem('moodscout_cookie_uid') || '';
      referralAPI.getSettings(cookieUserId)
        .then(res => {
          const code = res.data?.settings?.referral_code;
          if (code) setCodeInput(code);
        })
        .catch(() => { /* prop fallback already applied above */ });

      if (isAuthenticated) {
        loadProfile();
        loadNotifications();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, referralCode, isAuthenticated]);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await referralAPI.getProfile();
      setProfile(res.data.user);
      setCreatorCode(res.data.creatorCode);
      if (res.data.cooldownDays) setCooldownDays(res.data.cooldownDays);
      if (res.data.creatorCode) {
        setCreatorCodeInput(res.data.creatorCode.referral_code || '');
      }

      // Load applications
      const appsRes = await referralAPI.getApplications();
      setApplications(appsRes.data.applications || []);
    } catch {
      // Silent
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifsLoading(true);
    try {
      const res = await referralAPI.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {
      // Silent
    } finally {
      setNotifsLoading(false);
    }
  }, []);

  if (!isOpen) return null;

  const handleSaveReferralCode = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      let newCode;
      if (onUpdateReferralCode) {
        newCode = await onUpdateReferralCode(codeInput);
      } else {
        await referralAPI.updateCode(codeInput);
        newCode = codeInput;
      }
      // Notify useReferralCode hook (and any listener) of the change in real-time
      window.dispatchEvent(
        new CustomEvent('moodscout:referral-code-updated', { detail: { code: newCode } })
      );
      setSaveMessage({ type: 'success', text: `Referral code updated to "${newCode}"` });
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save referral code' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSaveCreatorCode = async () => {
    setCreatorCodeSaving(true);
    setCreatorCodeMessage(null);
    try {
      await referralAPI.setCreatorCode(creatorCodeInput);
      setCreatorCodeMessage({ type: 'success', text: 'Influencer referral code saved!' });
      loadProfile();
    } catch (err) {
      setCreatorCodeMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setCreatorCodeSaving(false);
      setTimeout(() => setCreatorCodeMessage(null), 5000);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await referralAPI.markNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const isCreator = profile?.role === 'creator';
  const hasPendingApplication = applications.some(a => a.status === 'pending');

  const tabs = [
    { id: 'referral', label: 'Referral Code', icon: <Tag className="w-4 h-4" /> },
    ...(isAuthenticated ? [
      { id: 'creator', label: 'Influencer Program', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: <Bell className="w-4 h-4" /> },
    ] : []),
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-[#FDFDF8] rounded-2xl shadow-2xl border border-[#D4CFC0] overflow-hidden max-h-[85vh] flex flex-col animate-[fadeInScale_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#EB9D2A]/10 to-[#EB9D2A]/5 border-b border-[#E0DCCE]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#EB9D2A] rounded-lg flex items-center justify-center">
              <Settings className="w-4.5 h-4.5 text-white" />
            </div>
            <h3 className="text-base font-bold text-[#1D1F20]">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#EEEFE9] transition-colors text-[#5D5F60] hover:text-[#1D1F20]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E0DCCE] px-5 gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#EB9D2A] border-[#EB9D2A]'
                  : 'text-[#5D5F60] border-transparent hover:text-[#3D3F40]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ─── Referral Code Tab ─── */}
          {activeTab === 'referral' && (
            <div className="space-y-4">
              <p className="text-sm text-[#3D3F40] leading-relaxed">
                Your referral code is used when you click on products.
                It supports an influencer every time you shop on eBay through MoodScout.
              </p>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#1D1F20]">Active Referral Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="moodscout"
                    maxLength={256}
                    className="flex-1 px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm text-[#1D1F20]
                               placeholder:text-[#A0A2A3]
                               focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                               transition-all"
                  />
                  <button
                    onClick={handleSaveReferralCode}
                    disabled={saving || codeInput === referralCode}
                    className="px-4 py-2.5 rounded-lg bg-[#EB9D2A] text-[#1D1F20] text-sm font-semibold
                               hover:bg-[#CD8407] disabled:opacity-50 disabled:cursor-not-allowed
                               active:scale-[0.98] transition-all flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
                  </button>
                </div>
                <p className="text-[11px] text-[#A0A2A3]">
                  Default: <span className="font-mono text-[#5D5F60]">moodscout</span>
                </p>
              </div>

              {saveMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {saveMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {saveMessage.text}
                </div>
              )}
            </div>
          )}

          {/* ─── Creator Program Tab ─── */}
          {activeTab === 'creator' && (
            <div className="space-y-4">
              {profileLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#EB9D2A]" />
                </div>
              ) : isCreator ? (
                /* ── Creator has been approved ── */
                <CreatorCodeSection
                  creatorCode={creatorCode}
                  cooldownDays={cooldownDays}
                  creatorCodeInput={creatorCodeInput}
                  setCreatorCodeInput={setCreatorCodeInput}
                  onSave={handleSaveCreatorCode}
                  saving={creatorCodeSaving}
                  message={creatorCodeMessage}
                />
              ) : (
                /* ── Not a creator yet ── */
                <div className="space-y-4">
                  <div className="p-4 bg-[#EB9D2A]/5 rounded-xl border border-[#EB9D2A]/20">
                    <h4 className="font-semibold text-[#1D1F20] mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#EB9D2A]" /> Become an Influencer
                    </h4>
                    <p className="text-sm text-[#5D5F60] leading-relaxed">
                      Influencers get their own unique referral code. When users shop with your code, you earn commission on every purchase!
                    </p>
                  </div>

                  {hasPendingApplication ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                      <Clock className="w-4 h-4" />
                      Your application is under review. We'll notify you when it's processed.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        // The CreatorApplicationModal will be opened from the parent
                        window.dispatchEvent(new CustomEvent('open-creator-application'));
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#D4CFC0] rounded-lg
                                 hover:border-[#EB9D2A]/50 hover:bg-[#EB9D2A]/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-[#EB9D2A]" />
                        <div>
                          <div className="text-sm font-medium text-[#1D1F20]">Apply for Influencer Program</div>
                          <div className="text-xs text-[#5D5F60]">Get your own referral code & earn commission</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#5D5F60]" />
                    </button>
                  )}

                  {/* Previous applications */}
                  {applications.filter(a => a.status !== 'pending').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-[#5D5F60] uppercase tracking-wide">Previous Applications</h4>
                      {applications.filter(a => a.status !== 'pending').map(app => (
                        <div key={app.id} className={`p-3 rounded-lg text-sm border ${
                          app.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <div className="font-medium capitalize">{app.status}</div>
                          <div className="text-xs mt-0.5">{new Date(app.reviewed_at || app.created_at).toLocaleDateString()}</div>
                          {app.admin_notes && <div className="text-xs mt-1 opacity-80">{app.admin_notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Notifications Tab ─── */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {unreadCount > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#EB9D2A] hover:text-[#CD8407] font-medium"
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              {notifsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#EB9D2A]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-[#D4CFC0] mx-auto mb-2" />
                  <p className="text-sm text-[#5D5F60]">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg border text-sm ${
                        n.is_read
                          ? 'bg-white border-[#E0DCCE]'
                          : 'bg-[#EB9D2A]/5 border-[#EB9D2A]/20'
                      }`}
                    >
                      <div className="font-medium text-[#1D1F20]">{n.title}</div>
                      <div className="text-[#5D5F60] mt-0.5">{n.message}</div>
                      <div className="text-xs text-[#A0A2A3] mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  , document.body);
}

/**
 * Creator Code Section — shown when user is already a creator
 */
function CreatorCodeSection({ creatorCode, cooldownDays = 90, creatorCodeInput, setCreatorCodeInput, onSave, saving, message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(creatorCode?.referral_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate cooldown using system setting (dynamic from DB)
  let canChange = true;
  let daysRemaining = 0;
  if (creatorCode) {
    const lastChanged = new Date(creatorCode.last_changed_at);
    const now = new Date();
    const daysSince = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24));
    daysRemaining = cooldownDays - daysSince;
    canChange = daysRemaining <= 0;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Shield className="w-5 h-5 text-green-600" />
        <div>
          <div className="text-sm font-medium text-green-700">Influencer Account</div>
          <div className="text-xs text-green-600">You can create and manage your own referral code</div>
        </div>
      </div>

      {creatorCode ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#1D1F20]">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-[#EEEFE9] border border-[#D4CFC0] rounded-lg">
                <Tag className="w-4 h-4 text-[#EB9D2A]" />
                <span className="text-sm font-mono font-semibold text-[#1D1F20]">{creatorCode.referral_code}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-2.5 rounded-lg border border-[#D4CFC0] bg-white text-sm text-[#5D5F60]
                           hover:bg-[#EEEFE9] transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Change code (with cooldown) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#1D1F20]">Change Referral Code</label>
            {!canChange ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                <Clock className="w-4 h-4" />
                You can change your code in {daysRemaining} days
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={creatorCodeInput}
                  onChange={(e) => setCreatorCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="my-code"
                  maxLength={50}
                  className="flex-1 px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm font-mono text-[#1D1F20]
                             placeholder:text-[#A0A2A3]
                             focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                             transition-all"
                />
                <button
                  onClick={onSave}
                  disabled={saving || !creatorCodeInput || creatorCodeInput === creatorCode?.referral_code}
                  className="px-4 py-2.5 rounded-lg bg-[#EB9D2A] text-[#1D1F20] text-sm font-semibold
                             hover:bg-[#CD8407] disabled:opacity-50 disabled:cursor-not-allowed
                             active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
              </div>
            )}
            <p className="text-[11px] text-[#A0A2A3]">
              Only lowercase letters, numbers, hyphens, and underscores. 3-50 characters.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[#3D3F40]">
            Create your unique referral code. Other users can use this code when shopping to support you!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={creatorCodeInput}
              onChange={(e) => setCreatorCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="my-unique-code"
              maxLength={50}
              className="flex-1 px-4 py-2.5 bg-white border border-[#D4CFC0] rounded-lg text-sm font-mono text-[#1D1F20]
                         placeholder:text-[#A0A2A3]
                         focus:outline-none focus:ring-2 focus:ring-[#EB9D2A]/40 focus:border-[#EB9D2A]
                         transition-all"
            />
            <button
              onClick={onSave}
              disabled={saving || !creatorCodeInput}
              className="px-4 py-2.5 rounded-lg bg-[#EB9D2A] text-[#1D1F20] text-sm font-semibold
                         hover:bg-[#CD8407] disabled:opacity-50 disabled:cursor-not-allowed
                         active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create
            </button>
          </div>
          <p className="text-[11px] text-[#A0A2A3]">
            Only lowercase letters, numbers, hyphens, and underscores. 3-50 characters.
          </p>
        </div>
      )}

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}

export default SettingsModal;
