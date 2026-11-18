import { useState } from 'react';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="login-page">
      <div className="login-card auth-card">
        <div className="login-emblem"><i className="bi bi-shield-check" /></div>
        <p className="eyebrow">BARANGAY MANAGEMENT PORTAL</p>
        <h1>{title}</h1>
        <p className="text-muted mb-4">{subtitle}</p>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
        <small className="text-muted d-block mt-4">Authorized barangay personnel only.</small>
      </div>
    </div>
  );
}

export function PasswordInput({ id, label, value, onChange, autoComplete, placeholder, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-3 text-start">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="input-group">
        <input id={id} className="form-control" type={show ? 'text' : 'password'} value={value}
          onChange={onChange} autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} required />
        <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'} tabIndex={-1}>
          <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
        </button>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick, disabled, label = 'Continue with Google' }) {
  return (
    <button type="button" className="btn btn-google w-100" onClick={onClick} disabled={disabled}>
      <i className="bi bi-google me-2" />{label}
    </button>
  );
}

export function Divider() {
  return <div className="auth-divider"><span>or</span></div>;
}
