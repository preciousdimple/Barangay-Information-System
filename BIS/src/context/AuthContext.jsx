import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase.js';
import { ensureAccountProfile, friendlyAuthError, registrationGate } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Wait for an in-progress sign-up to finish saving the name/profile.
        if (registrationGate.promise) await registrationGate.promise;

        const data = await ensureAccountProfile(firebaseUser);
        if (cancelled) return;

        if (data.status !== 'Active') {
          await signOut(auth);
          setAuthError('Your account is inactive. Please contact the Super Admin.');
          setUser(null); setProfile(null);
        } else if (!['admin', 'superadmin'].includes(data.role)) {
          await signOut(auth);
          setAuthError('Your account has an invalid role. Please contact the Super Admin.');
          setUser(null); setProfile(null);
        } else {
          setAuthError('');
          setUser(firebaseUser);
          setProfile(data);
        }
      } catch (error) {
        console.error('Unable to load account profile:', error);
        await signOut(auth).catch(() => {});
        if (!cancelled) {
          setAuthError(friendlyAuthError(error));
          setUser(null); setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const clearAuthError = useCallback(() => setAuthError(''), []);
  const value = useMemo(
    () => ({ user, profile, loading, authError, clearAuthError }),
    [user, profile, loading, authError, clearAuthError]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
