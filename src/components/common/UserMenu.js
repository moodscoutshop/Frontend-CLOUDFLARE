/**
 * UserMenu — User profile dropdown with sign-out option
 * 
 * Features:
 * - Shows user name/email in dropdown trigger
 * - Displays "Signed in as: email" in dropdown
 * - Logout button that signs out and redirects
 * - Closes on outside click
 * - Only renders when user is authenticated
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

  // Close dropdown when clicking outside
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

  // Extract display name
  const displayName = currentUser.displayName 
    ? currentUser.displayName.split(' ')[0] 
    : (currentUser.email ? currentUser.email.split('@')[0] : 'User');
  
  const fullEmail = currentUser.email || 'No email';

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-[#3D3F40] hover:text-[#EB9D2A] transition-colors font-medium px-2 py-1 rounded hover:bg-[#EEEFE9]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={fullEmail}
      >
        {currentUser?.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt={displayName} 
            className="w-6 h-6 rounded-full object-cover" 
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#EB9D2A] flex items-center justify-center text-white text-xs font-bold">
            {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}
          </div>
        )}
        <span className="hidden lg:inline max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 hidden lg:block transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#D4CFC0] rounded-lg shadow-lg py-2 z-50 animate-fade-in">
          {/* Signed in as section */}
          <div className="px-3 py-2 border-b border-[#E0DCCE]">
            <div className="text-xs font-semibold text-[#5D5F60] uppercase tracking-wide mb-1">
              Signed in as
            </div>
            <div className="text-sm text-[#3D3F40] font-medium truncate" title={fullEmail}>
              {fullEmail}
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={() => { setIsOpen(false); onSettingsClick?.(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors text-left font-medium"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          {/* Influencer Dashboard (visible to creators/admins only) */}
          {(dbUser?.role === 'creator' || dbUser?.role === 'admin') && (
            <Link
              to="/creator/dashboard"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors text-left font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Influencer Dashboard
            </Link>
          )}

          {/* Developer Affiliate Dashboard (visible to approved developer affiliates) */}
          {(isShopifyDeveloper || dbUser?.role === 'admin') && (
            <Link
              to="/developer/dashboard"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-[#EB9D2A] transition-colors text-left font-medium"
            >
              <Store className="w-4 h-4" />
              Developer Dashboard
            </Link>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#3D3F40] hover:bg-[#EEEFE9] hover:text-red-600 transition-colors text-left font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
