import React, { useEffect, useState } from 'react';
import { adminLogin } from '../api/apiClient';
import { saveAdminSession } from './auth';
import '../styles/admin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Admin Sign In | Islamic Questionnaire';
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const data = await adminLogin({ email: trimmedEmail, password });
      const resolvedEmail = data.admin?.email || trimmedEmail;
      saveAdminSession(data.token, resolvedEmail);
      setPassword('');
      if (onLoginSuccess) {
        onLoginSuccess(data.token);
      }
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-label="Administrator Sign In">
        <div className="admin-accent-line" aria-hidden="true" />
        <p className="admin-eyebrow">ADMINISTRATION CONSOLE</p>
        <h1 className="admin-login-title">Admin Sign In</h1>
        <p className="admin-login-subtitle">
          Sign in with your administrator credentials to view and export questionnaire responses.
        </p>

        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          <div className="admin-field">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <p className="admin-error-banner" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="admin-btn-primary admin-btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In Securely'}
          </button>
        </form>

        <p className="admin-login-footnote">Authorized administrators only</p>
      </section>
    </main>
  );
};

export default AdminLogin;
