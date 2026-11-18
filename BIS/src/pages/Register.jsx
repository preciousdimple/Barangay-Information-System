import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell, Divider, GoogleButton, PasswordInput } from '../components/AuthShell.jsx';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      alert('Account created successfully!');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not connect to server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Register to access the Barangay Information System."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
      {error && <div className="alert alert-danger py-2 text-start" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3 text-start">
          <label className="form-label" htmlFor="name">Full name</label>
          <input id="name" className="form-control" value={form.name} onChange={set('name')} autoComplete="name" placeholder="Juan Dela Cruz" required />
        </div>
        <div className="mb-3 text-start">
          <label className="form-label" htmlFor="reg-email">Email address</label>
          <input id="reg-email" type="email" className="form-control" value={form.email} onChange={set('email')} autoComplete="email" placeholder="name@example.com" required />
        </div>
        <PasswordInput id="reg-password" label="Password" value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} />
        <PasswordInput id="reg-confirm" label="Confirm password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" placeholder="Re-enter password" />
        <button className="btn btn-primary w-100 py-2" disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2" />}{busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <Divider />
      <GoogleButton disabled={busy} onClick={() => alert('Google sign-up requires Firebase configuration.')} label="Sign up with Google" />
      <div className="login-note"><i className="bi bi-info-circle me-1" /> New accounts are registered as Admin. A Super Admin can deactivate accounts.</div>
    </AuthShell>
  );
}