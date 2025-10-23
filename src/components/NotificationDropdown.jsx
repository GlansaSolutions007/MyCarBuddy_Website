import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import CryptoJS from 'crypto-js';
const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;

const NotificationDropdown = ({  }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const lastUnreadCountRef = useRef(0);
  const navigate = useNavigate();
  // Handle notification click: mark as read then navigate to bookings tab with target booking
  const handleNotificationClick = async (notification, isRead) => {
    try {
      if (!isRead) {
        await markAsRead(notification.id);
      }
    } finally {
      setIsOpen(false);
      // Notify other views (e.g., MyBookings) to refresh immediately
      try {
        window.dispatchEvent(new CustomEvent('notificationReceived'));
      } catch (_) { /* no-op */ }
      const targetBookingId = notification?.relatedId || notification?.bookingId || notification?.bookingID || '';
      if (targetBookingId) {
        navigate(`/profile?tab=mybookings&bookingId=${encodeURIComponent(targetBookingId)}`);
      } else {
        navigate('/profile?tab=mybookings');
      }
    }
  };
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;
  const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY;
  
  // Safely decrypt userId with error handling
  let decryptedUserId = null;
  if (user?.id && secretKey) {
    try {
      const bytes = CryptoJS.AES.decrypt(user.id, secretKey);
      decryptedUserId = bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("Error decrypting userId:", error);
      decryptedUserId = null;
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!decryptedUserId) {
      console.log('No userId provided to fetchNotifications');
      return;
    }
    
    console.log('Fetching notifications for userId:', decryptedUserId);
    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications(decryptedUserId);
      console.log('Notifications response:', response);
      if (response && Array.isArray(response)) {
        // Deduplicate notifications by message to prevent duplicates for the same event
        const uniqueNotifications = response.filter((item, index, self) =>
          index === self.findIndex((t) => t.message === item.message)
        );
        const newUnreadCount = uniqueNotifications.filter(n => !n.isRead).length;

        setNotifications(uniqueNotifications);
        setUnreadCount(newUnreadCount);
         if (newUnreadCount > lastUnreadCountRef.current) {
          // console.log('🔔 New notifications detected, dispatching notificationReceived event');
          window.dispatchEvent(new CustomEvent('notificationReceived'));
        }
        // Update stored unread count for next time
        lastUnreadCountRef.current = newUnreadCount;

      } else {
        console.log('Invalid response format:', response);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Monitor user changes and refetch notifications
  useEffect(() => {
    const handleUserUpdate = () => {
      // Re-fetch notifications when user profile is updated
      if (decryptedUserId) {
        fetchNotifications();
      }
    };

    window.addEventListener('userProfileUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('userProfileUpdated', handleUserUpdate);
    };
  }, [decryptedUserId]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId, decryptedUserId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    try {
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Format date and relative time safely
  const formatDate = (input) => {
    const raw = input || null;
    const date = raw ? new Date(raw) : null;
    if (!date || isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return 'Yesterday';

    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on component mount and when dropdown opens
  useEffect(() => {
    if (decryptedUserId) {
      fetchNotifications();
    }
  }, [decryptedUserId]);

  // Fetch notifications when dropdown opens (refresh)
  useEffect(() => {
    if (isOpen && decryptedUserId) {
      fetchNotifications();
    }
  }, [isOpen, decryptedUserId]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!decryptedUserId) return;
    
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [decryptedUserId]);

  if (!decryptedUserId) return null;

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <div
        className="p-0 position-relative"
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: '#116d6e', fontSize: '20px', border: 'none', background: 'none' , cursor: 'pointer'}}
        title="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span 
            className="badge bg-danger position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '10px', minWidth: '14px', height: '14px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="position-absolute rounded-4 shadow-lg"
          style={{ top: '100%', right: 0, width: 380, maxHeight: 480, zIndex: 1050, marginTop: 8, overflow: 'hidden', background: '#ffffff' }}
        >
          {/* Header */}
          <div
            className="d-flex justify-content-between align-items-center px-3 py-2"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)',
              color: '#fff'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <FaBell />
              <span className="fw-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge bg-light text-dark ms-2" style={{ borderRadius: 12 }}>{unreadCount}</span>
              )}
            </div>
            <div className="d-flex gap-2 align-items-center">
              {unreadCount > 0 && (
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{ width: 32, height: 32, borderRadius: '50%' , cursor: 'pointer' }}
                  onClick={markAllAsRead}
                  title="Mark all read"
                  aria-label="Mark all read"
                >
                  <FaCheck />
                </div>
              )}
              <div
                className=" text-white d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32, borderRadius: '50%' , cursor: 'pointer' }}
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close notifications"
              >
                <FaTimes />
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4 text-muted" style={{ background: 'linear-gradient(0deg, #ffffff 0%, #f8fafc 100%)' }}>
                <FaBell className="mb-2" style={{ fontSize: 28, opacity: 0.5 }} />
                <p className="mb-0">You're all caught up</p>
              </div>
            ) : (
              notifications
                .slice(0, 10)
                .map((n) => {
                  const timeLabel = formatDate(n.createdDate || n.createdAt || n.timestamp);
                  const unread = !n.isRead;
                  return (
                    <div
                      key={n.id}
                      className={`px-3 py-3 border-bottom ${unread ? '' : ''}`}
                      style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                      onClick={() => handleNotificationClick(n, n.isRead)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="d-flex align-items-start gap-3">
                        {/* Content */}
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="mb-1" style={{ fontSize: 14, fontWeight: unread ? 700 : 500 }}>{n.title}</h6>
                            {unread && <span className="rounded-circle" style={{ width: 8, height: 8, background: '#2563eb' }} />}
                          </div>
                          <p className="mb-1 text-muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{n.message}</p>
                          {timeLabel && (
                            <small className="text-muted" style={{ fontSize: 12 }}>{timeLabel}</small>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="text-center p-2 border-top bg-white">
              <small className="text-muted">Showing latest 10 notifications</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
