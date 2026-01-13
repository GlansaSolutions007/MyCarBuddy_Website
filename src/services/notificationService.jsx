// Toast notifications can be added later if needed
import axios from 'axios';


// Notification service class
class NotificationService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL;
  }



  // Get user notifications
  async getUserNotifications(userId) {
    try {
      // userId is now already decrypted from HeaderOne
      const url = `${this.baseUrl}Bookings/notifications?userId=${userId}&userRole=customer`;
      console.log('Notification API URL:', url);
      console.log('Using decrypted userId:', userId);
      const response = await axios.get(url);
      // console.log('Notification API Raw Response:', response.data);
      const payload = response?.data;
      // Normalize: backend may return an array or an object with { success, data }
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.data)) return payload.data;
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      // userId is now already decrypted from HeaderOne
      const response = await axios.put(`${this.baseUrl}Bookings/notifications/${notificationId}/read`, null, {
        params: { userId: userId, userRole: "customer" },
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Event-specific notification methods removed per request

  // Show toast notification for immediate feedback
  showToastNotification(title, message, type = 'info') {
    // Simple console log for now - can be enhanced with toast notifications later
    console.log(`Notification: ${title} - ${message}`);
  }

  // Show side popup notification
  showNotificationPopup(notification) {
    try {
      // Dispatch custom event to show notification popup
      window.dispatchEvent(new CustomEvent('showNotificationPopup', {
        detail: { notification }
      }));
    } catch (error) {
      console.error('Error showing notification popup:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
