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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  X, Tag, Settings, Bell, Sparkles, Check, AlertCircle,
  ChevronRight, ChevronLeft, Loader2, Copy, Clock, Shield, AlertTriangle, CheckCircle,
  Store, ExternalLink, CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { referralAPI, shopifyAffiliateAPI } from '../../lib/api';

/** Distinct field vs modal panel — mirrors auth / dashboard contrast */
const fieldClass =
  'flex-1 px-4 py-2.5 bg-[#FDFDF8] border border-[#C5BFAE] rounded-lg text-sm text-on-surface ' +
  'placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary ' +
  'transition-all dark:bg-surface-container-low dark:border-outline/30';

const fieldMonoClass = `${fieldClass} font-mono`;

const fieldDisplayClass =
  'flex-1 flex items-center gap-2 px-4 py-2.5 bg-[#FDFDF8] border border-[#C5BFAE] rounded-lg ' +
  'dark:bg-surface-container-low dark:border-outline/30';

const secondaryBtnClass =
  'px-3 py-2.5 rounded-lg border border-[#C5BFAE] bg-white text-sm text-on-surface-variant ' +
  'hover:bg-[#F8F7F2] transition-all flex items-center gap-1.5 ' +
  'dark:border-outline/30 dark:bg-surface-elevated dark:hover:bg-surface-container';

const actionCardClass =
  'w-full flex items-center justify-between px-4 py-3 bg-[#FDFDF8] border border-[#C5BFAE] rounded-lg ' +
  'hover:border-primary/50 hover:bg-primary/5 transition-all text-left ' +
  'dark:bg-surface-container-low dark:border-outline/30';

/** Light: classic amber CTA; dark: landing-style primary / on-primary */
const primaryBtnClass =
  'px-4 py-2.5 rounded-lg bg-[#EB9D2A] text-on-surface text-sm font-semibold ' +
  'hover:bg-[#CD8407] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'active:scale-[0.98] transition-all flex items-center gap-1.5 ' +
  'dark:bg-primary dark:text-on-primary dark:hover:bg-primary/90';

export function SettingsModal({
  isOpen,
  onClose,
  referralCode,
  onUpdateReferralCode = null,
  initialTab = 'referral',
  initialMobilePane = 'menu',
}) {
  const { currentUser, dbUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('referral');
  const [codeInput, setCodeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Referral code verification state
  const [codeVerifyStatus, setCodeVerifyStatus] = useState(null); // null | 'loading' | { valid, type, creator? }
  const codeVerifyRef = useRef(null);

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

  // Shopify Developer Affiliate
  const [devLoading, setDevLoading] = useState(false);
  const [devApplications, setDevApplications] = useState([]);
  const [devCode, setDevCode] = useState(null);
  const [devCodeInput, setDevCodeInput] = useState('');
  const [devCodeSaving, setDevCodeSaving] = useState(false);
  const [devCodeMessage, setDevCodeMessage] = useState(null);

  // Stripe Connect Express payout setup
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutStarting, setPayoutStarting] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);

  // Mobile: 'menu' = tab list, 'detail' = selected tab content (slide navigation)
  const [mobilePane, setMobilePane] = useState('menu');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set from prop immediately as placeholder, then refresh from DB
      setCodeInput(referralCode || 'moodscout');
      setSaveMessage(null);
      setCreatorCodeMessage(null);
      setActiveTab(initialTab || 'referral');
      setMobilePane(initialMobilePane || 'menu');
      document.body.style.overflow = 'hidden';

      // Load fresh referral code from DB so the input is always accurate
      const cookieUserId = localStorage.getItem('moodscout_cookie_uid') || '';
      referralAPI.getSettings(cookieUserId)
        .then(res => {
          const code = res.data?.settings?.referral_code;
          if (code) setCodeInput(code);
        })
        .catch(() => { /* prop fallback already applied above */ });

      // Clear verification state on open
      setCodeVerifyStatus(null);

      setDevCodeMessage(null);

      if (isAuthenticated) {
        loadProfile();
        loadNotifications();
        loadDeveloperData();
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, referralCode, isAuthenticated, initialTab, initialMobilePane]);

  // Debounced referral code verification
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = (codeInput || '').trim();

    // Don't verify if empty, default, or same as currently saved code
    if (!trimmed || trimmed.toLowerCase() === 'moodscout' || trimmed === referralCode) {
      setCodeVerifyStatus(null);
      return;
    }

    setCodeVerifyStatus('loading');
    if (codeVerifyRef.current) clearTimeout(codeVerifyRef.current);
    codeVerifyRef.current = setTimeout(async () => {
      try {
        const res = await referralAPI.verifyCode(trimmed);
        setCodeVerifyStatus(res.data);
      } catch {
        setCodeVerifyStatus(null);
      }
    }, 400);

    return () => {
      if (codeVerifyRef.current) clearTimeout(codeVerifyRef.current);
    };
  }, [codeInput, isOpen, referralCode]);

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

  const loadDeveloperData = useCallback(async () => {
    setDevLoading(true);
    try {
      const res = await shopifyAffiliateAPI.getDashboard();
      const dash = res.data?.dashboard || {};
      setDevApplications(dash.applications || []);
      setDevCode(dash.code || null);
      setDevCodeInput(dash.code?.referral_code || '');
    } catch {
      // Silent — keep the tab usable even if the dashboard API fails
      setDevApplications([]);
      setDevCode(null);
    } finally {
      setDevLoading(false);
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

  const handleSaveDeveloperCode = async () => {
    setDevCodeSaving(true);
    setDevCodeMessage(null);
    try {
      const res = await shopifyAffiliateAPI.setCode(devCodeInput);
      setDevCode(res.data?.code || null);
      setDevCodeMessage({ type: 'success', text: 'Developer referral code saved!' });
      loadDeveloperData();
    } catch (err) {
      setDevCodeMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save' });
    } finally {
      setDevCodeSaving(false);
      setTimeout(() => setDevCodeMessage(null), 5000);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await referralAPI.markNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const loadPayoutStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    setPayoutLoading(true);
    try {
      const res = await referralAPI.getConnectStatus();
      setPayoutStatus(res.data);
    } catch (err) {
      setPayoutMessage({ type: 'error', text: err.response?.data?.error || 'Unable to load payout setup status.' });
    } finally {
      setPayoutLoading(false);
    }
  }, [isAuthenticated]);

  const beginPayoutSetup = async () => {
    setPayoutStarting(true);
    setPayoutMessage(null);
    try {
      const returnPath = window.location.pathname;
      const res = await referralAPI.initiateConnectOnboarding(returnPath);
      window.location.assign(res.data.url);
    } catch (err) {
      setPayoutMessage({ type: 'error', text: err.response?.data?.error || 'Unable to start bank payout setup.' });
      setPayoutStarting(false);
    }
  };

  const managePayoutMethod = async () => {
    setPayoutStarting(true);
    setPayoutMessage(null);
    try {
      const res = await referralAPI.openConnectPayoutManagement();
      window.location.assign(res.data.url);
    } catch (err) {
      setPayoutMessage({ type: 'error', text: err.response?.data?.error || 'Unable to open Stripe payout settings.' });
      setPayoutStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'payment') loadPayoutStatus();
  }, [isOpen, activeTab, loadPayoutStatus]);

  if (!isOpen) return null;

  const isCreator = profile?.role === 'creator';
  const hasPendingApplication = applications.some(a => a.status === 'pending');

  const isDeveloperApproved = devApplications.some(a => a.status === 'approved');
  const hasPendingDevApplication = devApplications.some(a => a.status === 'pending');

  const tabs = [
    { id: 'referral', label: 'Referral Code', icon: <Tag className="w-4 h-4" /> },
    ...(isAuthenticated ? [
      { id: 'creator', label: 'Influencer Program', icon: <Sparkles className="w-4 h-4" /> },
      { id: 'developer', label: 'Developer Affiliate', icon: <Store className="w-4 h-4" /> },
      { id: 'payment', label: 'Payment Method', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: <Bell className="w-4 h-4" /> },
    ] : []),
  ];

  const activeTabMeta = tabs.find((t) => t.id === activeTab);
  const handleEscape = () => {
    if (mobilePane === 'detail') {
      setMobilePane('menu');
      return;
    }
    onClose();
  };

  const openMobileTab = (tabId) => {
    setActiveTab(tabId);
    setMobilePane('detail');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && handleEscape()}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#D4CFC0] bg-white shadow-2xl animate-[fadeInScale_0.2s_ease-out] dark:border-outline/25 dark:bg-surface-elevated md:max-w-3xl md:flex-row md:items-stretch">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-[#D4CFC0] bg-[#F8F7F2] dark:border-outline/20 dark:bg-surface-container-low/60 md:flex">
          <div className="flex items-center gap-3 border-b border-[#D4CFC0] px-4 py-4 dark:border-outline/20">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Settings className="h-4 w-4 text-on-primary" />
            </div>
            <h3 className="text-base font-bold text-on-surface">Settings</h3>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={onClose}
            className="m-2 rounded-xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            Close
          </button>
        </aside>

        {/* Main column (mobile header + sliding panes / desktop content) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b border-[#D4CFC0] bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 dark:border-outline/20 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              {mobilePane === 'detail' ? (
                <button
                  type="button"
                  onClick={() => setMobilePane('menu')}
                  className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
                  aria-label="Back to settings menu"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Settings className="h-4 w-4 text-on-primary" />
                </div>
              )}
              <h3 className="truncate text-base font-bold text-on-surface">
                {mobilePane === 'detail' ? (activeTabMeta?.label || 'Settings') : 'Settings'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop content header */}
          <div className="hidden items-center justify-between border-b border-[#D4CFC0] px-5 py-4 dark:border-outline/20 md:flex">
            <h3 className="text-base font-bold text-on-surface">
              {activeTabMeta?.label || 'Settings'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sliding area — absolute panes on mobile so list ↔ detail can slide */}
          <div className="relative min-h-[min(60vh,28rem)] flex-1 overflow-hidden md:min-h-0">
            {/* Mobile menu list */}
            <div
              className={[
                'absolute inset-0 overflow-y-auto bg-white p-3 transition-transform duration-300 ease-out dark:bg-surface-elevated md:hidden',
                mobilePane === 'menu' ? 'translate-x-0' : '-translate-x-full',
              ].join(' ')}
            >
              <p className="mb-3 px-2 text-sm text-on-surface-variant">
                Choose a settings category
              </p>
              <div className="flex flex-col gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => openMobileTab(tab.id)}
                    className="flex items-center gap-3 rounded-xl border border-[#C5BFAE] bg-[#FDFDF8] px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-outline/30 dark:bg-surface-container-low"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {tab.icon}
                    </span>
                    <span className="flex-1 text-sm font-medium text-on-surface">{tab.label}</span>
                    <ChevronRight className="h-4 w-4 text-on-surface-variant" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div
              className={[
                'absolute inset-0 overflow-y-auto bg-white p-5 transition-transform duration-300 ease-out dark:bg-surface-elevated',
                'md:static md:h-full md:translate-x-0',
                mobilePane === 'detail' ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
              ].join(' ')}
            >
          {/* ─── Referral Code Tab ─── */}
          {activeTab === 'referral' && (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Your referral code is used when you click on products.
                It supports an influencer every time you shop on eBay through MoodScout.
              </p>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-on-surface">Active Referral Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="moodscout"
                    maxLength={256}
                    className={fieldClass}
                  />
                  <button
                    onClick={handleSaveReferralCode}
                    disabled={saving || codeInput === referralCode}
                    className={primaryBtnClass}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
                  </button>
                </div>
                <p className="text-[11px] text-on-surface-variant/70">
                  Default: <span className="font-mono text-on-surface-variant">moodscout</span>
                </p>

                {/* Referral code validation feedback */}
                {codeVerifyStatus === 'loading' && (
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Checking referral code…
                  </div>
                )}
                {codeVerifyStatus && codeVerifyStatus !== 'loading' && codeVerifyStatus.valid && codeVerifyStatus.type === 'creator' && (
                  <div className="flex items-center gap-1.5 text-xs text-success-green">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Supporting <span className="font-semibold">{codeVerifyStatus.creator}</span>
                  </div>
                )}
                {codeVerifyStatus && codeVerifyStatus !== 'loading' && !codeVerifyStatus.valid && (
                  <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      This referral code does not belong to any active influencer.
                      You won't be supporting any creator with this code.
                    </span>
                  </div>
                )}
              </div>

              {saveMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  saveMessage.type === 'success' ? 'bg-success-green/10 text-success-green border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40' : 'bg-red-50 text-red-700'
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
                    <h4 className="font-semibold text-on-surface mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#EB9D2A]" /> Become an Influencer
                    </h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
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
                      className={actionCardClass}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-[#EB9D2A]" />
                        <div>
                          <div className="text-sm font-medium text-on-surface">Apply for Influencer Program</div>
                          <div className="text-xs text-on-surface-variant">Get your own referral code & earn commission</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                    </button>
                  )}

                  {/* Previous applications */}
                  {applications.filter(a => a.status !== 'pending').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Previous Applications</h4>
                      {applications.filter(a => a.status !== 'pending').map(app => (
                        <div key={app.id} className={`p-3 rounded-lg text-sm border ${
                          app.status === 'approved' ? 'bg-success-green/10 border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40 text-success-green'
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

          {/* ─── Developer Affiliate Tab ─── */}
          {activeTab === 'developer' && (
            <div className="space-y-4">
              {devLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#EB9D2A]" />
                </div>
              ) : isDeveloperApproved ? (
                /* ── Approved developer affiliate ── */
                <DeveloperCodeSection
                  devCode={devCode}
                  devCodeInput={devCodeInput}
                  setDevCodeInput={setDevCodeInput}
                  onSave={handleSaveDeveloperCode}
                  saving={devCodeSaving}
                  message={devCodeMessage}
                  onClose={onClose}
                />
              ) : (
                /* ── Not an approved developer affiliate yet ── */
                <div className="space-y-4">
                  <div className="p-4 bg-[#EB9D2A]/5 rounded-xl border border-[#EB9D2A]/20">
                    <h4 className="font-semibold text-on-surface mb-1 flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#EB9D2A]" /> Become a Developer Affiliate
                    </h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Refer Shopify merchants to the MoodScout app and earn recurring commission on
                      their subscriptions. This is separate from the eBay influencer program.
                    </p>
                  </div>

                  {hasPendingDevApplication ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                      <Clock className="w-4 h-4" />
                      Your developer affiliate application is under review. We'll notify you when it's processed.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('open-developer-application'));
                      }}
                      className={actionCardClass}
                    >
                      <div className="flex items-center gap-3">
                        <Store className="w-5 h-5 text-[#EB9D2A]" />
                        <div>
                          <div className="text-sm font-medium text-on-surface">Apply for Developer Affiliate Program</div>
                          <div className="text-xs text-on-surface-variant">Get a Shopify referral code & earn recurring commission</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                    </button>
                  )}

                  {/* Previous applications */}
                  {devApplications.filter(a => a.status !== 'pending').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Previous Applications</h4>
                      {devApplications.filter(a => a.status !== 'pending').map(app => (
                        <div key={app.id} className={`p-3 rounded-lg text-sm border ${
                          app.status === 'approved' ? 'bg-success-green/10 border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40 text-success-green'
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

          {/* ─── Payment Method Tab ─── */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <h4 className="font-semibold text-on-surface flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Bank payout method</h4>
                <p className="mt-1 text-sm text-on-surface-variant">Use Stripe Express to securely add or manage the eligible bank account where your payouts are sent. MoodScout never receives your bank details.</p>
              </div>
              {payoutLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : (
                <div className={`flex gap-2 p-3 rounded-lg text-sm ${payoutStatus?.connected && payoutStatus?.payouts_enabled ? 'bg-success-green/10 text-success-green border border-success-green/30' : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40'}`}>
                  {payoutStatus?.connected && payoutStatus?.payouts_enabled ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{payoutStatus?.connected && payoutStatus?.payouts_enabled ? 'Your payout method is verified and ready.' : payoutStatus?.connected ? 'Your Stripe setup is incomplete. Continue onboarding to enable payouts.' : 'No payout method has been set up yet.'}</span>
                </div>
              )}
              {payoutMessage && <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${payoutMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-success-green/10 text-success-green'}`}><AlertCircle className="w-4 h-4" />{payoutMessage.text}</div>}
              <div className="flex flex-wrap gap-2">
                <button onClick={beginPayoutSetup} disabled={payoutStarting} className={primaryBtnClass}>
                  {payoutStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {payoutStatus?.connected ? 'Continue / manage setup' : 'Set up bank payout'}
                </button>
                {payoutStatus?.connected && <button onClick={managePayoutMethod} disabled={payoutStarting} className={secondaryBtnClass}>Manage bank account</button>}
                <button onClick={loadPayoutStatus} disabled={payoutLoading} className={secondaryBtnClass}><Loader2 className={`w-4 h-4 ${payoutLoading ? 'animate-spin' : ''}`} />Refresh status</button>
              </div>
              <p className="text-xs text-on-surface-variant">In Stripe test mode, use Stripe’s test onboarding details and test bank account options. No real payout is made.</p>
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
                  <Bell className="w-8 h-8 text-outline/40 mx-auto mb-2" />
                  <p className="text-sm text-on-surface-variant">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg border text-sm ${
                        n.is_read
                          ? 'bg-[#FDFDF8] border-[#C5BFAE] dark:bg-surface-container-low dark:border-outline/30'
                          : 'bg-[#EB9D2A]/5 border-[#EB9D2A]/30 dark:border-[#EB9D2A]/40'
                      }`}
                    >
                      <div className="font-medium text-on-surface">{n.title}</div>
                      <div className="text-on-surface-variant mt-0.5">{n.message}</div>
                      <div className="text-xs text-on-surface-variant/70 mt-1">
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
      <div className="flex items-center gap-2 p-3 bg-success-green/10 rounded-lg border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40">
        <Shield className="w-5 h-5 text-success-green" />
        <div>
          <div className="text-sm font-medium text-success-green">Influencer Account</div>
          <div className="text-xs text-success-green">You can create and manage your own referral code</div>
        </div>
      </div>

      {creatorCode ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface">Your Referral Code</label>
            <div className="flex gap-2">
              <div className={fieldDisplayClass}>
                <Tag className="w-4 h-4 text-[#EB9D2A]" />
                <span className="text-sm font-mono font-semibold text-on-surface">{creatorCode.referral_code}</span>
              </div>
              <button
                onClick={handleCopy}
                className={secondaryBtnClass}
              >
                {copied ? <Check className="w-4 h-4 text-success-green" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Change code (with cooldown) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface">Change Referral Code</label>
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
                  className={fieldMonoClass}
                />
                <button
                  onClick={onSave}
                  disabled={saving || !creatorCodeInput || creatorCodeInput === creatorCode?.referral_code}
                  className={primaryBtnClass}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
              </div>
            )}
            <p className="text-[11px] text-on-surface-variant/70">
              Only lowercase letters, numbers, hyphens, and underscores. 3-50 characters.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Create your unique referral code. Other users can use this code when shopping to support you!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={creatorCodeInput}
              onChange={(e) => setCreatorCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="my-unique-code"
              maxLength={50}
              className={fieldMonoClass}
            />
            <button
              onClick={onSave}
              disabled={saving || !creatorCodeInput}
              className={primaryBtnClass}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant/70">
            Only lowercase letters, numbers, hyphens, and underscores. 3-50 characters.
          </p>
        </div>
      )}

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-success-green/10 text-success-green border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}

/**
 * Developer Code Section — shown when user is an approved Shopify developer affiliate
 */
function DeveloperCodeSection({ devCode, devCodeInput, setDevCodeInput, onSave, saving, message, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(devCode?.referral_code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-success-green/10 rounded-lg border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40">
        <Shield className="w-5 h-5 text-success-green" />
        <div>
          <div className="text-sm font-medium text-success-green">Developer Affiliate Account</div>
          <div className="text-xs text-success-green">Manage your Shopify subscription referral code</div>
        </div>
      </div>

      {devCode?.referral_code ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface">Your Developer Referral Code</label>
            <div className="flex gap-2">
              <div className={fieldDisplayClass}>
                <Store className="w-4 h-4 text-[#EB9D2A]" />
                <span className="text-sm font-mono font-semibold text-on-surface">{devCode.referral_code}</span>
              </div>
              <button
                onClick={handleCopy}
                className={secondaryBtnClass}
              >
                {copied ? <Check className="w-4 h-4 text-success-green" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface">Change Referral Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={devCodeInput}
                onChange={(e) => setDevCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="my-code"
                maxLength={50}
                className={fieldMonoClass}
              />
              <button
                onClick={onSave}
                disabled={saving || !devCodeInput || devCodeInput === devCode?.referral_code}
                className={primaryBtnClass}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant/70">
              Only lowercase letters, numbers, hyphens, and underscores. 3-50 characters.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-on-surface-variant">
            Create your unique Shopify developer referral code. Merchants can enter this code before
            upgrading in the MoodScout Shopify app to credit you.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={devCodeInput}
              onChange={(e) => setDevCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="my-unique-code"
              maxLength={50}
              className={fieldMonoClass}
            />
            <button
              onClick={onSave}
              disabled={saving || !devCodeInput}
              className={primaryBtnClass}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create
            </button>
          </div>
          <p className="text-[11px] text-on-surface-variant/70">
            Only lowercase letters, numbers, hyphens, and underscores. 3-50 characters.
          </p>
        </div>
      )}

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-success-green/10 text-success-green border border-success-green/30 dark:bg-success-green/20 dark:border-success-green/40' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <Link
        to="/developer/dashboard"
        onClick={() => onClose?.()}
        className={actionCardClass}
      >
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-[#EB9D2A]" />
          <div>
            <div className="text-sm font-medium text-on-surface">Open Developer Dashboard</div>
            <div className="text-xs text-on-surface-variant">View attributed shops, commission & analytics</div>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-on-surface-variant" />
      </Link>
    </div>
  );
}

export default SettingsModal;
