/**
 * UserMenu — User profile dropdown with sign-out option
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, Sparkles, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function UserMenu({ onSettingsClick }) {
  const { currentUser, logout, dbUser, isShopifyDeveloper } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const displayName = currentUser.displayName
    ? currentUser.displayName.split(' ')[0]
    : (currentUser.email ? currentUser.email.split('@')[0] : 'User');

  const fullEmail = currentUser.email || 'No email';

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const itemClass =
    'w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors text-left font-medium';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={fullEmail}
      >
        {currentUser?.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={displayName}
            className="h-6 w-6 rounded-full object-cover ring-2 ring-outline/40 transition-all hover:ring-primary/40 dark:ring-white/20"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary ring-2 ring-outline/40 transition-all hover:ring-primary/40 dark:ring-white/20">
            {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
          </div>
        )}
        <span className="hidden max-w-[100px] truncate lg:inline">
          {displayName}
        </span>
        <ChevronDown className={`hidden h-3.5 w-3.5 transition-transform lg:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="solid-panel absolute right-0 z-[110] mt-2 w-56 animate-fade-in rounded-2xl py-2">
          <div className="border-b border-outline/10 px-3 py-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Signed in as
            </div>
            <div className="truncate text-sm font-medium text-on-surface" title={fullEmail}>
              {fullEmail}
            </div>
          </div>

          <button
            onClick={() => { setIsOpen(false); onSettingsClick?.(); }}
            className={itemClass}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>

          {(dbUser?.role === 'creator' || dbUser?.role === 'admin') && (
            <Link
              to="/creator/dashboard"
              onClick={() => setIsOpen(false)}
              className={itemClass}
            >
              <Sparkles className="h-4 w-4" />
              Influencer Dashboard
            </Link>
          )}

          {(isShopifyDeveloper || dbUser?.role === 'admin') && (
            <Link
              to="/developer/dashboard"
              onClick={() => setIsOpen(false)}
              className={itemClass}
            >
              <Store className="h-4 w-4" />
              Developer Dashboard
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
