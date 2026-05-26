import React, { useEffect, useState } from 'react';
import { MessageSquare, ShieldAlert, Award, Volume2, UserMinus, X, Bell } from 'lucide-react';

export const MobileNotificationBanner = ({ notification, onClose, onAction }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (!notification) return;

    // Auto close after 4.5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [notification]);

  if (!notification) return null;

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 300); // match fadeOut animation duration
  };

  const handleTap = () => {
    if (onAction) {
      onAction(notification);
    }
    handleClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageSquare className="notif-icon-svg msg" size={20} />;
      case 'promote':
        return <Award className="notif-icon-svg promote" size={20} />;
      case 'demote':
        return <ShieldAlert className="notif-icon-svg demote" size={20} />;
      case 'team_removed':
        return <UserMinus className="notif-icon-svg kick" size={20} />;
      case 'call':
        return <Volume2 className="notif-icon-svg call-alert" size={20} />;
      default:
        return <Bell className="notif-icon-svg default" size={20} />;
    }
  };

  return (
    <div className={`mobile-notification-wrapper ${isAnimatingOut ? 'slide-up-out' : 'slide-down-in'}`}>
      <div className="mobile-notification-card glass-panel" onClick={handleTap}>
        <div className="notif-icon-container">
          {getIcon()}
          <span className="notif-badge-dot animate-pulse"></span>
        </div>
        <div className="notif-content">
          <div className="notif-title">{notification.title}</div>
          <div className="notif-body">{notification.body}</div>
        </div>
        <button 
          className="notif-close-btn" 
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        .mobile-notification-wrapper {
          position: fixed;
          top: 16px;
          left: 12px;
          right: 12px;
          z-index: 99999;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .mobile-notification-card {
          width: 100%;
          max-width: 480px;
          background: rgba(15, 17, 26, 0.85) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(99, 102, 241, 0.25) !important;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15);
          pointer-events: auto;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .mobile-notification-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(to bottom, #6366f1, #ec4899);
        }

        .mobile-notification-card:active {
          transform: scale(0.98);
          background: rgba(15, 17, 26, 0.95) !important;
        }

        .notif-icon-container {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .notif-icon-svg {
          stroke-width: 2.2px;
        }

        .notif-icon-svg.msg { color: #6366f1; }
        .notif-icon-svg.promote { color: #10b981; }
        .notif-icon-svg.demote { color: #f59e0b; }
        .notif-icon-svg.kick { color: #ef4444; }
        .notif-icon-svg.call-alert { color: #ec4899; }
        .notif-icon-svg.default { color: #a855f7; }

        .notif-badge-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 6px #ef4444;
        }

        .notif-content {
          flex-grow: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .notif-title {
          font-size: 14px;
          font-weight: 700;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-body {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-close-btn {
          background: transparent;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .notif-close-btn:hover {
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
        }

        /* Slide-down keyframes */
        .slide-down-in {
          animation: slideDownIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .slide-up-out {
          animation: slideUpOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideDownIn {
          from {
            transform: translateY(-80px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUpOut {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-80px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
