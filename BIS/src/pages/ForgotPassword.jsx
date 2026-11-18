import { useState } from 'react';
import { Link } from 'react-router-dom';
import { friendlyAuthError, sendResetEmail } from '../services/authService.js';
import { AuthShell } from '../components/AuthShell.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await sendResetEmail(email); setSent(true); }
    catch (err) {
      // Don't reveal whether an email is registered.
      if (err?.code === 'auth/user-not-found') setSent(true);
      else setError(friendlyAuthError(err));
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Reset password" subtitle="Enter your email and we'll send you a link to reset your password."
      footer={<Link to="/login"><i className="bi bi-arrow-left me-1" />Back to sign in</Link>}>
      {sent ? (
        <div className="alert alert-success text-start" role="status">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox (and spam folder).
        </div>
      ) : (
        <>
          {error && <div className="alert alert-danger py-2 text-start" role="alert">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3 text-start">
              <label className="form-label" htmlFor="fp-email">Email address</label>
              <input id="fp-email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="name@example.com" required />
            </div>
            <button className="btn btn-primary w-100 py-2" disabled={busy}>
              {busy && <span className="spinner-border spinner-border-sm me-2" />}{busy ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
