import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaCalendarAlt, FaClock } from 'react-icons/fa';
import './NotificationPopup.css';

const NotificationPopup = () => {
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Format date and relative time safely
  const formatDate = (input) => {
    const raw = input || null;
    const date = raw ? new Date(raw) : null;
    if (!date || isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';

    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  // Listen for new notification events
  useEffect(() => {
    const handleNewNotification = (event) => {
      if (event.detail && event.detail.notification) {
        showNotification(event.detail.notification);
      }
    };

    // Listen for custom event to show notification
    window.addEventListener('showNotificationPopup', handleNewNotification);

    return () => {
      window.removeEventListener('showNotificationPopup', handleNewNotification);
    };
  }, []);

  const showNotification = (notif) => {
    setNotification(notif);
    setIsVisible(true);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideNotification();
    }, 5000);
  };

  const hideNotification = () => {
    setIsVisible(false);
    // Wait for animation to complete before clearing notification
    setTimeout(() => {
      setNotification(null);
    }, 300);
  };

  if (!notification) return null;

  const timeLabel = formatDate(
    notification.createdDate || 
    notification.createdAt || 
    notification.timestamp
  );

  return (
    <div className={`notification-popup ${isVisible ? 'visible' : ''}`}>
      <div className="notification-popup-content">
        <div className="notification-popup-header">
          <div className="notification-popup-icon-wrapper">
            <FaBell className="notification-popup-icon" />
          </div>
          <button
            className="notification-popup-close"
            onClick={hideNotification}
            aria-label="Close notification"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="notification-popup-body">
          <div className="notification-popup-title-row">
            <FaCalendarAlt className="notification-popup-calendar-icon" />
            <h5 className="notification-popup-title">
              {notification.title || 'New Notification'}
            </h5>
          </div>
          
          <p className="notification-popup-message">
            {notification.message || 'You have a new notification'}
          </p>
          
          {timeLabel && (
            <div className="notification-popup-time">
              <FaClock /> <span>{timeLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;


