/**
 * AuthContext — Global authentication state
 * 
 * Provides:
 * - currentUser (Firebase user object or null)
 * - dbUser (PostgreSQL user record or null)
 * - loading state
 * - login / signup / logout / googleLogin functions
 * 
 * Wraps Firebase onAuthStateChanged for real-time auth state.
 * Anonymous users (no login) get currentUser = null — app works normally.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user to PostgreSQL after Firebase auth
  const syncUserToDb = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setDbUser(null);
      return;
    }
    try {
      const res = await authAPI.syncUser(firebaseUser.displayName);
      setDbUser(res.data.user);
    } catch (error) {
      console.warn('User sync failed:', error.message);
      // Don't block — user can still use the app
    }
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserToDb(user);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [syncUserToDb]);

  // ─── Auth Functions ─────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  }, []);

  const googleLogin = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
    setDbUser(null);
  }, []);

  const value = {
    currentUser,
    dbUser,
    loading,
    login,
    signup,
    googleLogin,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
