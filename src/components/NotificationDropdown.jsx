import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import { FaBell, FaTimes, FaCheck, FaClock, FaCalendarAlt } from 'react-icons/fa';
import CryptoJS from 'crypto-js';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const lastUnreadCountRef = useRef(0);
  const initialNotificationIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);
  const isClickOpenedRef = useRef(false); // Track if opened by click
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
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

  // Handle notification click: mark as read then navigate to bookings tab with target booking
  const handleNotificationClick = async (notification, isRead) => {
    try {
      if (!isRead) {
        await markAsRead(notification.id);
      }
    } finally {
      setIsOpen(false);
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

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!decryptedUserId) {
      console.log('No userId provided to fetchNotifications');
      return;
    }

    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications(decryptedUserId);
      if (response && Array.isArray(response)) {
        const uniqueNotifications = response.filter((item, index, self) =>
          index === self.findIndex((t) => t.message === item.message)
        );
        const newUnreadCount = uniqueNotifications.filter(n => !n.isRead).length;

        // On initial load, store all notification IDs to prevent showing popups for existing notifications
        if (isInitialLoadRef.current) {
          uniqueNotifications.forEach(n => {
            if (n.id) {
              initialNotificationIdsRef.current.add(n.id);
            }
          });
          isInitialLoadRef.current = false;
          setNotifications(uniqueNotifications);
          setUnreadCount(newUnreadCount);
          lastUnreadCountRef.current = newUnreadCount;
        } else {
          setNotifications(uniqueNotifications);
          setUnreadCount(newUnreadCount);
          
          // Only show popup if there are new notifications that weren't present on initial load
          if (newUnreadCount > lastUnreadCountRef.current) {
            window.dispatchEvent(new CustomEvent('notificationReceived'));
            
            // Find the newest unread notification that wasn't in the initial load
            const newestUnread = uniqueNotifications
              .filter(n => !n.isRead && !initialNotificationIdsRef.current.has(n.id))
              .sort((a, b) => {
                const dateA = new Date(a.createdDate || a.createdAt || a.timestamp || 0);
                const dateB = new Date(b.createdDate || b.createdAt || b.timestamp || 0);
                return dateB - dateA;
              })[0];
            
            if (newestUnread) {
              // Add to initial IDs so we don't show it again
              if (newestUnread.id) {
                initialNotificationIdsRef.current.add(newestUnread.id);
              }
              notificationService.showNotificationPopup(newestUnread);
            }
          }
          lastUnreadCountRef.current = newUnreadCount;
        }
      } else {
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
      if (decryptedUserId) {
        // Reset initial load tracking when user changes
        isInitialLoadRef.current = true;
        initialNotificationIdsRef.current.clear();
        fetchNotifications();
      }
    };
    window.addEventListener('userProfileUpdated', handleUserUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleUserUpdate);
  }, [decryptedUserId]);

  // Reset initial load tracking when userId changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    initialNotificationIdsRef.current.clear();
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

    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  // Handle click to toggle dropdown - works alongside hover
  const handleBellClick = (e) => {
    e.stopPropagation();
    const newState = !isOpen;
    setIsOpen(newState);
    isClickOpenedRef.current = newState; // Track if opened by click
  };

  // Handle mouse enter (hover) - opens on hover, works alongside click
  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  // Handle mouse leave - close when mouse leaves, but respect click state
  const handleMouseLeave = () => {
    // If opened by click, keep it open even when mouse leaves
    // If opened by hover only, close it
    if (!isClickOpenedRef.current) {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        isClickOpenedRef.current = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on component mount
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
    }, 30000);
    return () => clearInterval(interval);
  }, [decryptedUserId]);

  if (!decryptedUserId) return null;

  return (
    <div 
      className="notif-container" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Notification Bell Icon */}
      <button
        className="notif-bell"
        onClick={handleBellClick}
        title="Notifications"
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div className={`notif-dropdown ${isOpen ? 'active' : ''}`}>
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-left">
              <div className="notif-header-icon">
                <FaBell />
              </div>
              <div>
                <h4 className="notif-header-title">Notifications</h4>
              </div>
              {unreadCount > 0 && (
                <span className="notif-header-count">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  className="notif-header-btn"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <FaCheck />
                </button>
              )}
              <button
                className="notif-header-btn notif-close-btn-mobile"
                onClick={() => {
                  setIsOpen(false);
                  isClickOpenedRef.current = false;
                }}
                title="Close"
                aria-label="Close notifications"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="notif-list">
            {loading ? (
              <div className="notif-loading">
                <div className="notif-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">
                  <FaBell />
                </div>
                <h4>All Caught Up!</h4>
                <p>You have no new notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const timeLabel = formatDate(n.createdDate || n.createdAt || n.timestamp);
                const isUnread = !n.isRead;
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(n, n.isRead)}
                  >
                    <div className="notif-icon">
                      <FaCalendarAlt />
                    </div>
                    <div className="notif-content">
                      <div className="notif-title-row">
                        <h5 className="notif-title">{n.title}</h5>
                        {isUnread && <span className="notif-unread-dot"></span>}
                      </div>
                      <p className="notif-message">{n.message}</p>
                      {timeLabel && (
                        <span className="notif-time">
                          <FaClock /> {timeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="notif-footer">
              <p>Showing latest 10 notifications</p>
            </div>
          )}
        </div>
    </div>
  );
};

export default NotificationDropdown;
