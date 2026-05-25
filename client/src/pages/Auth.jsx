import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, Activity, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requireVerification, setRequireVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (requireVerification) {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: email.toLowerCase(), code: verificationCode })
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Verification failed.');
        }

        setSuccess('Verification successful! Logging you in...');
        localStorage.setItem('pulse_token', data.token);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      if (isLogin) {
        // Run API request directly so we can catch verification status
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: email.toLowerCase(), password })
        });
        const data = await response.json();

        if (!response.ok) {
          if (data.requireVerification) {
            setRequireVerification(true);
            setEmail(data.email);
            throw new Error(data.message);
          }
          throw new Error(data.message || 'Login failed.');
        }

        setSuccess('Logged in successfully! Redirecting...');
        localStorage.setItem('pulse_token', data.token);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }

        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/~`;]/.test(password);
        if (password.length < 8 || !hasNumber || !hasSpecial) {
          throw new Error('Password must be at least 8 characters long and contain at least one number and one special character.');
        }
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email: email.toLowerCase(), password })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed.');
        }

        if (data.requireVerification) {
          setRequireVerification(true);
          setEmail(data.email);
          setSuccess(data.message);
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setRequireVerification(false);
    setError('');
    setSuccess('');
    setName('');
    setEmail('');
    setPassword('');
    setVerificationCode('');
  };

  return (
    <div className="auth-container">
      {/* Background glowing blobs */}
      <div className="glow-blob blob-1"></div>
      <div className="glow-blob blob-2"></div>
      <div className="glow-blob blob-3"></div>

      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="logo-area">
            <div className="logo-icon-wrapper">
              <Activity className="logo-icon" size={24} />
            </div>
            <span className="logo-text text-gradient">PULSE</span>
          </div>
          <h1>{requireVerification ? 'Verify Email' : isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="auth-subtitle">
            {requireVerification 
              ? 'please verify your account by writing the code to signing up successfully '
              : isLogin 
                ? 'Connect with your team using the next-gen workspace.' 
                : 'Join Pulse and collaborate with high fidelity sound and style.'}
          </p>
        </div>

        {error && (
          <div className="auth-alert error">
            <span className="alert-message">{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success">
            <ShieldCheck size={18} />
            <span className="alert-message">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {requireVerification ? (
            <div className="input-group">
              <label htmlFor="verificationCode">6-Digit Verification Code</label>
              <div className="input-wrapper">
                <ShieldCheck className="input-icon" size={18} />
                <input
                  type="text"
                  id="verificationCode"
                  className="input-field-custom"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>
          ) : (
            <>
              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      id="name"
                      className="input-field-custom"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Work Email</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    id="email"
                    className="input-field-custom"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="label-row">
                  <label htmlFor="password">Password</label>
                  {isLogin && <a href="#" className="forgot-link">Forgot?</a>}
                </div>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="input-field-custom"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <button 
                    type="button" 
                    className="eye-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="glow-btn submit-btn" 
            disabled={submitting}
          >
            {submitting ? (
              <span className="loader"></span>
            ) : (
              <>
                <span>{requireVerification ? 'Verify Account' : isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {requireVerification ? (
              <button type="button" className="toggle-mode-btn" onClick={toggleAuthMode}>
                Back to Sign in
              </button>
            ) : (
              <>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button type="button" className="toggle-mode-btn" onClick={toggleAuthMode}>
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </>
            )}
          </p>
        </div>

        {/* PWA Download Section */}
        <div className="pwa-download-section" style={{
          marginTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button 
            type="button" 
            onClick={handleInstallClick} 
            className="pwa-download-btn"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              width: '100%',
              justifyContent: 'center'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>📥 Download & Install Pulse App</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin);
              alert('Install Link copied to clipboard! Share it with your friends to install the app.');
            }}
            className="pwa-share-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
          >
            🔗 Copy App Install Link to Share
          </button>
        </div>
      </div>

      {/* Decorative styling specifically for this page */}
      <style>{`
        .auth-container {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: transparent;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* Ambient Glowing Blobs */
        .glow-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          z-index: 0;
          pointer-events: none;
        }

        .blob-1 {
          width: 400px;
          height: 400px;
          background: var(--accent-primary);
          top: -100px;
          left: -100px;
          animation: glowPulse 8s infinite alternate;
        }

        .blob-2 {
          width: 500px;
          height: 500px;
          background: var(--accent-pink);
          bottom: -150px;
          right: -100px;
          animation: glowPulse 10s infinite alternate-reverse;
        }

        .blob-3 {
          width: 300px;
          height: 300px;
          background: var(--accent-secondary);
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(140px);
          opacity: 0.1;
        }

        .auth-card {
          width: 100%;
          max-width: 460px;
          padding: 40px;
          border-radius: var(--radius-lg);
          z-index: 10;
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 30px;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .logo-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--accent-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
        }

        .logo-icon {
          stroke-width: 2.5;
        }

        .logo-text {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .auth-header h1 {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .auth-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .auth-alert {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13.5px;
          font-weight: 500;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideUp 0.3s ease;
        }

        .auth-alert.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .auth-alert.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #a7f3d0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-link {
          font-size: 12.5px;
          color: var(--accent-primary);
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-link:hover {
          color: var(--accent-secondary);
          text-decoration: underline;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .input-field-custom {
          width: 100%;
          background: rgba(10, 11, 16, 0.4);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 13px 14px 13px 44px;
          font-size: 14px;
          font-family: var(--font-sans);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .input-field-custom:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          background: rgba(10, 11, 16, 0.7);
        }

        .input-field-custom:focus + .input-icon {
          color: var(--accent-primary);
        }

        .eye-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .eye-btn:hover {
          color: var(--text-secondary);
        }

        .submit-btn {
          margin-top: 6px;
          width: 100%;
          padding: 13px;
          border-radius: var(--radius-sm);
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 13.5px;
          color: var(--text-secondary);
        }

        .toggle-mode-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          font-weight: 600;
          cursor: pointer;
          font-size: 13.5px;
        }

        .toggle-mode-btn:hover {
          color: var(--accent-secondary);
          text-decoration: underline;
        }

        /* Spinner/Loader */
        .loader {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {showInstallGuide && (
        <div 
          className="install-guide-overlay" 
          onClick={() => setShowInstallGuide(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div 
            className="install-guide-card" 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d0e12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              color: 'white',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#818cf8', fontFamily: 'inherit' }}>How to Install Pulse</h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6', marginBottom: '20px' }}>
              To download and install the Pulse app on your device:
            </p>

            <div style={{ textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', fontSize: '12.5px' }}>
                <span style={{ color: '#818cf8', fontWeight: 'bold', minWidth: '80px' }}>📱 iOS Safari</span>
                <span style={{ color: '#d1d5db' }}>Tap the <strong>Share</strong> button (box with up arrow) at the bottom, then scroll and select <strong>"Add to Home Screen"</strong>.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '12.5px' }}>
                <span style={{ color: '#818cf8', fontWeight: 'bold', minWidth: '80px' }}>🤖 Android</span>
                <span style={{ color: '#d1d5db' }}>Tap the <strong>three dots</strong> in top-right, then select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '12.5px' }}>
                <span style={{ color: '#818cf8', fontWeight: 'bold', minWidth: '80px' }}>💻 Desktop</span>
                <span style={{ color: '#d1d5db' }}>Click the <strong>Install</strong> monitor icon on the right side of the address bar.</span>
              </div>
            </div>

            <button 
              onClick={() => setShowInstallGuide(false)}
              style={{
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px',
                width: '100%',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
