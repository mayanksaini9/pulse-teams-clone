import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  Smartphone, 
  Laptop, 
  Check, 
  Copy, 
  Activity, 
  ArrowUpRight, 
  QrCode, 
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export const InstallPage = ({ deferredPrompt, setDeferredPrompt }) => {
  const [copied, setCopied] = useState(false);
  const [os, setOs] = useState('unknown');
  const [browser, setBrowser] = useState('unknown');
  const [installStatus, setInstallStatus] = useState('idle'); // idle, prompting, installed, error
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.origin);
    
    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      setOs('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setOs('ios');
    } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
      setOs('mac');
    } else if (/Windows/i.test(userAgent)) {
      setOs('windows');
    } else {
      setOs('desktop');
    }

    // Detect Browser
    if (userAgent.indexOf("Chrome") > -1) {
      setBrowser('chrome');
    } else if (userAgent.indexOf("Safari") > -1) {
      setBrowser('safari');
    } else if (userAgent.indexOf("Firefox") > -1) {
      setBrowser('firefox');
    } else if (userAgent.indexOf("MSIE") > -1 || !!document.documentMode === true) {
      setBrowser('ie');
    } else {
      setBrowser('other');
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      // If we don't have the prompt, check if we're already standalone
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        alert('Pulse is already installed and running as an app!');
      } else {
        alert('To install, open your browser options/menu (three dots or share button) and select "Add to Home Screen" or "Install App".');
      }
      return;
    }

    try {
      setInstallStatus('prompting');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to PWA prompt: ${outcome}`);
      if (outcome === 'accepted') {
        setInstallStatus('installed');
        // Notify backend
        fetch('/api/stats/pwa-install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error(err));
      } else {
        setInstallStatus('idle');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error triggering PWA install:', err);
      setInstallStatus('error');
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=255-255-255&bgcolor=13-14-18&data=${encodeURIComponent(currentUrl)}`;

  const renderInstructions = () => {
    if (os === 'ios') {
      return (
        <div className="instructions-card glass-panel animate-fade-in">
          <h3><Smartphone size={18} /> Safari on iOS (iPhone / iPad)</h3>
          <ol className="instructions-list">
            <li>
              Tap the <strong>Share</strong> button <span className="share-icon-placeholder">⎋</span> (at the bottom or top of Safari).
            </li>
            <li>
              Scroll down and tap <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Confirm by tapping <strong>Add</strong> in the top-right corner.
            </li>
          </ol>
          <div className="ios-badge">
            <span>Runs in full-screen, native mode once added!</span>
          </div>
        </div>
      );
    }

    if (os === 'android') {
      return (
        <div className="instructions-card glass-panel animate-fade-in">
          <h3><Smartphone size={18} /> Android Device</h3>
          {deferredPrompt ? (
            <p>You can install Pulse directly by tapping the main button above. If it doesn't open:</p>
          ) : null}
          <ol className="instructions-list">
            <li>Tap the browser's <strong>Menu</strong> button (three vertical dots in the top-right).</li>
            <li>Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</li>
            <li>Confirm the prompt to complete the installation.</li>
          </ol>
        </div>
      );
    }

    // Default desktop instructions
    return (
      <div className="instructions-card glass-panel animate-fade-in">
        <h3><Laptop size={18} /> Desktop (Chrome, Edge, Opera)</h3>
        {deferredPrompt ? (
          <p>Click the <strong>Install Pulse</strong> button above to install directly onto your taskbar or applications list.</p>
        ) : (
          <ol className="instructions-list">
            <li>Look at your browser's address bar (URL bar).</li>
            <li>Click the <strong>Install</strong> icon <span className="install-icon-placeholder">⊕</span> (usually next to the bookmark star).</li>
            <li>Or open the browser menu (three dots/lines) and click <strong>Save and share → Install Pulse</strong>.</li>
          </ol>
        )}
      </div>
    );
  };

  return (
    <div className="install-page-container">
      <div className="install-header">
        <a href="/" className="back-link">
          <Activity className="back-icon" size={18} />
          <span>Pulse</span>
        </a>
      </div>

      <div className="install-content-wrapper">
        <div className="install-main-card glass-panel animate-scale-up">
          <div className="brand-badge animate-pulse-glow">
            <Activity size={28} />
          </div>
          
          <h1 className="brand-title">Install Pulse Teams</h1>
          <p className="brand-subtitle">
            Get the full-featured desktop and mobile application container. Stay connected in real-time with your team.
          </p>

          <div className="action-buttons-group">
            <button 
              className={`btn-install-primary ${installStatus === 'prompting' ? 'loading' : ''}`}
              onClick={triggerInstall}
              disabled={installStatus === 'prompting'}
            >
              {installStatus === 'prompting' ? (
                <span>Launching Installer...</span>
              ) : (
                <>
                  <Download size={18} />
                  <span>Install App Now</span>
                </>
              )}
            </button>

            <button className="btn-share-secondary" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check size={18} className="success-icon" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  <span>Copy Share Link</span>
                </>
              )}
            </button>
          </div>

          <div className="divider-line">
            <span>Installation Guide</span>
          </div>

          {renderInstructions()}

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🚀</div>
              <h4>Instant Load</h4>
              <p>Launches instantly from your dock or home screen without loading browser overhead.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔔</div>
              <h4>Realtime Alerts</h4>
              <p>Receive immediate push updates for messages, calls, and mentions.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🌐</div>
              <h4>Always Syncing</h4>
              <p>Keep your conversations and attachments offline for instant reading.</p>
            </div>
          </div>
        </div>

        <div className="install-sidebar-card glass-panel animate-slide-up">
          <h3>Scan to Install</h3>
          <p>Scan this QR code with your mobile camera to open and install the app instantly on your phone.</p>
          
          <div className="qr-container">
            <img src={qrCodeUrl} alt="Pulse QR Code" className="qr-image" />
            <div className="qr-scanner-line"></div>
          </div>

          <div className="quick-info">
            <HelpCircle size={16} />
            <span>Compatible with Android, iOS, Windows & macOS</span>
          </div>
        </div>
      </div>

      <style>{`
        .install-page-container {
          min-height: 100vh;
          width: 100vw;
          background: #08090d;
          color: #f8fafc;
          font-family: 'Outfit', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          box-sizing: border-box;
          overflow-x: hidden;
          position: relative;
        }

        .install-header {
          width: 100%;
          max-width: 1100px;
          display: flex;
          justify-content: flex-start;
          margin-bottom: 24px;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #94a3b8;
          font-weight: 600;
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .back-link:hover {
          color: #6366f1;
        }

        .back-icon {
          color: #6366f1;
        }

        .install-content-wrapper {
          display: flex;
          gap: 24px;
          width: 100%;
          max-width: 1100px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .install-main-card {
          flex: 2;
          min-width: 320px;
          padding: 40px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-sizing: border-box;
        }

        .install-sidebar-card {
          flex: 1;
          min-width: 280px;
          padding: 32px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-sizing: border-box;
        }

        .glass-panel {
          background: rgba(13, 14, 18, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }

        .brand-badge {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
        }

        .brand-badge svg {
          color: white;
          stroke-width: 2.5px;
        }

        .brand-title {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
          background: linear-gradient(to right, #ffffff, #cbd5e1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-subtitle {
          font-size: 16px;
          color: #94a3b8;
          max-width: 500px;
          margin: 0 0 32px 0;
          line-height: 1.6;
        }

        .action-buttons-group {
          display: flex;
          gap: 16px;
          width: 100%;
          max-width: 480px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .btn-install-primary {
          flex: 1;
          min-width: 180px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-install-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(99, 102, 241, 0.6);
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
        }

        .btn-install-primary:active {
          transform: translateY(0);
        }

        .btn-share-secondary {
          flex: 1;
          min-width: 180px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn-share-secondary:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .success-icon {
          color: #22c55e;
          animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .divider-line {
          width: 100%;
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }

        .divider-line::before,
        .divider-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }

        .divider-line span {
          padding: 0 16px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 0.1em;
        }

        .instructions-card {
          width: 100%;
          text-align: left;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 32px;
          box-sizing: border-box;
        }

        .instructions-card h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .instructions-card h3 svg {
          color: #6366f1;
        }

        .instructions-list {
          margin: 0;
          padding-left: 20px;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.8;
        }

        .instructions-list li {
          margin-bottom: 12px;
        }

        .instructions-list strong {
          color: #e2e8f0;
        }

        .share-icon-placeholder,
        .install-icon-placeholder {
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: system-ui, sans-serif;
          font-size: 13px;
        }

        .ios-badge {
          margin-top: 16px;
          padding: 8px 12px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px dashed rgba(99, 102, 241, 0.25);
          border-radius: 8px;
          text-align: center;
          font-size: 12px;
          color: #a5b4fc;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          width: 100%;
          margin-top: 8px;
        }

        .feature-item {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .feature-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .feature-item h4 {
          margin: 0 0 6px 0;
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }

        .feature-item p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        .install-sidebar-card h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #f1f5f9;
        }

        .install-sidebar-card p {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }

        .qr-container {
          position: relative;
          background: #0d0e12;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .qr-image {
          width: 180px;
          height: 180px;
          display: block;
          border-radius: 8px;
        }

        .qr-scanner-line {
          position: absolute;
          left: 16px;
          right: 16px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #6366f1, transparent);
          box-shadow: 0 0 8px #6366f1;
          animation: scan 3s infinite linear;
        }

        .quick-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #475569;
        }

        @keyframes scan {
          0% { top: 16px; }
          50% { top: calc(100% - 18px); }
          100% { top: 16px; }
        }

        @keyframes scaleIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Micro-animations */
        .animate-scale-up {
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease forwards;
        }

        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-pulse-glow {
          animation: pulseGlow 2.5s infinite alternate;
        }

        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
          }
          100% {
            box-shadow: 0 0 40px rgba(99, 102, 241, 0.7), 0 0 10px rgba(236, 72, 153, 0.4);
          }
        }

        @media (max-width: 768px) {
          .install-content-wrapper {
            flex-direction: column;
          }
          .install-main-card,
          .install-sidebar-card {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
