import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { friendlyAuthError, signInWithEmail, signInWithGoogle } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell, Divider, GoogleButton, PasswordInput } from '../components/AuthShell.jsx';

export default function Login() {
  const { user, profile, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user && profile) return <Navigate to={profile.role === 'superadmin' ? '/superadmin' : '/admin'} replace />;

  async function run(action) {
    setBusy(true); setError(''); clearAuthError();
    try { await action(); }
    catch (err) { console.error(err); setError(friendlyAuthError(err)); }
    finally { setBusy(false); }
  }

  const handleSubmit = (e) => { e.preventDefault(); run(() => signInWithEmail(email, password)); };
  const shownError = error || authError;

  return (
    <AuthShell title="Sign in" subtitle="Welcome back. Sign in to your account to continue."
      footer={<>Don't have an account? <Link to="/register">Create one</Link></>}>
      {shownError && <div className="alert alert-danger py-2 text-start" role="alert">{shownError}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3 text-start">
          <label className="form-label" htmlFor="email">Email address</label>
          <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" placeholder="name@example.com" required />
        </div>
        <PasswordInput id="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" placeholder="Your password" />
        <div className="text-end mb-3"><Link to="/forgot-password" className="small">Forgot password?</Link></div>
        <button className="btn btn-primary w-100 py-2" disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2" />}{busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <Divider />
      <GoogleButton disabled={busy} onClick={() => run(signInWithGoogle)} />
    </AuthShell>
  );
}
